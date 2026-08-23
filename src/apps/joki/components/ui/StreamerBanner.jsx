import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { EyeOff, AlertOctagon } from 'lucide-react';

export const StreamerBanner = () => {
  const { streamerMode, isAdmin } = useJoki();

  if (!streamerMode || !isAdmin) return null;

  return (
    <div className="mb-4 bg-accent-purple/10 border border-accent-purple/25 text-accent-purple-light rounded-xl p-3 text-xs font-bold flex items-center justify-center gap-2 shadow-lg">
      <EyeOff size={15} />
      <span>STREAMER MODE ON — Omset, riwayat, dan data sensitif disensor untuk live stream.</span>
    </div>
  );
};

export const StreamStatus = () => {
  const { globalPaused } = useJoki();

  if (!globalPaused) return null;

  return (
    <div className="mb-4 bg-accent-red/10 border border-accent-red/25 text-accent-red rounded-xl p-3.5 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-pulse">
      <AlertOctagon size={18} className="shrink-0 text-accent-red" />
      <div>
        <span className="font-extrabold uppercase">🔴 STREAM DOWN / PAUSED:</span> Semua billing sedang di-pause sementara. Durasi waktu customer tidak berkurang.
      </div>
    </div>
  );
};
