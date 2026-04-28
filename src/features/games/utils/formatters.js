// src/features/games/utils/formatters.js
//
// Pure formatters untuk display data game di UI.
// No side effects, no React deps - mudah di-test.

import { format, formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

// ============================================================
// FILE SIZE
// ============================================================

/**
 * Format bytes ke human-readable string.
 * @param {number} bytes
 * @returns {string} e.g. "48.57 GB", "429.4 MB"
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes <= 0) return '-';
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;
  const TB = GB * 1024;

  if (bytes >= TB) return `${(bytes / TB).toFixed(2)} TB`;
  if (bytes >= GB) return `${(bytes / GB).toFixed(2)} GB`;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / KB).toFixed(1)} KB`;
};

// ============================================================
// DATES
// ============================================================

/**
 * Convert berbagai format timestamp Firestore ke Date object.
 * Handle: Firestore Timestamp, ISO string, Date object, null.
 */
export const resolveTimestamp = (value) => {
  if (!value) return null;
  // Firestore Timestamp (server)
  if (value.seconds !== undefined && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  // Already a Date
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  // ISO string atau number
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/**
 * Format absolute date: "27 Apr 2026"
 */
export const formatAbsoluteDate = (timestamp) => {
  const d = resolveTimestamp(timestamp);
  if (!d) return '-';
  return format(d, 'd MMM yyyy', { locale: localeId });
};

/**
 * Format relative date: "2 menit yang lalu"
 */
export const formatRelativeDate = (timestamp) => {
  const d = resolveTimestamp(timestamp);
  if (!d) return '-';
  return formatDistanceToNow(d, { addSuffix: true, locale: localeId });
};

// ============================================================
// PACKAGE TYPE
// ============================================================

/**
 * Format packageType ke label readable.
 * "INSTALLER-GOG" -> "GOG", "PRE-INSTALLED" -> "Pre-installed"
 */
export const formatPackageType = (packageType) => {
  if (!packageType) return '-';
  const map = {
    'PRE-INSTALLED': 'Pre-installed',
    'INSTALLER-GOG': 'GOG',
    'INSTALLER-ELAMIGOS': 'ElAmigos',
    INSTALLER: 'Installer',
  };
  return map[packageType] || packageType;
};

// ============================================================
// VERSION STATUS
// ============================================================

/**
 * Format versionStatus ke label readable.
 */
export const formatVersionStatus = (status) => {
  const map = {
    current: 'Versi Terbaru',
    possibly_outdated: 'Mungkin Outdated',
    unchecked: 'Belum Dicek',
  };
  return map[status] || status || 'Unknown';
};
