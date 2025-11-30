// src/features/operational/utils/adSpendParser.js
// Parse ad spend CSV (client-side) using PapaParse and prefer column V (index 21).
import Papa from 'papaparse';

/**
 * parseAdSpendReport(file)
 * - file: File object (CSV)
 * returns Promise resolving to:
 *  { totalAdSpend: number, startDate: Date|null, endDate: Date|null, warnings: string[] }
 */
export const parseAdSpendReport = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data || [];
          const warnings = [];

          if (!Array.isArray(data) || data.length === 0) {
            return resolve({ totalAdSpend: 0, startDate: null, endDate: null, warnings: ['Empty file'] });
          }

          // attempt to find date range in first 8 rows
          let startDate = null;
          let endDate = null;
          for (let r = 0; r < Math.min(8, data.length); r++) {
            const row = data[r];
            if (!Array.isArray(row)) continue;
            for (const cell of row) {
              if (typeof cell === 'string') {
                const m = cell.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
                if (m) {
                  const [ , s, e ] = m;
                  const [sd, sm, sy] = s.split('/').map(x => Number(x));
                  const [ed, em, ey] = e.split('/').map(x => Number(x));
                  const sDate = new Date(sy, sm - 1, sd);
                  const eDate = new Date(ey, em - 1, ed);
                  if (!isNaN(sDate.getTime()) && !isNaN(eDate.getTime())) {
                    startDate = sDate;
                    endDate = eDate;
                  }
                }
              }
            }
            if (startDate && endDate) break;
          }

          const EXPLICIT_COL_INDEX = 21; // column V (zero-based 21)
          // detect whether rows contain that many columns
          const hasColV = data.some(row => Array.isArray(row) && row.length > EXPLICIT_COL_INDEX);

          let costIndex = -1;
          if (hasColV) {
            costIndex = EXPLICIT_COL_INDEX;
          } else {
            // try to find header row containing "cost/biaya/spend"
            let headerRow = -1;
            for (let i = 0; i < Math.min(10, data.length); i++) {
              const row = data[i];
              if (!Array.isArray(row)) continue;
              const joined = row.join(' ').toLowerCase();
              if (joined.includes('biaya') || joined.includes('cost') || joined.includes('spend') || joined.includes('amount')) {
                headerRow = i;
                break;
              }
            }
            if (headerRow >= 0) {
              const header = data[headerRow].map(h => (h ? String(h).toLowerCase() : ''));
              for (let i = 0; i < header.length; i++) {
                if (/biaya|cost|amount|spend|total biaya|total cost|total amount/.test(header[i])) {
                  costIndex = i;
                  break;
                }
              }
            }
            // fallback: choose most-numeric column in first 30 rows
            if (costIndex < 0) {
              const sampleRow = data.find(r => Array.isArray(r) && r.length > 0) || [];
              const colCount = sampleRow.length || 0;
              let bestIdx = -1;
              let bestCount = -1;
              for (let c = 0; c < colCount; c++) {
                let numericCount = 0;
                for (let r = 0; r < Math.min(30, data.length); r++) {
                  const cell = data[r][c];
                  if (cell == null) continue;
                  const cleaned = String(cell).replace(/[^\d,.\-()]/g, '').trim();
                  if (cleaned.length > 0 && !Number.isNaN(parseFloat(cleaned.replace(',', '.')))) numericCount++;
                }
                if (numericCount > bestCount) { bestCount = numericCount; bestIdx = c; }
              }
              costIndex = bestIdx;
              if (costIndex >= 0) warnings.push('Using heuristic-detected cost column (not explicit column V).');
            }
          }

          if (costIndex == null || costIndex < 0) {
            warnings.push('Unable to detect cost column.');
            return resolve({ totalAdSpend: 0, startDate, endDate, warnings });
          }

          // sum numbers starting after header row (if any). If headerRow detected, start from headerRow+1
          const startRow = 0; // keep simple: parse all rows and attempt numeric parse
          let total = 0;
          let parsedRows = 0;
          for (let r = startRow; r < data.length; r++) {
            const row = data[r];
            if (!Array.isArray(row)) continue;
            const raw = row[costIndex];
            if (raw == null) continue;
            const s = String(raw).trim();
            if (s === '') continue;
            // normalize: remove currency symbols, spaces; handle parentheses as negative
            let normalized = s.replace(/[^\d,.\-()]/g, '').replace(/\s+/g, '');
            let sign = 1;
            if (/^\(.*\)$/.test(normalized)) {
              sign = -1;
              normalized = normalized.replace(/^\(|\)$/g, '');
            }
            // handle both thousand separators and decimal comma heuristics
            if (normalized.indexOf('.') !== -1 && normalized.indexOf(',') !== -1) {
              // assume commas are thousand separators -> remove commas
              normalized = normalized.replace(/,/g, '');
            } else if (normalized.indexOf(',') !== -1 && normalized.indexOf('.') === -1) {
              // assume comma is decimal separator
              normalized = normalized.replace(/,/g, '.');
            }
            const num = parseFloat(normalized);
            if (!Number.isNaN(num)) {
              total += sign * num;
              parsedRows++;
            }
          }

          if (parsedRows === 0) warnings.push('No numeric values parsed in detected cost column (check CSV format).');

          const totalAdSpend = Number.isFinite(total) ? total : 0;
          resolve({ totalAdSpend, startDate, endDate, warnings });
        } catch (err) {
          reject(err);
        }
      },
      error: (err) => reject(err),
    });
  });
};