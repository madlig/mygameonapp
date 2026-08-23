import React from 'react';
import { Bell, Check, Clock, User, Shield } from 'lucide-react';

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
  if (!queue || queue.length === 0) return null;

  const current = queue[0];
  const isStopped = current.finishType === "STOPPED";
  const title = isStopped ? "BILLING DIHENTIKAN" : "BILLING SELESAI";
  const customerName = current.username || current.name;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in text-center relative"
        style={{ background: '#111317' }}
      >
        {/* Animated Bell Icon */}
        <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-accent-red/10 border border-accent-red/25 flex items-center justify-center text-accent-red animate-bounce">
          <Bell size={28} />
        </div>

        <h3 className="text-lg font-black text-accent-red tracking-tight mb-1">
          {title}
        </h3>
        
        <div className="text-base font-extrabold text-text-primary mb-4">
          Slot <span className="text-accent-yellow">{customerName}</span> {isStopped ? 'telah dihentikan.' : 'waktunya sudah habis!'}
        </div>

        {/* Detail Box */}
        <div className="bg-bg-primary/90 border border-border-subtle rounded-xl p-4 text-left text-xs space-y-2 mb-4 font-mono">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Username Roblox:</span>
            <span className="font-bold text-text-primary">{customerName}</span>
          </div>

          {current.tiktokName && (
            <div className="flex justify-between items-center text-text-secondary">
              <span className="text-text-tertiary">Akun TikTok:</span>
              <span className="text-accent-cyan">@{current.tiktokName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Layanan / Slot:</span>
            <span className="font-bold text-accent-purple-light">{current.service}</span>
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
          <div className="text-xs text-text-tertiary mb-4">
            🔔 {queue.length - 1} customer lain menunggu notifikasi selesai.
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full py-3 rounded-xl text-xs font-extrabold text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-lg shadow-accent-purple/20 flex items-center justify-center gap-1.5"
        >
          <Check size={16} />
          <span>TUTUP NOTIFIKASI</span>
        </button>
      </div>
    </div>
  );
};

export default FinishedModal;
