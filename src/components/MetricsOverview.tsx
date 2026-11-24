interface MetricsOverviewProps {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  completionPercent: number;
}

export function MetricsOverview({
  total,
  pending,
  completed,
  overdue,
  completionPercent,
}: MetricsOverviewProps) {
  const metrics = [
    {
      label: 'Total Tasks',
      value: total,
      detail: 'All recorded items',
      accentClass: 'text-slate-900',
    },
    {
      label: 'Pending',
      value: pending,
      detail: 'Active in queue',
      accentClass: 'text-slate-900',
    },
    {
      label: 'Completed',
      value: completed,
      detail: 'Finished tasks',
      accentClass: 'text-emerald-600',
    },
    {
      label: 'Overdue',
      value: overdue,
      detail: overdue > 0 ? 'Requires attention' : 'On schedule',
      accentClass: overdue > 0 ? 'text-red-600' : 'text-slate-900',
    },
  ];

  return (
    <section aria-label="Task metrics overview" className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5"
          >
            <p className="text-xs font-medium text-slate-500">{metric.label}</p>
            <p
              className={`mt-1.5 font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl ${metric.accentClass}`}
            >
              {metric.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{metric.detail}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Completion Progress</h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {completed} completed · {pending} remaining
            </p>
          </div>
          <span className="font-mono text-sm font-semibold tabular-nums text-blue-600">
            {completionPercent}%
          </span>
        </div>
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Task completion progress"
        >
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>
    </section>
  );
}
