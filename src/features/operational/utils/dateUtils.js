// src/utils/dateUtils.js
// Small date utilities to ensure all parsers / upserts use the same canonical date representation.

export const normalizeToLocalMidnight = (input) => {
  if (!input) return null;
  const d = input instanceof Date ? new Date(input) : new Date(input);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
};

export const parseYmdToLocalDate = (ymd) => {
  if (typeof ymd !== 'string') return null;
  const parts = ymd.split('-').map((part) => Number(part));
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

export const toLocalStartOfDay = (input) => normalizeToLocalMidnight(input);

export const toLocalEndOfDay = (input) => {
  const normalized = normalizeToLocalMidnight(input);
  if (!normalized) return null;
  return new Date(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate(),
    23,
    59,
    59,
    999
  );
};

export const excelSerialToLocalDate = (serial) => {
  if (typeof serial !== 'number') return null;
  // Excel serial number -> JS Date
  // Excel's epoch note: 25569 offset. This conversion is what many XLSX utilities use.
  const date = new Date((serial - 25569) * 86400 * 1000);
  return normalizeToLocalMidnight(date);
};

export const toDateKey = (dateInput) => {
  const d = normalizeToLocalMidnight(dateInput);
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
