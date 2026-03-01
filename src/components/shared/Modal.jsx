import { useEffect, useCallback } from 'react';

/**
 * Modal base reutilizable — dark mode
 */
export default function Modal({ children, onClose, title, maxWidth = 'max-w-lg', className = '' }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose?.();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-start justify-center pt-[10vh] px-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Modal'}
    >
      <div
        onClick={e => e.stopPropagation()}
        className={`bg-[#12131a] border border-white/[0.08] rounded-2xl w-full ${maxWidth} max-h-[80vh] overflow-auto shadow-2xl animate-slide-up ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center text-slate-400 hover:text-white transition-colors text-sm"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
