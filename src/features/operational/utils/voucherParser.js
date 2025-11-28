// src/features/operational/utils/voucherParser.js
import * as XLSX from 'xlsx';
import { excelSerialToLocalDate, normalizeToLocalMidnight } from '../utils/dateUtils';

const cleanAndParseNumber = (rawValue) => {
  if (typeof rawValue === 'number') return rawValue;
  if (typeof rawValue === 'string') {
    const cleanedString = rawValue.replace(/[^\d,-]/g, '').replace(',', '.');
    const number = parseFloat(cleanedString);
    return isNaN(number) ? 0 : number;
  }
  return 0;
};

const parseStringDateToLocal = (rawStr) => {
  if (!rawStr || typeof rawStr !== 'string') return null;
  // common formats: "01-10-2025" or "01/10/2025" or "01.10.2025"
  const sep = rawStr.includes('-') ? '-' : rawStr.includes('/') ? '/' : rawStr.includes('.') ? '.' : null;
  if (!sep) return null;
  const parts = rawStr.split(sep).map(p => p.trim());
  if (parts.length !== 3) return null;
  const [dStr, mStr, yStr] = parts;
  const day = parseInt(dStr, 10);
  const month = parseInt(mStr, 10) - 1;
  const year = parseInt(yStr, 10);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  return normalizeToLocalMidnight(new Date(year, month, day));
};

export const parseVoucherReportForBulk = (arrayBuffer) => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const worksheetNames = workbook.SheetNames;

    // Find plausible sheet — prefer "Grafik Kriteria" if exists
    const targetSheetName = worksheetNames.includes("Grafik Kriteria") ? "Grafik Kriteria" : worksheetNames[0];
    const worksheet = workbook.Sheets[targetSheetName];
    if (!worksheet) {
      console.warn(`Voucher parser: sheet "${targetSheetName}" not found.`);
      return [];
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    // Find header row that contains "Waktu Promo" or similar
    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (Array.isArray(row) && (row.includes("Waktu Promo") || row.includes("Waktu") || row.includes("Periode"))) {
        headerRowIndex = i;
        break;
      }
    }
    if (headerRowIndex === -1) {
      console.warn("Voucher parser: header row not found.");
      return [];
    }

    const headerRow = rows[headerRowIndex];
    const headerIndexMap = {};
    headerRow.forEach((h, idx) => {
      if (h) headerIndexMap[String(h).trim()] = idx;
    });

    // Try to detect date & cost columns using expected header names
    const dateKeys = ["Waktu Promo", "Waktu", "Tanggal", "Periode"];
    const costKeys = [
      "Total Biaya (Pesanan Dibuat) (IDR)",
      "Total Biaya (Pesanan Dibuat)",
      "Total Biaya",
      "Biaya",
      "Total Biaya (IDR)"
    ];

    let dateCol = null;
    for (const k of dateKeys) if (headerIndexMap[k] !== undefined) { dateCol = headerIndexMap[k]; break; }
    let costCol = null;
    for (const k of costKeys) if (headerIndexMap[k] !== undefined) { costCol = headerIndexMap[k]; break; }

    // If automatic detection failed, try heuristics
    if (dateCol === null) {
      // fallback: find first column that contains "Waktu" substring
      for (let i = 0; i < headerRow.length; i++) {
        const h = headerRow[i];
        if (h && String(h).toLowerCase().includes("waktu")) { dateCol = i; break; }
      }
    }
    if (costCol === null) {
      for (let i = 0; i < headerRow.length; i++) {
        const h = headerRow[i];
        if (h && String(h).toLowerCase().includes("biaya")) { costCol = i; break; }
      }
    }

    const dailyVouchers = [];
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let rawDate = dateCol !== null ? row[dateCol] : null;
      let date = null;
      if (typeof rawDate === 'number') {
        date = excelSerialToLocalDate(rawDate);
      } else if (typeof rawDate === 'string') {
        date = parseStringDateToLocal(rawDate) || excelSerialToLocalDate(Number(rawDate)) || null;
      }

      const rawCost = costCol !== null ? row[costCol] : null;
      const voucherCost = cleanAndParseNumber(rawCost);

      if (date && voucherCost && voucherCost > 0) {
        dailyVouchers.push({ date, voucherCost });
      }
    }

    return dailyVouchers;
  } catch (error) {
    console.error("Error parsing voucher file:", error);
    return [];
  }
};