import React from 'react';
import { useNegotiation } from '../../context/NegotiationContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useNegotiation();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const typeStyles = {
          success: 'bg-primary-container text-white border-primary-fixed',
          error: 'bg-error text-on-error border-error-container',
          info: 'bg-surface-container-highest text-on-surface border-outline-variant',
        };

        const iconMap = {
          success: 'check_circle',
          error: 'warning',
          info: 'notifications',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg shadow-elevation-3 border animate-slide-up ${
              typeStyles[toast.type] || typeStyles.info
            }`}
          >
            <span className="material-symbols-outlined text-[22px] flex-shrink-0 mt-0.5">
              {iconMap[toast.type] || 'info'}
            </span>
            <div className="flex-1">
              <h4 className="text-sm font-bold leading-tight">{toast.title}</h4>
              <p className="text-xs opacity-90 mt-0.5">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-current opacity-70 hover:opacity-100 p-0.5"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
