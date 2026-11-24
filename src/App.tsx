import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  ClipboardList,
  Menu,
  Plus,
  Search,
  X,
} from 'lucide-react';
import {
  createTaskApi,
  deleteTaskApi,
  fetchTaskById,
  fetchTasks,
  updateTaskApi,
} from './api/tasks';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { MetricsOverview } from './components/MetricsOverview';
import { Sidebar } from './components/Sidebar';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { ToastContainer, type ToastMessage } from './components/ToastContainer';
import type {
  NavSection,
  PriorityFilter,
  SortOption,
  Task,
  TaskInput,
  TaskPriority,
} from './types/task';
import { isTaskOverdue } from './utils/date';

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const SECTION_HEADINGS: Record<NavSection, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Overview of your daily priorities, progress, and active tasks.',
  },
  all: {
    title: 'All Tasks',
    subtitle: 'Complete list of pending and completed tasks.',
  },
  pending: {
    title: 'Pending Tasks',
    subtitle: 'Open action items ordered by urgency and due date.',
  },
  completed: {
    title: 'Completed Tasks',
    subtitle: 'Archive of finished work.',
  },
};

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<
    'All' | 'Pending' | 'Completed'
  >('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('smart');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmittingModal, setIsSubmittingModal] = useState(false);

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [busyTaskIds, setBusyTaskIds] = useState<Set<number>>(new Set());

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = useCallback((type: 'success' | 'error', message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const loadAllTasks = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load tasks from the server.';
      setLoadError(message);
      pushToast('error', message);
    } finally {
      setIsLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    void loadAllTasks();
  }, [loadAllTasks]);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const pending = total - completed;
    const overdue = tasks.filter((t) => isTaskOverdue(t)).length;
    const completionPercent = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, pending, overdue, completionPercent };
  }, [tasks]);

  const effectiveStatusFilter: 'All' | 'Pending' | 'Completed' = useMemo(() => {
    if (activeSection === 'pending') return 'Pending';
    if (activeSection === 'completed') return 'Completed';
    if (activeSection === 'all') return 'All';
    return dashboardStatusFilter;
  }, [activeSection, dashboardStatusFilter]);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = tasks.filter((task) => {
      if (effectiveStatusFilter !== 'All' && task.status !== effectiveStatusFilter) {
        return false;
      }
      if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
        return false;
      }
      if (normalizedSearch && !task.title.toLowerCase().includes(normalizedSearch)) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.id - a.id;
      }
      if (sortBy === 'priority_desc') {
        const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
        if (weightDiff !== 0) return weightDiff;
        return b.id - a.id;
      }
      if (sortBy === 'due_asc') {
        if (!a.due_date && !b.due_date) return b.id - a.id;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date) || b.id - a.id;
      }

      // Smart sort: Pending before Completed, Overdue first, earliest due date, then highest priority
      if (a.status !== b.status) {
        return a.status === 'Pending' ? -1 : 1;
      }
      const aOverdue = isTaskOverdue(a);
      const bOverdue = isTaskOverdue(b);
      if (aOverdue !== bOverdue) {
        return aOverdue ? -1 : 1;
      }
      if (a.due_date && b.due_date) {
        const dateCmp = a.due_date.localeCompare(b.due_date);
        if (dateCmp !== 0) return dateCmp;
      } else if (a.due_date !== b.due_date) {
        return a.due_date ? -1 : 1;
      }
      const pDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (pDiff !== 0) return pDiff;
      return b.id - a.id;
    });

    return sorted;
  }, [tasks, effectiveStatusFilter, priorityFilter, searchQuery, sortBy]);

  const openCreateModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const openEditModal = async (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
    try {
      const latest = await fetchTaskById(task.id);
      setEditingTask(latest);
    } catch {
      // Keep the current local task object if refresh fails
    }
  };

  const handleModalSubmit = async (input: TaskInput) => {
    setIsSubmittingModal(true);
    try {
      if (editingTask) {
        const updated = await updateTaskApi(editingTask.id, input);
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        pushToast('success', `Updated "${updated.title}".`);
      } else {
        const created = await createTaskApi(input);
        setTasks((prev) => [created, ...prev]);
        pushToast('success', `Added "${created.title}".`);
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save task.';
      pushToast('error', message);
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const nextStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    setBusyTaskIds((prev) => new Set(prev).add(task.id));
    try {
      const updated = await updateTaskApi(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      pushToast(
        'success',
        nextStatus === 'Completed'
          ? `Marked "${updated.title}" as completed.`
          : `Reopened "${updated.title}" as pending.`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update task status.';
      pushToast('error', message);
    } finally {
      setBusyTaskIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    const target = taskToDelete;
    setIsDeleting(true);
    try {
      await deleteTaskApi(target.id);
      setTasks((prev) => prev.filter((t) => t.id !== target.id));
      setTaskToDelete(null);
      pushToast('success', `Deleted "${target.title}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to delete task.';
      pushToast('error', message);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPriorityFilter('All');
    if (activeSection === 'dashboard') {
      setDashboardStatusFilter('All');
    } else {
      setActiveSection('all');
    }
  };

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    priorityFilter !== 'All' ||
    (activeSection === 'dashboard' && dashboardStatusFilter !== 'All');

  const sectionMeta = SECTION_HEADINGS[activeSection];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        counts={{
          all: metrics.total,
          pending: metrics.pending,
          completed: metrics.completed,
        }}
        completionPercent={metrics.completionPercent}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 lg:hidden"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h1 className="font-display truncate text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                  {sectionMeta.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative hidden w-64 sm:block md:w-72">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks by title..."
                  aria-label="Search tasks by title"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <p className="mb-6 text-sm text-slate-600">{sectionMeta.subtitle}</p>

          {/* Mobile Search Bar */}
          <div className="relative mb-5 sm:hidden">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks by title..."
              aria-label="Search tasks by title"
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {activeSection === 'dashboard' && (
            <div className="mb-6 space-y-4">
              <MetricsOverview
                total={metrics.total}
                pending={metrics.pending}
                completed={metrics.completed}
                overdue={metrics.overdue}
                completionPercent={metrics.completionPercent}
              />

              {metrics.overdue > 0 && (
                <div
                  role="region"
                  aria-label="Overdue alert"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3"
                >
                  <div className="flex items-center gap-2.5 text-sm text-red-800">
                    <AlertTriangle
                      className="h-4 w-4 shrink-0 text-red-600"
                      aria-hidden="true"
                    />
                    <span>
                      You have{' '}
                      <strong className="font-semibold tabular-nums">
                        {metrics.overdue}
                      </strong>{' '}
                      overdue {metrics.overdue === 1 ? 'task' : 'tasks'} past due date.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDashboardStatusFilter('Pending');
                      setPriorityFilter('All');
                      setSortBy('due_asc');
                    }}
                    className="text-xs font-semibold text-red-700 underline-offset-4 hover:underline whitespace-nowrap shrink-0"
                  >
                    Focus overdue tasks
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter & Sort Toolbar */}
          <section
            aria-label="Task filters"
            className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
          >
            <div className="flex flex-wrap items-center gap-2">
              {(activeSection === 'dashboard' || activeSection === 'all') && (
                <div
                  role="group"
                  aria-label="Filter by status"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
                >
                  {(['All', 'Pending', 'Completed'] as const).map((statusOption) => {
                    const currentStatus =
                      activeSection === 'dashboard'
                        ? dashboardStatusFilter
                        : 'All';
                    const isSelected =
                      activeSection === 'dashboard'
                        ? currentStatus === statusOption
                        : statusOption === 'All';

                    const handleStatusClick = () => {
                      if (activeSection === 'dashboard') {
                        setDashboardStatusFilter(statusOption);
                      } else if (statusOption === 'All') {
                        setActiveSection('all');
                      } else if (statusOption === 'Pending') {
                        setActiveSection('pending');
                      } else {
                        setActiveSection('completed');
                      }
                    };

                    return (
                      <button
                        key={statusOption}
                        type="button"
                        onClick={handleStatusClick}
                        className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {statusOption === 'All' ? 'All Tasks' : statusOption}
                      </button>
                    );
                  })}
                </div>
              )}

              <div
                role="group"
                aria-label="Filter by priority"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1"
              >
                {(['All', 'High', 'Medium', 'Low'] as const).map((pOption) => (
                  <button
                    key={pOption}
                    type="button"
                    onClick={() => setPriorityFilter(pOption)}
                    className={`min-h-[34px] rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      priorityFilter === pOption
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {pOption === 'All' ? 'All Priorities' : pOption}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="font-mono text-xs tabular-nums text-slate-500">
                {filteredTasks.length}{' '}
                {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </span>
              <div className="relative inline-flex items-center">
                <ArrowUpDown
                  className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  aria-label="Sort tasks"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="h-9 rounded-lg border border-slate-200 bg-white pl-8 pr-7 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                >
                  <option value="smart">Sort: Smart order</option>
                  <option value="due_asc">Sort: Due date</option>
                  <option value="priority_desc">Sort: Highest priority</option>
                  <option value="newest">Sort: Recently created</option>
                </select>
              </div>
            </div>
          </section>

          {/* Task List Content */}
          {isLoading ? (
            <div className="space-y-3" aria-label="Loading tasks">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-24 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="h-4 w-1/3 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-2/3 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-xl border border-red-200 bg-white px-6 py-12 text-center">
              <AlertTriangle
                className="mx-auto h-8 w-8 text-red-600"
                aria-hidden="true"
              />
              <h2 className="mt-3 font-display text-base font-semibold text-slate-900">
                Unable to load tasks
              </h2>
              <p className="mt-1 text-sm text-slate-600">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadAllTasks()}
                className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 whitespace-nowrap shrink-0"
              >
                Retry
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <ClipboardList className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-display text-base font-semibold text-slate-900">
                {tasks.length === 0
                  ? 'No tasks yet'
                  : 'No tasks match your current filters'}
              </h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {tasks.length === 0
                  ? 'Create your first task with a title, due date, and priority to start tracking your daily work.'
                  : 'Try clearing your search query or adjusting the priority and status filters.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {hasActiveFilters && tasks.length > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
                  >
                    Clear filters
                  </button>
                )}
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{tasks.length === 0 ? 'Add Your First Task' : 'Add Task'}</span>
                </button>
              </div>
            </div>
          ) : (
            <section aria-label="Task list" className="space-y-3">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isBusy={busyTaskIds.has(task.id)}
                  onToggleStatus={(t) => void handleToggleStatus(t)}
                  onEdit={(t) => void openEditModal(t)}
                  onRequestDelete={(t) => setTaskToDelete(t)}
                />
              ))}
            </section>
          )}
        </main>
      </div>

      <TaskModal
        isOpen={isTaskModalOpen}
        editingTask={editingTask}
        isSubmitting={isSubmittingModal}
        onClose={() => {
          if (!isSubmittingModal) {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }
        }}
        onSubmit={handleModalSubmit}
      />

      <DeleteConfirmModal
        task={taskToDelete}
        isDeleting={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => {
          if (!isDeleting) {
            setTaskToDelete(null);
          }
        }}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
