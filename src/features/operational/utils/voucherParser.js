import * as XLSX from 'xlsx';
import { excelSerialToLocalDate, normalizeToLocalMidnight } from './dateUtils';

const MAX_HEADER_SCAN_ROWS = 20;

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[.,:/_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return 0;
  const cleaned = value.trim().replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;

  let normalized = cleaned;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 1 && parts.slice(1).every((part) => part.length === 3)) {
      normalized = cleaned.replace(/\./g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    normalized =
      parts.length === 2 && parts[1].length === 3
        ? cleaned.replace(/,/g, '')
        : cleaned.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePromoDate = (rawValue) => {
  if (rawValue instanceof Date) return normalizeToLocalMidnight(rawValue);
  if (typeof rawValue === 'number') return excelSerialToLocalDate(rawValue);
  if (typeof rawValue !== 'string') return null;

  const value = rawValue.trim();
  if (!value) return null;
  const datePart = value.split(' ')[0];

  let match = datePart.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    return normalizeToLocalMidnight(new Date(year, month, day));
  }

  match = datePart.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return normalizeToLocalMidnight(new Date(year, month, day));
  }

  return null;
};

const findHeader = (rows) => {
  const limit = Math.min(rows.length, MAX_HEADER_SCAN_ROWS);
  for (let i = 0; i < limit; i += 1) {
    const row = rows[i] || [];
    const normalized = row.map((cell) => normalizeText(cell));

    const dateIndex = normalized.findIndex((cell) =>
      cell.includes('waktu promo')
    );
    const voucherIndex = normalized.findIndex((cell) =>
      cell.includes('total biaya pesanan dibuat idr')
    );

    if (dateIndex !== -1 && voucherIndex !== -1) {
      return { headerRowIndex: i, dateIndex, voucherIndex };
    }
  }
  return null;
};

const pickTargetSheet = (workbook) => {
  const exact = workbook.SheetNames.find(
    (name) => normalizeText(name) === normalizeText('Grafik Kriteria')
  );
  if (exact) return exact;
  const partial = workbook.SheetNames.find((name) =>
    normalizeText(name).includes(normalizeText('Grafik Kriteria'))
  );
  if (partial) return partial;
  return null;
};

export const parseVoucherReportForBulk = (arrayBuffer) => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    const targetSheet = pickTargetSheet(workbook);
    if (!targetSheet) return [];

    const worksheet = workbook.Sheets[targetSheet];
    if (!worksheet) return [];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    const header = findHeader(rows);
    if (!header) return [];

    const dailyMap = new Map();

    for (let i = header.headerRowIndex + 1; i < rows.length; i += 1) {
      const row = rows[i];
      if (!Array.isArray(row) || row.length === 0) continue;

      const date = parsePromoDate(row[header.dateIndex]);
      if (!date) continue;

      const voucherCost = toNumber(row[header.voucherIndex]);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      dailyMap.set(key, {
        date,
        voucherCost: voucherCost + (dailyMap.get(key)?.voucherCost || 0),
      });
    }

    return Array.from(dailyMap.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  } catch (error) {
    console.error('Error parsing voucher report:', error);
    return [];
  }
};
