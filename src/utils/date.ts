import type { Task } from '../types/task';

export function getLocalTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTaskOverdue(task: Pick<Task, 'due_date' | 'status'>): boolean {
  if (!task.due_date || task.status === 'Completed') {
    return false;
  }
  return task.due_date < getLocalTodayIso();
}

export function isTaskDueToday(task: Pick<Task, 'due_date' | 'status'>): boolean {
  if (!task.due_date || task.status === 'Completed') {
    return false;
  }
  return task.due_date === getLocalTodayIso();
}

export function formatDisplayDate(isoDate: string | null): string {
  if (!isoDate) {
    return 'No due date';
  }
  const parts = isoDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return isoDate;
  }
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
