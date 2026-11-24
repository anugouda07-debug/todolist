import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Task, TaskInput, TaskPriority, TaskStatus } from '../types/task';

interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: TaskInput) => Promise<void>;
}

const PRIORITIES: TaskPriority[] = ['Low', 'Medium', 'High'];
const STATUSES: TaskStatus[] = ['Pending', 'Completed'];

export function TaskModal({
  isOpen,
  editingTask,
  isSubmitting,
  onClose,
  onSubmit,
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setDueDate(editingTask.due_date || '');
      setPriority(editingTask.priority);
      setStatus(editingTask.status);
    } else {
      setTitle('');
      setDescription('');
      setDueDate('');
      setPriority('Medium');
      setStatus('Pending');
    }
    setErrorMessage(null);
  }, [isOpen, editingTask]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Please enter a task title.');
      return;
    }
    if (trimmedTitle.length > 160) {
      setErrorMessage('Title must be 160 characters or fewer.');
      return;
    }

    setErrorMessage(null);
    await onSubmit({
      title: trimmedTitle,
      description: description.trim(),
      due_date: dueDate ? dueDate : null,
      priority,
      status,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-heading"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <h2
            id="task-modal-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {errorMessage}
            </div>
          )}

          <div>
            <label
              htmlFor="task-title-input"
              className="block text-sm font-medium text-slate-700"
            >
              Title <span className="text-red-600">*</span>
            </label>
            <input
              id="task-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finalize Q4 release checklist"
              maxLength={160}
              autoFocus
              required
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div>
            <label
              htmlFor="task-description-input"
              className="block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="task-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key details, deliverables, or context..."
              maxLength={2000}
              className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="task-due-date-input"
                className="block text-sm font-medium text-slate-700"
              >
                Due Date
              </label>
              <input
                id="task-due-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700">Status</span>
              <div className="mt-1.5 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {STATUSES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setStatus(option)}
                    className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      status === option
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700">Priority</span>
            <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
              {PRIORITIES.map((level) => {
                const isActive = priority === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`min-h-[36px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[40px] items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isSubmitting
                ? editingTask
                  ? 'Saving...'
                  : 'Adding...'
                : editingTask
                  ? 'Save Changes'
                  : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
