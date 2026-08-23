import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-in ${
              isSuccess
                ? 'bg-[#0D1410]/95 border-accent-green/30 text-text-primary'
                : isError
                ? 'bg-[#180C0E]/95 border-accent-red/30 text-text-primary'
                : 'bg-[#111317]/95 border-border-default text-text-primary'
            }`}
          >
            {isSuccess && <CheckCircle className="w-5 h-5 text-accent-green shrink-0 mt-0.5" />}
            {isError && <AlertCircle className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />}
            {!isSuccess && !isError && <Info className="w-5 h-5 text-accent-yellow shrink-0 mt-0.5" />}

            <div className="flex-1 text-sm font-medium leading-snug">
              {toast.message}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-text-dim hover:text-text-primary transition-colors -mr-1 -mt-1 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
