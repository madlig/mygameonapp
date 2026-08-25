import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { EyeOff, AlertOctagon, Radio, Coffee, Moon, Calendar, Edit3 } from 'lucide-react';

export const StreamerBanner = ({ onOpenSettings }) => {
  const { streamerMode, isAdmin, globalSettings, activeWorkspace } = useJoki();

  const streamStatus = globalSettings?.streamStatus || 'OFFLINE';
  const nextSchedule = globalSettings?.nextStreamSchedule || '';
  const streamerName = activeWorkspace?.name || 'Streamer';

  return (
    <div className="flex flex-col gap-2.5 mb-4">
      {/* 1. Streamer Mode Sensor Notification (Admin Only) */}
      {streamerMode && isAdmin && (
        <div className="bg-accent-purple/10 border border-accent-purple/25 text-accent-purple-light rounded-2xl p-3 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <EyeOff size={15} className="shrink-0 text-accent-purple-light" />
            <span>STREAMER MODE ON — Omset, riwayat, dan data sensitif disensor untuk live stream.</span>
          </div>
          <span className="text-[10.5px] font-mono uppercase bg-accent-purple/20 px-2 py-0.5 rounded-lg text-accent-purple-light">
            SENSING LIVE
          </span>
        </div>
      )}

      {/* 2. LIVE BROADCAST & JADWAL STREAM BANNER (Viewer & Admin Mode) */}
      {streamStatus === 'LIVE' ? (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-accent-red/20 via-accent-purple/15 to-accent-red/20 border border-accent-red/35 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-3 h-3 rounded-full bg-accent-red animate-ping shrink-0" />
            <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
              <span>🔴 {streamerName.toUpperCase()} SEDANG LIVE STREAMING!</span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Edit3 size={11} />
              <span>Ubah Status</span>
            </button>
          )}
        </div>
      ) : streamStatus === 'BREAK' ? (
        <div className="p-3 rounded-2xl bg-accent-orange/15 border border-accent-orange/35 flex items-center justify-between gap-3 text-accent-orange text-xs font-bold shadow-md">
          <div className="flex items-center gap-2 min-w-0">
            <Coffee size={16} className="shrink-0" />
            <span>☕ Streamer lagi istirahat / break sebentar. Joki akan segera dilanjutkan!</span>
          </div>
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-accent-orange/20 hover:bg-accent-orange/30 text-white border border-accent-orange/40 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Edit3 size={11} />
              <span>Ubah Status</span>
            </button>
          )}
        </div>
      ) : (
        /* OFFLINE STATUS BANNER */
        <div className="p-3.5 rounded-2xl bg-bg-surface/90 border border-border-default flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <Moon size={15} className="text-accent-purple-light shrink-0" />
            <div className="leading-relaxed">
              <span className="text-text-muted font-bold block sm:inline">
                Status Streamer: <strong className="text-white">Off Stream</strong>
              </span>
              <span className="text-text-dim sm:ml-2">
                {nextSchedule ? (
                  <span className="text-accent-cyan font-bold">
                    📅 Jadwal Live Berikutnya: <u>{nextSchedule}</u>
                  </span>
                ) : (
                  'Akun aman di antrean dan akan dimainkan pada live berikutnya.'
                )}
              </span>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              title="Atur jadwal live berikutnya agar penonton & tiket tahu kapan live lagi"
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
            >
              <Calendar size={12} />
              <span>Atur Jadwal Live</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const StreamStatus = () => {
  const { globalPaused } = useJoki();

  if (!globalPaused) return null;

  return (
    <div className="mb-4 bg-accent-red/10 border border-accent-red/25 text-accent-red rounded-2xl p-3.5 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-pulse">
      <AlertOctagon size={18} className="shrink-0 text-accent-red" />
      <div>
        <span className="font-extrabold uppercase">🔴 STREAM DOWN / PAUSED:</span> Semua billing sedang di-pause sementara. Durasi waktu customer tidak berkurang.
      </div>
    </div>
  );
};
