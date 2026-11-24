import {
  AlertCircle,
  Calendar,
  Check,
  Flag,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { Task, TaskPriority } from '../types/task';
import {
  formatDisplayDate,
  isTaskDueToday,
  isTaskOverdue,
} from '../utils/date';

interface TaskCardProps {
  task: Task;
  isBusy: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onRequestDelete: (task: Task) => void;
}

const PRIORITY_STYLES: Record<
  TaskPriority,
  { textClass: string; iconClass: string; label: string }
> = {
  High: {
    textClass: 'text-red-700 font-medium',
    iconClass: 'text-red-600',
    label: 'High priority',
  },
  Medium: {
    textClass: 'text-amber-700 font-medium',
    iconClass: 'text-amber-600',
    label: 'Medium priority',
  },
  Low: {
    textClass: 'text-slate-600',
    iconClass: 'text-slate-400',
    label: 'Low priority',
  },
};

export function TaskCard({
  task,
  isBusy,
  onToggleStatus,
  onEdit,
  onRequestDelete,
}: TaskCardProps) {
  const isCompleted = task.status === 'Completed';
  const overdue = isTaskOverdue(task);
  const dueToday = isTaskDueToday(task);
  const priorityInfo = PRIORITY_STYLES[task.priority];

  return (
    <article
      className={`group rounded-xl border px-4 py-4 transition-colors duration-150 sm:px-5 ${
        overdue
          ? 'border-red-200 bg-red-50/35 hover:border-red-300'
          : isCompleted
            ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
            : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <button
          type="button"
          onClick={() => onToggleStatus(task)}
          disabled={isBusy}
          aria-label={
            isCompleted
              ? `Mark "${task.title}" as pending`
              : `Mark "${task.title}" as completed`
          }
          aria-pressed={isCompleted}
          className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
              isCompleted
                ? 'border-emerald-600 bg-emerald-600 text-white'
                : overdue
                  ? 'border-red-400 bg-white group-hover:border-red-600'
                  : 'border-slate-300 bg-white group-hover:border-blue-600'
            }`}
          >
            {isCompleted && <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />}
          </span>
        </button>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h3
                className={`text-base font-semibold leading-snug break-words ${
                  isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p
                  className={`mt-1 text-sm leading-relaxed break-words ${
                    isCompleted ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:ml-4">
              <button
                type="button"
                onClick={() => onEdit(task)}
                disabled={isBusy}
                aria-label={`Edit "${task.title}"`}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => onRequestDelete(task)}
                disabled={isBusy}
                aria-label={`Delete "${task.title}"`}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
            <span className={`inline-flex items-center gap-1.5 ${priorityInfo.textClass}`}>
              <Flag className={`h-3.5 w-3.5 ${priorityInfo.iconClass}`} aria-hidden="true" />
              <span>{priorityInfo.label}</span>
            </span>

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>

            <span
              className={`inline-flex items-center gap-1.5 font-mono tabular-nums ${
                overdue
                  ? 'font-semibold text-red-700'
                  : dueToday
                    ? 'font-semibold text-amber-700'
                    : 'text-slate-500'
              }`}
            >
              {overdue ? (
                <AlertCircle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
              ) : (
                <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              )}
              <span>
                {overdue
                  ? `Overdue (${formatDisplayDate(task.due_date)})`
                  : dueToday
                    ? `Due today (${formatDisplayDate(task.due_date)})`
                    : task.due_date
                      ? `Due ${formatDisplayDate(task.due_date)}`
                      : 'No due date'}
              </span>
            </span>

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>

            <span className={isCompleted ? 'font-medium text-emerald-700' : 'text-slate-500'}>
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
