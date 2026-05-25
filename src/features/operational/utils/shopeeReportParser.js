import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const toNum = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v !== 'string') return 0;
  const s = v.replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  let n = s;
  if (n.includes('.') && n.includes(','))
    n = n.replace(/\./g, '').replace(',', '.');
  else if (n.includes('.')) {
    const parts = n.split('.');
    if (parts.length > 1 && parts.slice(1).every((p) => p.length === 3))
      n = n.replace(/\./g, '');
  } else if (n.includes(',')) {
    const parts = n.split(',');
    n =
      parts.length === 2 && parts[1].length === 3
        ? n.replace(/,/g, '')
        : n.replace(',', '.');
  }
  const parsed = parseFloat(n);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pctToNum = (v) => {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return 0;
  return parseFloat(v.replace('%', '').replace(',', '.')) || 0;
};

const parseDateDMY = (s) => {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim().split(' ')[0];
  const m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (!m) return null;
  return new Date(+m[3], +m[2] - 1, +m[1], 0, 0, 0, 0);
};

const parsePeriod = (rows) => {
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    for (const cell of row) {
      if (typeof cell !== 'string') continue;
      const m = cell.match(
        /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/
      );
      if (m) {
        const [sd, sm, sy] = m[1].split('/').map(Number);
        const [ed, em, ey] = m[2].split('/').map(Number);
        return {
          start: new Date(sy, sm - 1, sd),
          end: new Date(ey, em - 1, ed),
        };
      }
    }
  }
  return null;
};

const findHeaderRow = (rows, requiredTerms) => {
  for (let i = 0; i < Math.min(15, rows.length); i++) {
    const joined = (rows[i] || []).join('|').toLowerCase();
    if (requiredTerms.every((t) => joined.includes(t))) return i;
  }
  return -1;
};

const buildColMap = (headerRow) => {
  const map = {};
  (headerRow || []).forEach((cell, idx) => {
    if (cell) map[String(cell).trim()] = idx;
  });
  return map;
};

const col = (row, colMap, ...keys) => {
  for (const k of keys) {
    if (colMap[k] !== undefined && row[colMap[k]] != null)
      return row[colMap[k]];
  }
  return null;
};

export const parseAdsCsv = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const period = parsePeriod(data);
          const headerIdx = findHeaderRow(data, [
            'nama iklan',
            'dilihat',
            'biaya',
          ]);
          if (headerIdx < 0)
            return resolve({ period, campaigns: [], totals: {} });

          const colMap = buildColMap(data[headerIdx]);
          const campaigns = [];

          for (let i = headerIdx + 1; i < data.length; i++) {
            const r = data[i];
            if (!r || !r.length) continue;
            const name = col(r, colMap, 'Nama Iklan');
            if (!name) continue;

            campaigns.push({
              rank: toNum(col(r, colMap, 'Urutan')),
              name,
              status: col(r, colMap, 'Status') || '',
              adType: col(r, colMap, 'Jenis Iklan') || '',
              productCode: col(r, colMap, 'Kode Produk') || '',
              biddingMode: col(r, colMap, 'Mode Bidding') || '',
              placement: col(r, colMap, 'Penempatan Iklan') || '',
              impressions: toNum(col(r, colMap, 'Dilihat')),
              clicks: toNum(col(r, colMap, 'Jumlah Klik')),
              ctr: pctToNum(col(r, colMap, 'Persentase Klik')),
              conversions: toNum(col(r, colMap, 'Konversi')),
              directConversions: toNum(col(r, colMap, 'Konversi Langsung')),
              cvr: pctToNum(col(r, colMap, 'Tingkat konversi')),
              directCvr: pctToNum(col(r, colMap, 'Tingkat Konversi Langsung')),
              costPerConversion: toNum(col(r, colMap, 'Biaya per Konversi')),
              directCostPerConversion: toNum(
                col(r, colMap, 'Biaya per Konversi Langsung')
              ),
              productsSold: toNum(col(r, colMap, 'Produk Terjual')),
              directSold: toNum(col(r, colMap, 'Terjual Langsung')),
              revenue: toNum(col(r, colMap, 'Omzet Penjualan')),
              directRevenue: toNum(
                col(r, colMap, 'Penjualan Langsung (GMV Langsung)')
              ),
              spend: toNum(col(r, colMap, 'Biaya')),
              roas: toNum(col(r, colMap, 'Efektifitas Iklan')),
              directRoas: toNum(col(r, colMap, 'Efektivitas Langsung')),
              acos: pctToNum(
                col(
                  r,
                  colMap,
                  'Persentase Biaya Iklan terhadap Penjualan dari Iklan (ACOS)'
                )
              ),
              directAcos: pctToNum(
                col(
                  r,
                  colMap,
                  'Persentase Biaya Iklan terhadap Penjualan dari Iklan Langsung (ACOS Langsung)'
                )
              ),
              voucherAmount: toNum(col(r, colMap, 'Voucher Amount')),
              voucheredSales: toNum(col(r, colMap, 'Vouchered Sales')),
            });
          }

          const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
          const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
          const totalImpressions = campaigns.reduce(
            (s, c) => s + c.impressions,
            0
          );
          const totalClicks = campaigns.reduce((s, c) => s + c.clicks, 0);
          const totalConversions = campaigns.reduce(
            (s, c) => s + c.conversions,
            0
          );

          const totalVoucherAmount = campaigns.reduce(
            (s, c) => s + (c.voucherAmount || 0),
            0
          );
          const totalVoucheredSales = campaigns.reduce(
            (s, c) => s + (c.voucheredSales || 0),
            0
          );

          resolve({
            period,
            campaigns,
            totals: {
              totalSpend,
              totalRevenue,
              totalImpressions,
              totalClicks,
              totalConversions,
              totalVoucherAmount,
              totalVoucheredSales,
              blendedROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
              blendedACOS:
                totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0,
              avgCTR:
                totalImpressions > 0
                  ? (totalClicks / totalImpressions) * 100
                  : 0,
              avgCVR:
                totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
            },
          });
        } catch (e) {
          reject(e);
        }
      },
      error: reject,
    });
  });

export const parseVoucherXlsx = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const findSheet = (keyword) =>
    wb.SheetNames.find((n) => norm(n).includes(keyword));

  let summary = {};
  const summarySheet = findSheet('kriteria utama');
  if (summarySheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[summarySheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    if (rows.length > 1) {
      const v = rows[1];
      summary = {
        periodLabel: v[0] || '',
        influencedSales: toNum(v[2]),
        totalClaims: toNum(v[3]),
        totalUsage: toNum(v[5]),
        usageRate: v[7] || '',
        totalBuyers: toNum(v[9]),
        totalCost: toNum(v[11]),
      };
    }
  }

  const daily = [];
  const dailySheet = findSheet('grafik kriteria');
  if (dailySheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[dailySheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    const hdr = findHeaderRow(rows, ['waktu promo']);
    const startIdx = hdr >= 0 ? hdr + 1 : 1;
    for (let i = startIdx; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const date = parseDateDMY(String(r[0]));
      if (!date) continue;
      daily.push({
        date: date.toISOString(),
        sales: toNum(r[2]),
        claims: toNum(r[3]),
        orders: toNum(r[5]),
        usageRate: r[7] || '',
        buyers: toNum(r[9]),
        voucherCost: toNum(r[11]),
      });
    }
  }

  const vouchers = [];
  const detailSheet = findSheet('rincian performa');
  if (detailSheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[detailSheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      vouchers.push({
        name: r[0] || '',
        code: r[1] || '',
        period: r[2] || '',
        status: r[3] || '',
        creator: r[4] || '',
        type: r[5] || '',
        rewardType: r[6] || '',
        claims: toNum(r[7]),
        usage: toNum(r[9]),
        usageRate: r[11] || '',
        influencedSales: toNum(r[13]),
        cost: toNum(r[15]),
        productsSold: toNum(r[17]),
        buyers: toNum(r[19]),
        salesPerBuyer: toNum(r[21]),
      });
    }
  }

  const period =
    daily.length > 0
      ? {
          start: new Date(daily[0].date),
          end: new Date(daily[daily.length - 1].date),
        }
      : null;

  return { period, summary, daily, vouchers };
};

export const parseShopStatsXlsx = (buffer) => {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();
  const findSheet = (keyword) =>
    wb.SheetNames.find((n) => norm(n).includes(keyword));

  const parseDailySheet = (sheetName) => {
    if (!sheetName) return { summary: {}, daily: [] };
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
      header: 1,
      defval: null,
      raw: true,
    });
    let summary = {};
    const daily = [];

    if (rows[1]) {
      const r = rows[1];
      summary = {
        periodLabel: r[0] || '',
        totalSales: toNum(r[1]),
        totalOrders: toNum(r[2]),
        aov: toNum(r[3]),
        totalClicks: toNum(r[4]),
        totalVisitors: toNum(r[5]),
        conversionRate: pctToNum(r[6]),
        canceledOrders: toNum(r[7]),
        canceledValue: toNum(r[8]),
        returnedOrders: toNum(r[9]),
        returnedValue: toNum(r[10]),
        totalBuyers: toNum(r[11]),
        newBuyers: toNum(r[12]),
        returningBuyers: toNum(r[13]),
        potentialBuyers: toNum(r[14]),
        repeatRate: pctToNum(r[15]),
      };
    }

    const hdr2 = rows.findIndex(
      (r, i) =>
        i > 0 &&
        Array.isArray(r) &&
        String(r[0] || '')
          .toLowerCase()
          .includes('tanggal')
    );
    const startIdx = hdr2 >= 0 ? hdr2 + 1 : 3;
    for (let i = startIdx; i < rows.length; i++) {
      const r = rows[i];
      if (!r || !r[0]) continue;
      const date = parseDateDMY(String(r[0]));
      if (!date) continue;
      daily.push({
        date: date.toISOString(),
        sales: toNum(r[1]),
        orders: toNum(r[2]),
        aov: toNum(r[3]),
        clicks: toNum(r[4]),
        visitors: toNum(r[5]),
        cvr: pctToNum(r[6]),
        canceledOrders: toNum(r[7]),
        canceledValue: toNum(r[8]),
        returnedOrders: toNum(r[9]),
        returnedValue: toNum(r[10]),
        buyers: toNum(r[11]),
        newBuyers: toNum(r[12]),
        returningBuyers: toNum(r[13]),
        potentialBuyers: toNum(r[14]),
        repeatRate: pctToNum(r[15]),
      });
    }
    return { summary, daily };
  };

  const shipped = parseDailySheet(findSheet('pesanan siap dikirim'));
  const created = parseDailySheet(findSheet('pesanan dibuat'));
  const stats = shipped.daily.length > 0 ? shipped : created;

  const trafficSources = [];
  const adsSources = [];
  const trafficSheet =
    wb.SheetNames.find(
      (n) =>
        norm(n).includes('sumber kunjungan') && norm(n).includes('pesanan siap')
    ) || findSheet('asal kunjungan');
  if (trafficSheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[trafficSheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    let section = null;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const first = norm(r[0] || '');

      if (first === 'sumber kunjungan' && norm(r[1] || '').includes('rasio')) {
        const peek = rows[i + 1];
        if (
          peek &&
          (norm(peek[0] || '').includes('product ads') ||
            norm(peek[0] || '').includes('iklan produk'))
        ) {
          section = 'ads';
        } else {
          section = 'traffic';
        }
        continue;
      }

      if (!r[0] || first === '' || first === 'nan') {
        section = null;
        continue;
      }
      if (
        [
          'halaman produk',
          'live penjual',
          'video penjual',
          'affiliate',
          'iklan shopee',
        ].some((k) => first === k)
      ) {
        section = null;
        continue;
      }

      if (section === 'traffic') {
        trafficSources.push({
          source: String(r[0]),
          salesRatio: pctToNum(r[1]),
          sales: toNum(r[2]),
          views: toNum(r[3]),
          clicks: toNum(r[4]),
          orders: toNum(r[5]),
          products: toNum(r[6]),
          ctr: pctToNum(r[7]),
          cvr: pctToNum(r[8]),
          aov: toNum(r[9]),
          buyers: toNum(r[10]),
        });
      }
      if (section === 'ads') {
        adsSources.push({
          type: String(r[0]),
          salesRatio: pctToNum(r[1]),
          sales: toNum(r[2]),
          impressions: toNum(r[3]),
          orders: toNum(r[4]),
          cvr: pctToNum(r[5]),
          spend: toNum(r[6]),
          roas: toNum(r[7]),
        });
      }
    }
  }

  const topProducts = [];
  const contribSheet =
    wb.SheetNames.find(
      (n) =>
        norm(n).includes('kontribusi') &&
        norm(n).includes('pesanan siap dikirim')
    ) || findSheet('kontribusi');
  if (contribSheet) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[contribSheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    let inProducts = false;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const first = norm(r[0] || '');
      if (first === 'kode produk' && norm(r[1] || '').includes('produk')) {
        inProducts = true;
        continue;
      }
      if (!r[0] || first === '' || first === 'nan') {
        inProducts = false;
        continue;
      }
      if (
        ['live penjual', 'video penjual', 'affiliate'].some((k) =>
          first.includes(k)
        )
      ) {
        inProducts = false;
        continue;
      }
      if (inProducts) {
        topProducts.push({
          productCode: String(r[0]),
          name: String(r[1] || ''),
          productStatus: String(r[2] || ''),
          salesRatio: pctToNum(r[3]),
          sales: toNum(r[4]),
          views: toNum(r[5]),
          clicks: toNum(r[6]),
          orders: toNum(r[7]),
          products: toNum(r[8]),
          ctr: pctToNum(r[9]),
          cvr: pctToNum(r[10]),
          aov: toNum(r[11]),
          buyers: toNum(r[12]),
        });
      }
    }
  }

  // Channel breakdown from Kontribusi sheet header (R0-R1)
  let channelBreakdown = null;
  const contribSummarySheet =
    wb.SheetNames.find(
      (n) =>
        norm(n).includes('kontribusi') &&
        norm(n).includes('pesanan siap dikirim')
    ) || findSheet('kontribusi');
  if (contribSummarySheet) {
    const cRows = XLSX.utils.sheet_to_json(wb.Sheets[contribSummarySheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    if (cRows[1]) {
      const cr = cRows[1];
      channelBreakdown = {
        totalSales: toNum(cr[2]),
        fromProductPage: toNum(cr[3]),
        fromLive: toNum(cr[4]),
        fromVideo: toNum(cr[5]),
        fromAffiliate: toNum(cr[6]),
        fromAds: toNum(cr[7]),
      };
    }
  }

  // Daily per traffic source from Asal Penjualan sheet
  const dailyPerSource = [];
  const dailySourceSheet = wb.SheetNames.find(
    (n) => norm(n).includes('asal') && norm(n).includes('pesanan siap dikirim')
  );
  if (dailySourceSheet) {
    const dsRows = XLSX.utils.sheet_to_json(wb.Sheets[dailySourceSheet], {
      header: 1,
      defval: null,
      raw: true,
    });
    let currentSource = null;
    for (let i = 0; i < dsRows.length; i++) {
      const r = dsRows[i];
      if (!r) continue;
      const first = norm(r[0] || '');
      if (
        first &&
        !first.match(/^\d/) &&
        first !== 'nan' &&
        norm(r[1] || '').includes('%')
      ) {
        const parsed = parseDateDMY(String(r[0]));
        if (!parsed) {
          currentSource = String(r[0]);
          continue;
        }
      }
      if (currentSource) {
        const date = parseDateDMY(String(r[0]));
        if (date) {
          dailyPerSource.push({
            source: currentSource,
            date: date.toISOString(),
            salesRatio: pctToNum(r[1]),
            sales: toNum(r[2]),
            views: toNum(r[3]),
            clicks: toNum(r[4]),
            orders: toNum(r[5]),
            products: toNum(r[6]),
            ctr: pctToNum(r[7]),
            cvr: pctToNum(r[8]),
            aov: toNum(r[9]),
            buyers: toNum(r[10]),
          });
        }
      }
    }
  }

  const period =
    stats.daily.length > 0
      ? {
          start: new Date(stats.daily[0].date),
          end: new Date(stats.daily[stats.daily.length - 1].date),
        }
      : null;

  return {
    period,
    summary: stats.summary,
    daily: stats.daily,
    trafficSources,
    topProducts: topProducts.sort((a, b) => b.sales - a.sales).slice(0, 20),
    adsSources,
    channelBreakdown,
    dailyPerSource,
  };
};

export const detectAndParse = async (file) => {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith('.csv')) {
    return { type: 'ads', data: await parseAdsCsv(file) };
  }

  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheetNames = wb.SheetNames.map((s) => s.toLowerCase());

  if (
    sheetNames.some(
      (s) => s.includes('kriteria utama') || s.includes('grafik kriteria')
    )
  ) {
    return { type: 'voucher', data: parseVoucherXlsx(buffer) };
  }

  if (
    sheetNames.some(
      (s) => s.includes('pesanan dibuat') || s.includes('pesanan siap')
    )
  ) {
    return { type: 'shopStats', data: parseShopStatsXlsx(buffer) };
  }

  return { type: 'unknown', data: null };
};
