// src/features/games/components/StatusBadge.jsx
//
// Status badge untuk tampilkan availability game.
// Available (hijau) - non-clickable
// Unavailable (kuning/merah) - clickable, popup alasan dari adminNotes

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
          <p style="margin-bottom: 12px; color: #475569;">
            <b>${game.title}</b>
          </p>
          <div style="background: #fef3c7; padding: 12px; border-radius: 8px; border: 1px solid #fde68a;">
            <p style="margin: 0; color: #78350f; font-size: 13px; line-height: 1.5;">
              ${reason.replace(/\n/g, '<br/>')}
            </p>
          </div>
          ${
            game.isProblematic
              ? '<p style="margin-top: 12px; color: #dc2626; font-size: 12px;"><b>Ditandai bermasalah</b></p>'
              : ''
          }
        </div>
      `,
      icon: 'info',
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#0f172a',
    });
  };

  if (status === 'available') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
        Available
      </span>
    );
  }

  // Unavailable — clickable
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
      title="Klik untuk lihat alasan"
    >
      Unavailable
      <Info size={10} className="opacity-70" />
    </button>
  );
};

export default StatusBadge;
