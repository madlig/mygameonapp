import * as XLSX from 'xlsx';
import { excelSerialToLocalDate, normalizeToLocalMidnight } from './dateUtils';

const HEADER_ALIASES = {
  date: ['Tanggal'],
  grossIncome: ['Total Penjualan (IDR)', 'Total Penjualan'],
  totalOrders: ['Total Pesanan'],
  canceledOrders: ['Pesanan Dibatalkan'],
  canceledValue: ['Penjualan Dibatalkan'],
  returnedOrders: ['Pesanan Dikembalikan'],
  returnedValue: ['Penjualan Dikembalikan'],
};

const normalizeHeaderCell = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[()]/g, '');

const cleanAndParseNumber = (rawValue) => {
  if (typeof rawValue === 'number') return rawValue;
  if (typeof rawValue !== 'string') return 0;

  const cleanedString = rawValue.replace(/[^\d,-]/g, '').replace(',', '.');
  const number = parseFloat(cleanedString);
  return Number.isNaN(number) ? 0 : number;
};

const parseDailyDate = (rawValue) => {
  if (rawValue instanceof Date) return normalizeToLocalMidnight(rawValue);
  if (typeof rawValue === 'number') return excelSerialToLocalDate(rawValue);
  if (typeof rawValue !== 'string') return null;

  const raw = rawValue.trim();
  if (!raw) return null;

  // Skip period range rows such as "01-02-2026-28-02-2026".
  if (
    /^\d{1,2}[-/.]\d{1,2}[-/.]\d{4}[-~]\d{1,2}[-/.]\d{1,2}[-/.]\d{4}$/.test(raw)
  ) {
    return null;
  }

  // dd-mm-yyyy / dd/mm/yyyy / dd.mm.yyyy
  let match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    const year = Number(match[3]);
    return normalizeToLocalMidnight(new Date(year, month, day));
  }

  // yyyy-mm-dd (fallback)
  match = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    return normalizeToLocalMidnight(new Date(year, month, day));
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime())
    ? null
    : normalizeToLocalMidnight(fallback);
};

const buildHeaderIndexMap = (row) => {
  const indexByNormalizedHeader = {};
  row.forEach((cell, index) => {
    const normalized = normalizeHeaderCell(cell);
    if (normalized) indexByNormalizedHeader[normalized] = index;
  });

  const headerIndexMap = {};
  Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
    const hit = aliases.find((alias) => {
      const normalizedAlias = normalizeHeaderCell(alias);
      return indexByNormalizedHeader[normalizedAlias] !== undefined;
    });
    if (hit) {
      headerIndexMap[field] = indexByNormalizedHeader[normalizeHeaderCell(hit)];
    }
  });

  return headerIndexMap;
};

const getHeaderMatchScore = (row) => {
  if (!Array.isArray(row) || row.length === 0) return 0;
  const headerIndexMap = buildHeaderIndexMap(row);
  return Object.keys(headerIndexMap).length;
};

export const parseShopeeReportForBulk = (arrayBuffer) => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });
    const targetSheetName = workbook.SheetNames.find(
      (name) =>
        normalizeHeaderCell(name) ===
        normalizeHeaderCell('Pesanan Siap Dikirim')
    );
    const fallbackSheetName = workbook.SheetNames.find((name) =>
      normalizeHeaderCell(name).includes(
        normalizeHeaderCell('Pesanan Siap Dikirim')
      )
    );
    const selectedSheetName =
      targetSheetName || fallbackSheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[selectedSheetName];

    if (!worksheet) {
      console.warn('Shopee parser: target worksheet not found.');
      return [];
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    const headerCandidates = [];
    rows.forEach((row, index) => {
      const score = getHeaderMatchScore(row);
      if (score >= 5) {
        headerCandidates.push({ index, score });
      }
    });

    if (headerCandidates.length === 0) {
      console.warn('Shopee parser: header row not found.');
      return [];
    }

    // Shopee usually repeats header. Prefer the second hit when present.
    const selectedHeader =
      headerCandidates.length >= 2 ? headerCandidates[1] : headerCandidates[0];
    const headerRowIndex = selectedHeader.index;
    const headerIndexMap = buildHeaderIndexMap(rows[headerRowIndex] || []);

    const dailyReports = [];
    for (
      let rowIndex = headerRowIndex + 1;
      rowIndex < rows.length;
      rowIndex += 1
    ) {
      const dataRow = rows[rowIndex];
      if (!Array.isArray(dataRow) || dataRow.length === 0) continue;

      // Handle repeated header rows in middle/bottom section.
      if (getHeaderMatchScore(dataRow) >= 5) continue;

      const parsedDate = parseDailyDate(dataRow[headerIndexMap.date]);
      if (!parsedDate) continue;

      dailyReports.push({
        date: parsedDate,
        grossIncome: cleanAndParseNumber(dataRow[headerIndexMap.grossIncome]),
        totalOrders: cleanAndParseNumber(dataRow[headerIndexMap.totalOrders]),
        canceledOrders: cleanAndParseNumber(
          dataRow[headerIndexMap.canceledOrders]
        ),
        canceledValue: cleanAndParseNumber(
          dataRow[headerIndexMap.canceledValue]
        ),
        returnedOrders: cleanAndParseNumber(
          dataRow[headerIndexMap.returnedOrders]
        ),
        returnedValue: cleanAndParseNumber(
          dataRow[headerIndexMap.returnedValue]
        ),
      });
    }

    return dailyReports;
  } catch (error) {
    console.error('Error saat parsing file XLSX:', error);
    return [];
  }
};
