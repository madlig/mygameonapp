import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  detail,
  confirmText = 'Konfirmasi', 
  cancelText = 'Batal', 
  variant = 'danger', 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative"
        style={{ background: '#111317' }}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3.5 mb-4">
          <div 
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger 
                ? 'bg-accent-red/10 border border-accent-red/25 text-accent-red' 
                : isWarning 
                ? 'bg-accent-yellow/10 border border-accent-yellow/25 text-accent-yellow'
                : 'bg-accent-purple/10 border border-accent-purple/25 text-accent-purple'
            }`}
          >
            {isDanger && <AlertCircle size={22} />}
            {isWarning && <AlertTriangle size={22} />}
            {!isDanger && !isWarning && <Info size={22} />}
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Konfirmasi tindakan sistem
            </p>
          </div>
        </div>

        <div className="text-sm text-text-secondary leading-relaxed mb-4">
          {message}
        </div>

        {detail && (
          <div className="bg-bg-primary/70 border border-border-subtle rounded-xl p-3.5 mb-5 text-xs text-text-muted leading-relaxed font-mono">
            {detail}
          </div>
        )}

        <div className="flex justify-end items-center gap-2.5 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-white/5 border border-transparent hover:border-border-default transition-all"
          >
            {cancelText}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-lg hover:brightness-110 active:scale-95 ${
              isDanger 
                ? 'bg-accent-red hover:bg-accent-red/90 shadow-accent-red/20' 
                : isWarning 
                ? 'bg-accent-orange hover:bg-accent-orange/90 text-white shadow-accent-orange/20'
                : 'bg-accent-purple hover:bg-accent-purple/90 shadow-accent-purple/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
