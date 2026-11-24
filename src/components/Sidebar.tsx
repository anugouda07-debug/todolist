import {
  CheckCircle2,
  Clock,
  LayoutDashboard,
  ListTodo,
  X,
} from 'lucide-react';
import type { NavSection } from '../types/task';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  counts: {
    all: number;
    pending: number;
    completed: number;
  };
  completionPercent: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeSection,
  onSelectSection,
  counts,
  completionPercent,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: NavSection;
    label: string;
    count?: number;
    icon: typeof LayoutDashboard;
  }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'all', label: 'All Tasks', count: counts.all, icon: ListTodo },
    { id: 'pending', label: 'Pending', count: counts.pending, icon: Clock },
    { id: 'completed', label: 'Completed', count: counts.completed, icon: CheckCircle2 },
  ];

  const handleSelect = (section: NavSection) => {
    onSelectSection(section);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white px-4 py-6">
      <div>
        <div className="flex items-center justify-between px-2 pb-6">
          <button
            type="button"
            onClick={() => handleSelect('dashboard')}
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Taskflow
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-[42px] w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      isActive ? 'text-slate-200' : 'text-slate-400'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 pt-5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-slate-600">Completion rate</span>
          <span className="font-mono font-semibold tabular-nums text-slate-900">
            {completionPercent}%
          </span>
        </div>
        <div
          className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Overall task completion percentage"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-transform duration-300 ease-out origin-left"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-slate-500 tabular-nums">
          {counts.completed} of {counts.all} tasks completed
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
