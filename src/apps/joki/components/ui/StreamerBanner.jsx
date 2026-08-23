import React from 'react';
import { useJoki } from '../../contexts/JokiContext';

export const StreamerBanner = () => {
  const { streamerMode } = useJoki();

  if (!streamerMode) return null;

  return (
    <div className="mt-3 bg-purple-100 border border-purple-300 text-purple-800 rounded-md p-3 font-bold text-center">
      Billing Monitor
    </div>
  );
};

export const StreamStatus = () => {
  const { globalPaused } = useJoki();

  if (!globalPaused) return null;

  return (
    <div className="mt-3 bg-red-100 border border-red-200 text-red-800 rounded-md p-3 font-bold">
      🔴 STREAM DOWN — Semua billing sedang di-pause. Waktu customer tidak berkurang.
    </div>
  );
};
