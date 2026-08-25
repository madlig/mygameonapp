import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastItem = ({ toast, onDismiss }) => {
  useEffect(() => {
    // Auto dismiss after 4 seconds (max 5s)
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-in ${
        isSuccess
          ? 'bg-[#0D1410]/95 border-accent-green/30 text-text-primary'
          : isError
          ? 'bg-[#180C0E]/95 border-accent-red/30 text-text-primary'
          : 'bg-[#111317]/95 border-border-default text-text-primary'
      }`}
    >
      {isSuccess && <CheckCircle className="w-4 h-4 text-accent-green shrink-0 mt-0.5" />}
      {isError && <AlertCircle className="w-4 h-4 text-accent-red shrink-0 mt-0.5" />}
      {!isSuccess && !isError && <Info className="w-4 h-4 text-accent-yellow shrink-0 mt-0.5" />}

      <div className="flex-1 text-xs font-semibold leading-snug">
        {toast.message}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-text-dim hover:text-text-primary transition-colors p-1 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const Toast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

export default Toast;
