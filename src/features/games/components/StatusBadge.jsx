// src/features/games/components/StatusBadge.jsx
//
// Status badge untuk tampilkan availability game.
// Available (hijau) - non-clickable
// Unavailable (kuning/merah) - clickable, popup alasan dari adminNotes
// Dark theme variant

import React from 'react';
import { Info } from 'lucide-react';
import Swal from 'sweetalert2';

const StatusBadge = ({ game }) => {
  const status = game?.availabilityStatus || 'available';
  const isUnavailable = status === 'unavailable';
  const adminNotes = game?._private?.adminNotes || '';

  const handleClick = (e) => {
    if (!isUnavailable) return;
    e.stopPropagation();

    const reason = adminNotes.trim() || 'Tidak ada catatan tersedia.';

    Swal.fire({
      title: 'Game Tidak Tersedia',
      html: `
        <div style="text-align: left;">
          <p style="margin-bottom: 12px; color: #C8CFDA;">
            <b>${game.title}</b>
          </p>
          <div style="background: #2A2F39; padding: 12px; border-radius: 8px; border: 1px solid #fbbf2433;">
            <p style="margin: 0; color: #fbbf24; font-size: 13px; line-height: 1.5;">
              ${reason.replace(/\n/g, '<br/>')}
            </p>
          </div>
          ${
            game.isProblematic
              ? '<p style="margin-top: 12px; color: #f87171; font-size: 12px;"><b>Ditandai bermasalah</b></p>'
              : ''
          }
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#FFD100',
      color: '#F3F4F6',
      background: '#1A1F27',
    });
  };

  if (status === 'available') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
        Available
      </span>
    );
  }

  // Unavailable — clickable
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25 transition-colors cursor-pointer"
      title="Klik untuk lihat alasan"
    >
      Unavailable
      <Info size={10} className="opacity-70" />
    </button>
  );
};

export default StatusBadge;
