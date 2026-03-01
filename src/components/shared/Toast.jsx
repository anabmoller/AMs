import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const TOAST_VARIANTS = {
  success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  error: 'bg-red-500/15 border-red-500/30 text-red-400',
  warning: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  info: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
};

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, variant = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl border backdrop-blur-xl flex items-center gap-2.5 text-sm font-medium shadow-lg animate-slide-up cursor-pointer ${TOAST_VARIANTS[toast.variant] || TOAST_VARIANTS.info}`}
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span className="text-base">{TOAST_ICONS[toast.variant] || TOAST_ICONS.info}</span>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook para mostrar toasts
 * @returns {{ showToast: (message: string, variant?: string, duration?: number) => void }}
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { showToast: () => {} };
  }
  return context;
}
