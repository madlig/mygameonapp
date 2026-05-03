// src/features/games/components/LocationCell.jsx
//
// Cell untuk display storage location di tabel admin.
// Single location  : "📍 mygameon8"
// Multi-location   : "📍 3 lokasi" (clickable -> popup detail)
// No location      : "📍 -"

import React from 'react';
import { MapPin } from 'lucide-react';
import Swal from 'sweetalert2';
import {
  buildLocationDisplay,
  getLocationEntries,
} from '../utils/locationHelpers';

const LocationCell = ({ game }) => {
  const storageLocations = game?._private?.storageLocations || [];
  const display = buildLocationDisplay(storageLocations);

  const handleClick = (e) => {
    e.stopPropagation();

    const entries = getLocationEntries(storageLocations);
    if (entries.length === 0) return;

    // Build HTML list
    const itemsHtml = entries
      .map((entry) => {
        const role = entry.role
          ? `<span style="font-size: 10px; padding: 2px 8px; background: #e2e8f0; color: #475569; border-radius: 4px; margin-left: 8px;">${entry.role}</span>`
          : '';
        const version = entry.version
          ? `<span style="font-size: 11px; color: #64748b;">${entry.version}</span>`
          : '';
        const notes = entry.notes
          ? `<div style="font-size: 11px; color: #94a3b8; margin-top: 4px; font-style: italic;">${entry.notes}</div>`
          : '';
        const shopee = entry.shopeeListed
          ? '<span style="font-size: 10px; padding: 2px 8px; background: #d1fae5; color: #065f46; border-radius: 4px; margin-left: 4px;">Shopee</span>'
          : '';

        return `
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; margin-bottom: 8px; text-align: left;">
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
              <span style="font-weight: 600; color: #0f172a; font-size: 13px;">
                ${entry.displayLabel}
              </span>
              ${role}${shopee}
            </div>
            <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
              ${version}
            </div>
            ${notes}
          </div>
        `;
      })
      .join('');

    Swal.fire({
      title: `Lokasi File: ${game.title}`,
      html: `<div style="max-height: 400px; overflow-y: auto;">${itemsHtml}</div>`,
      width: 480,
      confirmButtonText: 'Tutup',
      confirmButtonColor: '#0f172a',
    });
  };

  if (display.count === 0) {
    return (
      <span className="inline-flex items-center text-slate-400 text-xs">
        <MapPin size={12} className="mr-1" />
        -
      </span>
    );
  }

  if (!display.isMulti) {
    // Single location — non-clickable, plain display
    return (
      <span
        className="inline-flex items-center text-slate-600 text-xs font-medium truncate max-w-[200px]"
        title={display.label}
      >
        <MapPin size={12} className="mr-1 text-blue-500 flex-shrink-0" />
        <span className="truncate">{display.label}</span>
      </span>
    );
  }

  // Multi-location — clickable
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center text-blue-600 text-xs font-medium hover:underline cursor-pointer"
      title="Klik untuk lihat semua lokasi"
    >
      <MapPin size={12} className="mr-1 text-blue-500" />
      {display.label}
    </button>
  );
};

export default LocationCell;
