import React, { useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { startPiercingAlarm, stopPiercingAlarm } from '../../utils/alarm';

const formatDateTime = (timestamp) => {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: false
  });
};

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const FinishedModal = ({ queue, onClose }) => {
  // Start piercing looping alarm on mount & stop on unmount
  useEffect(() => {
    startPiercingAlarm();
    return () => {
      stopPiercingAlarm();
    };
  }, []);

  if (!queue || queue.length === 0) return null;

  const current = queue[0];
  const isStopped = current.finishType === "STOPPED";
  const title = isStopped ? "BILLING DIHENTIKAN" : "BILLING SELESAI";
  const customerName = current.username || current.name;

  const handleClose = () => {
    stopPiercingAlarm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-md bg-bg-surface border-2 border-accent-red/50 rounded-2xl p-6 shadow-2xl animate-slide-in text-center relative shadow-accent-red/20"
        style={{ background: '#111317' }}
      >
        {/* Ringing Alarm Icon with Animation */}
        <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-accent-red/15 border border-accent-red/35 flex items-center justify-center text-accent-red animate-bounce">
          <Bell size={32} className="animate-pulse" />
        </div>

        <h3 className="text-xl font-black text-accent-red tracking-wide mb-1">
          🔔 {title}!
        </h3>
        
        <div className="text-base font-extrabold text-text-primary mb-4">
          Slot <span className="text-accent-yellow">{customerName}</span> {isStopped ? 'telah dihentikan.' : 'waktunya sudah habis!'}
        </div>

        {/* Detail Box */}
        <div className="bg-bg-primary/90 border border-border-subtle rounded-xl p-4 text-left text-xs space-y-2 mb-4 font-mono">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Username Roblox:</span>
            <span className="font-bold text-text-primary text-sm">{customerName}</span>
          </div>

          {current.tiktokName && (
            <div className="flex justify-between items-center text-text-secondary">
              <span className="text-text-tertiary">Akun TikTok:</span>
              <span className="text-accent-cyan">@{current.tiktokName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Layanan / Slot:</span>
            <span className="font-bold text-accent-purple-light">{current.service} (Slot {current.slot || '-'})</span>
          </div>

          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Total Durasi:</span>
            <span>{formatDuration(current.duration)}</span>
          </div>

          <div className="flex justify-between items-center text-text-secondary border-t border-border-subtle pt-1.5">
            <span className="text-text-tertiary">Waktu Selesai:</span>
            <span className="text-accent-yellow">{formatDateTime(current.finishedTime || Date.now())}</span>
          </div>
        </div>

        {queue.length > 1 && (
          <div className="text-xs text-accent-yellow mb-3 font-semibold">
            🔔 {queue.length - 1} customer lain menunggu notifikasi alarm selesai.
          </div>
        )}

        <button 
          onClick={handleClose}
          className="w-full py-3.5 rounded-xl text-sm font-black text-white bg-accent-red hover:bg-accent-red/90 active:scale-95 transition-all shadow-lg shadow-accent-red/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check size={18} />
          <span>✓ TUTUP ALARM</span>
        </button>
      </div>
    </div>
  );
};

export default FinishedModal;
