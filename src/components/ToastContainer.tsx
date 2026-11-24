import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            role="status"
            className={`flex items-start gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg transition-all duration-150 ${
              isSuccess ? 'border-emerald-200 text-slate-900' : 'border-red-200 text-slate-900'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
            ) : (
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                aria-hidden="true"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900">
                {isSuccess ? 'Success' : 'Error'}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
