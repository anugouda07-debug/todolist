export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'Pending' | 'Completed';

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export interface TaskUpdateInput {
  title?: string;
  description?: string;
  due_date?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
}

export type NavSection = 'dashboard' | 'all' | 'pending' | 'completed';
export type PriorityFilter = 'All' | TaskPriority;
export type SortOption = 'smart' | 'due_asc' | 'priority_desc' | 'newest';
