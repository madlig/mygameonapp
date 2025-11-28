import * as XLSX from 'xlsx';

const HEADER_MAP = {
  date: "Tanggal",
  grossIncome: "Total Penjualan (IDR)",
  totalOrders: "Total Pesanan",
  canceledOrders: "Pesanan Dibatalkan",
  canceledValue: "Penjualan Dibatalkan", // <-- PERBAIKAN NAMA
  returnedOrders: "Pesanan Dikembalikan",
  returnedValue: "Penjualan Dikembalikan", // <-- PERBAIKAN NAMA
};

const cleanAndParseNumber = (rawValue) => {
  if (typeof rawValue === 'number') return rawValue;
  if (typeof rawValue === 'string') {
    const cleanedString = rawValue.replace(/[^\d,-]/g, '').replace(',', '.');
    const number = parseFloat(cleanedString);
    return isNaN(number) ? 0 : number;
  }
  return 0;
};

const convertExcelDate = (excelDate) => {
    const date = new Date((excelDate - 25569) * 86400 * 1000);
    return date;
};

/**
 * Mem-parsing buffer file XLSX dan mengembalikan SEMUA laporan harian yang ditemukan.
 */
export const parseShopeeReportForBulk = (arrayBuffer) => {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: "buffer" });
    const targetSheetName = "Pesanan Siap Dikirim";
    const worksheet = workbook.Sheets[targetSheetName];

    if (!worksheet) {
      alert(`Error: Sheet "${targetSheetName}" tidak ditemukan.`);
      return [];
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    let headerRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].includes("Total Penjualan (IDR)")) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      alert("Format laporan tidak dikenali. Gagal menemukan baris header.");
      return [];
    }

    const headerRow = rows[headerRowIndex];
    const headerIndexMap = {};
    headerRow.forEach((header, index) => {
      if (header) headerIndexMap[header.trim()] = index;
    });

    const dailyReports = [];
    for (let i = headerRowIndex + 2; i < rows.length; i++) {
      const dataRow = rows[i];
      if (!dataRow || dataRow.length === 0 || !dataRow[headerIndexMap["Tanggal"]]) continue;

      const parsedData = {};
      let hasValidData = false;

      for (const [key, headerText] of Object.entries(HEADER_MAP)) {
        const columnIndex = headerIndexMap[headerText];
        if (columnIndex !== undefined) {
          const rawValue = dataRow[columnIndex];
          if (key === 'date') {
            if (typeof rawValue === 'number') {
                parsedData[key] = convertExcelDate(rawValue);
            } else if (typeof rawValue === 'string') {
                const parts = rawValue.split('-');
                if (parts.length === 3) {
                    parsedData[key] = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            }
          } else {
            parsedData[key] = cleanAndParseNumber(rawValue);
          }
          if (parsedData[key]) hasValidData = true;
        } else {
          parsedData[key] = key === 'date' ? null : 0;
        }
      }
      
      if (hasValidData && parsedData.date) {
        dailyReports.push(parsedData);
      }
    }
    
    return dailyReports;

  } catch (error) {
    console.error("Error saat parsing file XLSX:", error);
    alert("Terjadi kesalahan teknis saat membaca file.");
    return [];
  }
};