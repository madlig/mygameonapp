// src/features/games/utils/locationHelpers.js
//
// Helpers untuk parsing & display storage location.
// Storage location di gamesPrivate biasanya format email seperti:
//   - "mygameon8@wgaming.my.id"
//   - "mygameon@mydrivee.cloud"
//   - "TBD"
//   - "KEBERSAMAAN"

/**
 * Extract username dari email — bagian sebelum '@'.
 * Untuk display di tabel admin: "mygameon8@wgaming.my.id" -> "mygameon8"
 *
 * Edge cases:
 *   - "TBD" -> "TBD" (no @)
 *   - "KEBERSAMAAN" -> "KEBERSAMAAN"
 *   - "" -> "-"
 *   - null/undefined -> "-"
 */
export const extractLocationLabel = (location) => {
  if (!location || typeof location !== 'string') return '-';
  const trimmed = location.trim();
  if (!trimmed) return '-';

  // Kalau bukan email, return as-is (TBD, KEBERSAMAAN, custom labels)
  const atIdx = trimmed.indexOf('@');
  if (atIdx === -1) return trimmed;

  // Ambil bagian sebelum @
  const username = trimmed.substring(0, atIdx);
  return username || trimmed;
};

/**
 * Build display string dari array storageLocations.
 * Single: "mygameon8"
 * Multi:  "3 lokasi"
 * Empty:  "-"
 */
export const buildLocationDisplay = (storageLocations) => {
  if (!Array.isArray(storageLocations) || storageLocations.length === 0) {
    return { label: '-', count: 0, isMulti: false };
  }

  if (storageLocations.length === 1) {
    const loc = storageLocations[0];
    return {
      label: extractLocationLabel(loc?.email),
      count: 1,
      isMulti: false,
    };
  }

  return {
    label: `${storageLocations.length} lokasi`,
    count: storageLocations.length,
    isMulti: true,
  };
};

/**
 * Get location entries with display labels for tooltip/popup.
 * Returns array of {email, displayLabel, role, version, notes, ...}
 */
export const getLocationEntries = (storageLocations) => {
  if (!Array.isArray(storageLocations)) return [];
  return storageLocations.map((loc) => ({
    ...loc,
    displayLabel: extractLocationLabel(loc?.email),
  }));
};
