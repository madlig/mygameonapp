// src/shared/requestStatus.js
//
// Request status system (6 statuses).
// Flow (direct):  pending → reviewing → processing → completed
// Flow (RDP):     pending → reviewing → queued → processing → completed
// Both can:       reviewing/pending → rejected
//
// Legacy status mapping included for backward compatibility.

export const REQUEST_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  QUEUED: 'queued', // RDP only: waiting for batch upload day
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
};

// Active = still being worked on (not final)
export const REQUEST_ACTIVE_STATUSES = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.REVIEWING,
  REQUEST_STATUS.QUEUED,
  REQUEST_STATUS.PROCESSING,
];

// Final = end states
export const REQUEST_FINAL_STATUSES = [
  REQUEST_STATUS.COMPLETED,
  REQUEST_STATUS.REJECTED,
];

// All statuses admin should see
export const REQUEST_ALL_STATUSES = [
  ...REQUEST_ACTIVE_STATUSES,
  ...REQUEST_FINAL_STATUSES,
];

// Public timeline — direct upload (non-RDP)
export const REQUEST_TIMELINE_STEPS = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.REVIEWING,
  REQUEST_STATUS.PROCESSING,
  REQUEST_STATUS.COMPLETED,
];

// Public timeline — RDP batch upload
export const REQUEST_TIMELINE_RDP_STEPS = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.REVIEWING,
  REQUEST_STATUS.QUEUED,
  REQUEST_STATUS.PROCESSING,
  REQUEST_STATUS.COMPLETED,
];

// Labels
export const REQUEST_STATUS_LABEL = {
  [REQUEST_STATUS.PENDING]: 'Menunggu Review',
  [REQUEST_STATUS.REVIEWING]: 'Sedang Direview',
  [REQUEST_STATUS.QUEUED]: 'Menunggu Upload',
  [REQUEST_STATUS.PROCESSING]: 'Sedang Diupload',
  [REQUEST_STATUS.COMPLETED]: 'Selesai',
  [REQUEST_STATUS.REJECTED]: 'Tidak Tersedia',
};

// Descriptions (shown to customer on tracking page)
export const REQUEST_STATUS_DESC = {
  [REQUEST_STATUS.PENDING]:
    'Request sudah diterima. Menunggu tim untuk mulai review.',
  [REQUEST_STATUS.REVIEWING]:
    'Tim sedang mengecek ketersediaan dan kelayakan file game.',
  [REQUEST_STATUS.QUEUED]:
    'File tersedia. Menunggu jadwal upload batch berikutnya.',
  [REQUEST_STATUS.PROCESSING]: 'File game sedang diproses upload ke server.',
  [REQUEST_STATUS.COMPLETED]:
    'Game sudah tersedia di katalog dan siap dibeli via Shopee.',
  [REQUEST_STATUS.REJECTED]: 'Maaf, file game ini belum tersedia saat ini.',
};

// Badge classes (dark theme)
export const REQUEST_STATUS_BADGE_CLASS = {
  [REQUEST_STATUS.PENDING]:
    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/25',
  [REQUEST_STATUS.REVIEWING]:
    'bg-indigo-500/15 text-indigo-400 border border-indigo-500/25',
  [REQUEST_STATUS.QUEUED]:
    'bg-violet-500/15 text-violet-400 border border-violet-500/25',
  [REQUEST_STATUS.PROCESSING]:
    'bg-blue-500/15 text-blue-400 border border-blue-500/25',
  [REQUEST_STATUS.COMPLETED]:
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25',
  [REQUEST_STATUS.REJECTED]:
    'bg-red-500/15 text-red-400 border border-red-500/25',
};

// ── Legacy status mapping ──
// Maps old statuses (from existing Firestore docs) to new statuses.
const LEGACY_STATUS_MAP = {
  awaiting_payment: REQUEST_STATUS.PROCESSING,
  paid: REQUEST_STATUS.PROCESSING,
  uploaded: REQUEST_STATUS.COMPLETED,
  available: REQUEST_STATUS.COMPLETED,
  not_available: REQUEST_STATUS.REJECTED,
};

/**
 * Normalize a status value — handles both new and legacy statuses.
 * Use this when reading status from Firestore to ensure compatibility.
 */
export const normalizeStatus = (status) => {
  if (!status) return REQUEST_STATUS.PENDING;
  if (Object.values(REQUEST_STATUS).includes(status)) return status;
  return LEGACY_STATUS_MAP[status] || REQUEST_STATUS.PENDING;
};

// ── Helper functions ──
export const getRequestStatusLabel = (status) =>
  REQUEST_STATUS_LABEL[normalizeStatus(status)] ||
  REQUEST_STATUS_LABEL[REQUEST_STATUS.PENDING];

export const getRequestStatusDescription = (status) =>
  REQUEST_STATUS_DESC[normalizeStatus(status)] ||
  REQUEST_STATUS_DESC[REQUEST_STATUS.PENDING];

export const getRequestStatusBadgeClass = (status) =>
  REQUEST_STATUS_BADGE_CLASS[normalizeStatus(status)] ||
  REQUEST_STATUS_BADGE_CLASS[REQUEST_STATUS.PENDING];
