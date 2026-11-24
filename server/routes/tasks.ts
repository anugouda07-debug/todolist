import { Router, type Request, type Response } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
} from '../db.ts';
import type { TaskPriority, TaskStatus } from '../../src/types/task.ts';

const VALID_PRIORITIES = new Set<TaskPriority>(['Low', 'Medium', 'High']);
const VALID_STATUSES = new Set<TaskStatus>(['Pending', 'Completed']);
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseId(rawId: string): number | null {
  if (!/^\d+$/.test(rawId)) {
    return null;
  }
  const parsed = Number(rawId);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function isValidIsoDate(value: string): boolean {
  if (!DATE_REGEX.test(value)) {
    return false;
  }
  const [yearStr, monthStr, dayStr] = value.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export const tasksRouter = Router();

// GET /api/tasks - Retrieve all tasks (supports optional status, priority, q filters)
tasksRouter.get('/', (req: Request, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined;
    const search = typeof req.query.q === 'string' ? req.query.q : undefined;

    if (status && status !== 'All' && !VALID_STATUSES.has(status as TaskStatus)) {
      return res.status(400).json({ error: 'Invalid status filter. Must be Pending or Completed.' });
    }

    if (priority && priority !== 'All' && !VALID_PRIORITIES.has(priority as TaskPriority)) {
      return res.status(400).json({ error: 'Invalid priority filter. Must be Low, Medium, or High.' });
    }

    const tasks = listTasks({ status, priority, search });
    return res.status(200).json({ tasks });
  } catch (err) {
    console.error('GET /api/tasks failed:', err);
    return res.status(500).json({ error: 'Failed to retrieve tasks from database.' });
  }
});

// GET /api/tasks/:id - Retrieve a specific task
tasksRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID. Must be a positive integer.' });
    }

    const task = getTaskById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.status(200).json(task);
  } catch (err) {
    console.error('GET /api/tasks/:id failed:', err);
    return res.status(500).json({ error: 'Failed to retrieve task from database.' });
  }
});

// POST /api/tasks - Create a task
tasksRouter.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a valid JSON object.' });
    }

    const rawTitle = typeof body.title === 'string' ? body.title.trim() : '';
    if (!rawTitle) {
      return res.status(400).json({ error: 'Task title is required.' });
    }
    if (rawTitle.length > 160) {
      return res.status(400).json({ error: 'Task title must be 160 characters or fewer.' });
    }

    const rawDescription =
      typeof body.description === 'string' ? body.description.trim() : '';
    if (rawDescription.length > 2000) {
      return res.status(400).json({ error: 'Description must be 2000 characters or fewer.' });
    }

    let dueDate: string | null = null;
    if (body.due_date !== undefined && body.due_date !== null && body.due_date !== '') {
      if (typeof body.due_date !== 'string' || !isValidIsoDate(body.due_date)) {
        return res.status(400).json({ error: 'Due date must be a valid YYYY-MM-DD date.' });
      }
      dueDate = body.due_date;
    }

    const priority: TaskPriority =
      body.priority === undefined ? 'Medium' : (body.priority as TaskPriority);
    if (!VALID_PRIORITIES.has(priority)) {
      return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
    }

    const status: TaskStatus =
      body.status === undefined ? 'Pending' : (body.status as TaskStatus);
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Status must be Pending or Completed.' });
    }

    const created = createTask({
      title: rawTitle,
      description: rawDescription,
      due_date: dueDate,
      priority,
      status,
    });

    return res.status(201).json(created);
  } catch (err) {
    console.error('POST /api/tasks failed:', err);
    return res.status(500).json({ error: 'Failed to create task.' });
  }
});

// PUT /api/tasks/:id - Update a task
tasksRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID. Must be a positive integer.' });
    }

    const existing = getTaskById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const body = req.body as Record<string, unknown>;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body must be a valid JSON object.' });
    }

    let title = existing.title;
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || !body.title.trim()) {
        return res.status(400).json({ error: 'Task title cannot be empty.' });
      }
      const trimmedTitle = body.title.trim();
      if (trimmedTitle.length > 160) {
        return res.status(400).json({ error: 'Task title must be 160 characters or fewer.' });
      }
      title = trimmedTitle;
    }

    let description = existing.description;
    if (body.description !== undefined) {
      if (typeof body.description !== 'string') {
        return res.status(400).json({ error: 'Description must be a string.' });
      }
      const trimmedDesc = body.description.trim();
      if (trimmedDesc.length > 2000) {
        return res.status(400).json({ error: 'Description must be 2000 characters or fewer.' });
      }
      description = trimmedDesc;
    }

    let dueDate = existing.due_date;
    if (body.due_date !== undefined) {
      if (body.due_date === null || body.due_date === '') {
        dueDate = null;
      } else if (typeof body.due_date === 'string' && isValidIsoDate(body.due_date)) {
        dueDate = body.due_date;
      } else {
        return res.status(400).json({ error: 'Due date must be a valid YYYY-MM-DD date or null.' });
      }
    }

    let priority = existing.priority;
    if (body.priority !== undefined) {
      if (
        typeof body.priority !== 'string' ||
        !VALID_PRIORITIES.has(body.priority as TaskPriority)
      ) {
        return res.status(400).json({ error: 'Priority must be Low, Medium, or High.' });
      }
      priority = body.priority as TaskPriority;
    }

    let status = existing.status;
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !VALID_STATUSES.has(body.status as TaskStatus)) {
        return res.status(400).json({ error: 'Status must be Pending or Completed.' });
      }
      status = body.status as TaskStatus;
    }

    const updated = updateTask(id, {
      title,
      description,
      due_date: dueDate,
      priority,
      status,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error('PUT /api/tasks/:id failed:', err);
    return res.status(500).json({ error: 'Failed to update task.' });
  }
});

// DELETE /api/tasks/:id - Delete a task
tasksRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (id === null) {
      return res.status(400).json({ error: 'Invalid task ID. Must be a positive integer.' });
    }

    const deleted = deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    return res.status(200).json({ deleted: true, id });
  } catch (err) {
    console.error('DELETE /api/tasks/:id failed:', err);
    return res.status(500).json({ error: 'Failed to delete task.' });
  }
});
