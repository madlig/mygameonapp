// src/features/operational/utils/adSpendParser.js
import Papa from 'papaparse';
import { normalizeToLocalMidnight } from '../utils/dateUtils';

/**
 * parseAdSpendReport(fileObject)
 * - fileObject: File (from <input type="file">)
 * returns Promise resolving to { totalAdSpend: number, startDate: Date|null, endDate: Date|null }
 *
 * NOTE:
 * - Prioritizes reading column V (Excel column 22 -> zero-based index 21).
 * - If column V not present, falls back to header-based or heuristics.
 */
export const parseAdSpendReport = (fileObject) => {
  return new Promise((resolve, reject) => {
    Papa.parse(fileObject, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data;
          if (!Array.isArray(data) || data.length === 0) throw new Error("Empty CSV");

          // --- Try to detect period string like "01/10/2025 - 31/10/2025" ---
          let periodMatch = null;
          for (let r = 0; r < Math.min(data.length, 8); r++) {
            const row = data[r];
            if (!Array.isArray(row)) continue;
            for (const cell of row) {
              if (typeof cell === 'string') {
                const m = cell.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
                if (m) { periodMatch = m; break; }
              }
            }
            if (periodMatch) break;
          }

          let startDate = null;
          let endDate = null;
          if (periodMatch && periodMatch.length >= 3) {
            const [ , s, e ] = periodMatch;
            const [sd, sm, sy] = s.split('/').map(x => parseInt(x, 10));
            const [ed, em, ey] = e.split('/').map(x => parseInt(x, 10));
            if (!Number.isNaN(sd) && !Number.isNaN(sm) && !Number.isNaN(sy)) {
              startDate = normalizeToLocalMidnight(new Date(sy, sm - 1, sd));
            }
            if (!Number.isNaN(ed) && !Number.isNaN(em) && !Number.isNaN(ey)) {
              endDate = normalizeToLocalMidnight(new Date(ey, em - 1, ed));
            }
          }

          // --- Find header row (if any) within first 10 rows ---
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(10, data.length); i++) {
            const row = data[i];
            if (!Array.isArray(row)) continue;
            const joined = row.join(' ').toLowerCase();
            if (joined.includes('biaya') || joined.includes('cost') || joined.includes('amount') || joined.includes('spend')) {
              headerRowIndex = i;
              break;
            }
          }
          // Fallback to first row as header if it looks like header (contains any non-numeric)
          if (headerRowIndex === -1 && data.length > 0) {
            const firstRow = data[0];
            const hasNonNumeric = firstRow.some(cell => typeof cell === 'string' && /[A-Za-z]/.test(cell));
            if (hasNonNumeric) headerRowIndex = 0;
          }

          // --- Prefer explicit column V (Excel column 22 -> index 21) ---
          const EXPLICIT_COL_INDEX = 21; // zero-based
          let costIndex = -1;

          // Determine if any row has length > EXPLICIT_COL_INDEX
          const hasColV = data.some(row => Array.isArray(row) && row.length > EXPLICIT_COL_INDEX);

          if (hasColV) {
            costIndex = EXPLICIT_COL_INDEX;
          } else {
            // If headerRowIndex known, try to find header label matching cost
            if (headerRowIndex !== -1) {
              const header = data[headerRowIndex].map(h => (h ? String(h).toLowerCase() : ''));
              for (let i = 0; i < header.length; i++) {
                if (/biaya|cost|amount|spend|total biaya|total cost|total amount/.test(header[i])) {
                  costIndex = i;
                  break;
                }
              }
            }

            // Fallback heuristics: pick the column with most numeric cells in first 30 rows
            if (costIndex === -1) {
              const sampleRow = data.find(r => Array.isArray(r) && r.length > 0) || [];
              const colCount = sampleRow.length || 0;
              let bestIdx = -1;
              let bestCount = -1;
              for (let c = 0; c < colCount; c++) {
                let numericCount = 0;
                for (let r = 0; r < Math.min(30, data.length); r++) {
                  const cell = data[r][c];
                  if (cell == null) continue;
                  const cleaned = String(cell).replace(/[^\d,-]/g, '').replace(',', '.');
                  if (cleaned.length > 0 && !Number.isNaN(parseFloat(cleaned))) numericCount++;
                }
                if (numericCount > bestCount) { bestCount = numericCount; bestIdx = c; }
              }
              costIndex = bestIdx;
            }
          }

          // If costIndex still invalid, bail out
          if (costIndex == null || costIndex < 0) {
            // Return zero so caller can show error/feedback
            return resolve({ totalAdSpend: 0, startDate, endDate });
          }

          // --- Sum the column starting after headerRowIndex (if header exists) or from row 0 ---
          const startRow = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;
          let total = 0;
          for (let r = startRow; r < data.length; r++) {
            const row = data[r];
            if (!Array.isArray(row)) continue;
            const raw = row[costIndex];
            if (raw == null || String(raw).trim() === '') continue;
            // normalize number: remove currency symbols and thousands separators; support comma as decimal
            const cleaned = String(raw).trim().replace(/[^\d\-,.()]/g, '').replace(/\s+/g, '');
            // handle negatives in parentheses e.g. (1,234.56)
            let sign = 1;
            let normalized = cleaned;
            if (/^\(.*\)$/.test(normalized)) {
              sign = -1;
              normalized = normalized.replace(/^\(|\)$/g, '');
            }
            // Replace commas used as thousand separators: heuristic - if both dot and comma exist, assume comma thousands
            if (normalized.indexOf('.') !== -1 && normalized.indexOf(',') !== -1) {
              // remove commas
              normalized = normalized.replace(/,/g, '');
            } else if (normalized.indexOf(',') !== -1 && normalized.indexOf('.') === -1) {
              // treat comma as decimal separator
              normalized = normalized.replace(/,/g, '.');
            }
            const num = parseFloat(normalized);
            if (!Number.isNaN(num)) total += sign * num;
          }

          const totalAdSpend = total || 0;
          resolve({ totalAdSpend, startDate, endDate });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
};