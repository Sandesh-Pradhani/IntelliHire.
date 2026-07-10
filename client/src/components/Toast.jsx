import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const TOAST_CONFIG = {
  success: { icon: CheckCircle, color: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800' },
  error: { icon: XCircle, color: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800' },
  info: { icon: Info, color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800' },
  warning: { icon: AlertTriangle, color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800' },
};

const MAX_TOASTS = 5;
const DISMISS_MS = 4000;

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const toast = useCallback(({ type = 'info', message }) => {
    const id = ++toastId;
    setToasts((prev) => {
      const next = [...prev, { id, type, message, removing: false }];
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
    });
    setTimeout(() => dismiss(id), DISMISS_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => {
          const cfg = TOAST_CONFIG[t.type] || TOAST_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-sm
                ${cfg.bg} ${cfg.border}
                transition-all duration-300 ease-in-out
                ${t.removing ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}`}
            >
              <Icon className={`${cfg.color} shrink-0 mt-0.5`} size={18} />
              <p className={`flex-1 text-sm font-medium ${cfg.text}`}>{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className={`shrink-0 ${cfg.text} opacity-60 hover:opacity-100 transition-opacity`}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
