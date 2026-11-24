import type { Task, TaskInput, TaskUpdateInput } from '../types/task';

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message =
      data &&
      typeof data === 'object' &&
      'error' in data &&
      typeof (data as { error: unknown }).error === 'string'
        ? (data as { error: string }).error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch('/api/tasks', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse<{ tasks: Task[] }>(response);
  return data.tasks;
}

export async function fetchTaskById(id: number): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  return parseJsonResponse<Task>(response);
}

export async function createTaskApi(input: TaskInput): Promise<Task> {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
  return parseJsonResponse<Task>(response);
}

export async function updateTaskApi(id: number, input: TaskUpdateInput): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(input),
  });
  return parseJsonResponse<Task>(response);
}

export async function deleteTaskApi(id: number): Promise<{ deleted: boolean; id: number }> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  });
  return parseJsonResponse<{ deleted: boolean; id: number }>(response);
}
