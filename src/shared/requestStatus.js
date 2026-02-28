export const REQUEST_STATUS = {
  PENDING: 'pending',
  REVIEWING: 'reviewing',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  UPLOADED: 'uploaded',
  AVAILABLE: 'available',
  NOT_AVAILABLE: 'not_available',
};

export const REQUEST_ACTIVE_STATUSES = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.REVIEWING,
  REQUEST_STATUS.QUEUED,
  REQUEST_STATUS.PROCESSING,
  REQUEST_STATUS.UPLOADED,
];

export const REQUEST_RESULT_STATUSES = [
  REQUEST_STATUS.AVAILABLE,
  REQUEST_STATUS.NOT_AVAILABLE,
];

export const REQUEST_ADMIN_VISIBLE_STATUSES = [
  ...REQUEST_ACTIVE_STATUSES,
  ...REQUEST_RESULT_STATUSES,
];

export const REQUEST_INBOX_STATUSES = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.REVIEWING,
];

export const REQUEST_QUEUE_STATUSES = [
  REQUEST_STATUS.QUEUED,
  REQUEST_STATUS.PROCESSING,
  REQUEST_STATUS.UPLOADED,
];

export const REQUEST_PUBLIC_TIMELINE_STEPS = [
  REQUEST_STATUS.PENDING,
  REQUEST_STATUS.REVIEWING,
  REQUEST_STATUS.QUEUED,
  REQUEST_STATUS.PROCESSING,
  REQUEST_STATUS.UPLOADED,
  REQUEST_STATUS.AVAILABLE,
];

export const REQUEST_STATUS_LABEL = {
  [REQUEST_STATUS.PENDING]: 'Pending',
  [REQUEST_STATUS.REVIEWING]: 'Direview',
  [REQUEST_STATUS.QUEUED]: 'Masuk Antrian',
  [REQUEST_STATUS.PROCESSING]: 'Diproses',
  [REQUEST_STATUS.UPLOADED]: 'Siap Publish',
  [REQUEST_STATUS.AVAILABLE]: 'Tersedia',
  [REQUEST_STATUS.NOT_AVAILABLE]: 'Tidak Tersedia',
};

export const REQUEST_STATUS_DESC = {
  [REQUEST_STATUS.PENDING]: 'Request sudah diterima sistem.',
  [REQUEST_STATUS.REVIEWING]: 'Tim sedang cek detail request.',
  [REQUEST_STATUS.QUEUED]: 'Request valid dan menunggu proses lanjutan.',
  [REQUEST_STATUS.PROCESSING]: 'Request sedang dalam proses pengerjaan.',
  [REQUEST_STATUS.UPLOADED]: 'Request selesai diproses dan siap lanjut.',
  [REQUEST_STATUS.AVAILABLE]: 'Game tersedia dan siap ditindaklanjuti.',
  [REQUEST_STATUS.NOT_AVAILABLE]: 'Maaf, saat ini file belum tersedia.',
};

export const REQUEST_STATUS_BADGE_CLASS = {
  [REQUEST_STATUS.PENDING]:
    'bg-yellow-100 text-yellow-800 border border-yellow-200',
  [REQUEST_STATUS.REVIEWING]:
    'bg-indigo-100 text-indigo-700 border border-indigo-200',
  [REQUEST_STATUS.QUEUED]:
    'bg-slate-100 text-slate-600 border border-slate-200',
  [REQUEST_STATUS.PROCESSING]:
    'bg-blue-100 text-blue-800 border border-blue-200',
  [REQUEST_STATUS.UPLOADED]:
    'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [REQUEST_STATUS.AVAILABLE]:
    'bg-emerald-100 text-emerald-800 border border-emerald-200',
  [REQUEST_STATUS.NOT_AVAILABLE]:
    'bg-amber-100 text-amber-800 border border-amber-200',
};

export const getRequestStatusLabel = (status) =>
  REQUEST_STATUS_LABEL[status] || REQUEST_STATUS_LABEL[REQUEST_STATUS.PENDING];

export const getRequestStatusDescription = (status) =>
  REQUEST_STATUS_DESC[status] || REQUEST_STATUS_DESC[REQUEST_STATUS.PENDING];

export const getRequestStatusBadgeClass = (status) =>
  REQUEST_STATUS_BADGE_CLASS[status] ||
  REQUEST_STATUS_BADGE_CLASS[REQUEST_STATUS.PENDING];
