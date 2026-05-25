import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { buildFinancialSnapshot } from './financialCalculator';

const COLLECTION = 'shopeeAnalytics';

// Day-precise key so partial-month uploads (e.g. week 1 vs week 2 of May)
// become separate documents instead of colliding into one YYYY-MM doc.
const toDayKey = (date) => {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const savePortfolioData = async (parsedFiles) => {
  let periodStart = null;
  let periodEnd = null;

  for (const { data } of parsedFiles) {
    if (!data?.period) continue;
    const s = new Date(data.period.start);
    const e = new Date(data.period.end);
    if (!periodStart || s < periodStart) periodStart = s;
    if (!periodEnd || e > periodEnd) periodEnd = e;
  }

  if (!periodStart || !periodEnd) {
    throw new Error('Tidak dapat mendeteksi periode dari file.');
  }

  const docId = `${toDayKey(periodStart)}_${toDayKey(periodEnd)}`;
  const docRef = doc(db, COLLECTION, docId);

  const existingSnap = await getDocs(collection(db, COLLECTION));
  let existingData = {};
  const existingDoc = existingSnap.docs.find((d) => d.id === docId);
  if (existingDoc) {
    existingData = existingDoc.data() || {};
  }

  const payload = {
    periodStart,
    periodEnd,
    uploadedAt: serverTimestamp(),
  };

  for (const { type, data } of parsedFiles) {
    if (!data) continue;
    if (type === 'ads') {
      payload.ads = {
        campaigns: data.campaigns || [],
        totals: data.totals || {},
      };
    } else if (type === 'voucher') {
      payload.voucher = {
        summary: data.summary || {},
        daily: data.daily || [],
        vouchers: data.vouchers || [],
      };
    } else if (type === 'shopStats') {
      payload.shopStats = {
        summary: data.summary || {},
        daily: data.daily || [],
        trafficSources: data.trafficSources || [],
        topProducts: data.topProducts || [],
        adsSources: data.adsSources || [],
        channelBreakdown: data.channelBreakdown || null,
        dailyPerSource: data.dailyPerSource || [],
      };
    }
  }

  const merged = { ...existingData, ...payload };
  await setDoc(docRef, merged, { merge: true });
  return { docId, periodStart, periodEnd };
};

export const loadPortfolioData = async (periodKey = null) => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy('periodEnd', 'desc'))
  );
  if (snap.empty) return null;

  if (periodKey) {
    const found = snap.docs.find((d) => d.id === periodKey);
    if (found) return { id: found.id, ...normalizeDoc(found.data()) };
    return null;
  }

  const d = snap.docs[0];
  return { id: d.id, ...normalizeDoc(d.data()) };
};

/* ════════════════════════════════════════════════════════════
   Merge-on-read: combine every imported period that overlaps a
   selected date range into one analyzer-ready dataset.

   - Aggregates (summary, campaign/voucher/product/source lists,
     channel breakdown) are SUMMED across overlapping imports, then
     all ratios re-derived from the summed absolutes.
   - Daily arrays are concatenated, CLIPPED to the range, de-duped
     by date, and sorted — so charts respect the exact dates while
     KPI cards reflect the full imports they came from.
   ════════════════════════════════════════════════════════════ */

// Group objects from multiple lists by a key, summing the given
// numeric fields. Non-summed fields are taken from the first seen
// (most-recent) occurrence. `finalize` recomputes derived ratios.
const mergeListBy = (lists, keyFn, sumFields, finalize) => {
  const map = new Map();
  for (const list of lists) {
    for (const item of list || []) {
      const key = keyFn(item);
      if (key == null || key === '') continue;
      if (!map.has(key)) {
        const base = { ...item };
        for (const f of sumFields) base[f] = 0;
        map.set(key, base);
      }
      const acc = map.get(key);
      for (const f of sumFields) acc[f] = (acc[f] || 0) + (item[f] || 0);
    }
  }
  const out = Array.from(map.values());
  if (finalize) out.forEach(finalize);
  return out;
};

// Concat daily rows from multiple imports, keep only those inside the
// range, drop duplicate keys (keeping the most-recent import), sort asc.
const clipDailyDedup = (lists, rs, re, keyFn) => {
  const s = rs.getTime();
  const e = re.getTime();
  const map = new Map();
  for (const list of lists) {
    for (const item of list || []) {
      const t = new Date(item.date).getTime();
      if (!Number.isFinite(t) || t < s || t > e) continue;
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, item);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
};

const mergePortfolioDocs = (docs, rs, re) => {
  const asDate = (v) => (v instanceof Date ? v : new Date(v));
  const periods = docs
    .map((d) => ({
      id: d.id,
      start: asDate(d.periodStart),
      end: asDate(d.periodEnd),
    }))
    .sort((a, b) => a.start - b.start);
  const periodStart = periods.reduce(
    (min, p) => (!min || p.start < min ? p.start : min),
    null
  );
  const periodEnd = periods.reduce(
    (max, p) => (!max || p.end > max ? p.end : max),
    null
  );

  /* ── ADS ── */
  const adsDocs = docs.map((d) => d.ads).filter(Boolean);
  let ads = null;
  if (adsDocs.length) {
    const campaigns = mergeListBy(
      adsDocs.map((a) => a.campaigns || []),
      (c) => c.name,
      [
        'impressions',
        'clicks',
        'conversions',
        'directConversions',
        'productsSold',
        'directSold',
        'revenue',
        'directRevenue',
        'spend',
        'voucherAmount',
        'voucheredSales',
      ],
      (c) => {
        c.ctr = c.impressions ? (c.clicks / c.impressions) * 100 : 0;
        c.cvr = c.clicks ? (c.conversions / c.clicks) * 100 : 0;
        c.roas = c.spend ? c.revenue / c.spend : 0;
        c.acos = c.revenue ? (c.spend / c.revenue) * 100 : 0;
        c.costPerConversion = c.conversions ? c.spend / c.conversions : 0;
      }
    );
    const sum = (f) => campaigns.reduce((s, c) => s + (c[f] || 0), 0);
    const totalSpend = sum('spend');
    const totalRevenue = sum('revenue');
    const totalImpressions = sum('impressions');
    const totalClicks = sum('clicks');
    const totalConversions = sum('conversions');
    ads = {
      campaigns,
      totals: {
        totalSpend,
        totalRevenue,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalVoucherAmount: sum('voucherAmount'),
        totalVoucheredSales: sum('voucheredSales'),
        blendedROAS: totalSpend > 0 ? totalRevenue / totalSpend : 0,
        blendedACOS: totalRevenue > 0 ? (totalSpend / totalRevenue) * 100 : 0,
        avgCTR:
          totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
        avgCVR: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
      },
    };
  }

  /* ── VOUCHER ── */
  const vDocs = docs.map((d) => d.voucher).filter(Boolean);
  let voucher = null;
  if (vDocs.length) {
    const summary = {};
    for (const k of [
      'influencedSales',
      'totalClaims',
      'totalUsage',
      'totalBuyers',
      'totalCost',
    ]) {
      summary[k] = vDocs.reduce((s, v) => s + (v.summary?.[k] || 0), 0);
    }
    const vouchers = mergeListBy(
      vDocs.map((v) => v.vouchers || []),
      (x) => x.name || x.code,
      ['claims', 'usage', 'influencedSales', 'cost', 'productsSold', 'buyers'],
      (x) => {
        x.usageRate = x.claims
          ? `${((x.usage / x.claims) * 100).toFixed(1)}%`
          : x.usageRate;
        x.salesPerBuyer = x.buyers ? x.influencedSales / x.buyers : 0;
      }
    );
    const daily = clipDailyDedup(
      vDocs.map((v) => v.daily || []),
      rs,
      re,
      (d) => d.date
    );
    voucher = { summary, daily, vouchers };
  }

  /* ── SHOP STATS ── */
  const sDocs = docs.map((d) => d.shopStats).filter(Boolean);
  let shopStats = null;
  if (sDocs.length) {
    const summary = {};
    for (const k of [
      'totalSales',
      'totalOrders',
      'totalClicks',
      'totalVisitors',
      'canceledOrders',
      'canceledValue',
      'returnedOrders',
      'returnedValue',
      'totalBuyers',
      'newBuyers',
      'returningBuyers',
      'potentialBuyers',
    ]) {
      summary[k] = sDocs.reduce((s, x) => s + (x.summary?.[k] || 0), 0);
    }
    summary.aov = summary.totalOrders
      ? summary.totalSales / summary.totalOrders
      : 0;
    summary.conversionRate = summary.totalVisitors
      ? (summary.totalBuyers / summary.totalVisitors) * 100
      : 0;
    summary.repeatRate = summary.totalBuyers
      ? (summary.returningBuyers / summary.totalBuyers) * 100
      : 0;

    const totalSales = summary.totalSales || 0;

    const trafficSources = mergeListBy(
      sDocs.map((x) => x.trafficSources || []),
      (t) => t.source,
      ['sales', 'views', 'clicks', 'orders', 'products', 'buyers'],
      (t) => {
        t.salesRatio = totalSales ? (t.sales / totalSales) * 100 : 0;
        t.ctr = t.views ? (t.clicks / t.views) * 100 : 0;
        t.cvr = t.clicks ? (t.orders / t.clicks) * 100 : 0;
        t.aov = t.orders ? t.sales / t.orders : 0;
      }
    );
    const adsSources = mergeListBy(
      sDocs.map((x) => x.adsSources || []),
      (t) => t.type,
      ['sales', 'impressions', 'orders', 'spend'],
      (t) => {
        t.salesRatio = totalSales ? (t.sales / totalSales) * 100 : 0;
        t.cvr = t.impressions ? (t.orders / t.impressions) * 100 : 0;
        t.roas = t.spend ? t.sales / t.spend : 0;
      }
    );
    const topProducts = mergeListBy(
      sDocs.map((x) => x.topProducts || []),
      (p) => p.productCode || p.name,
      ['sales', 'views', 'clicks', 'orders', 'products', 'buyers'],
      (p) => {
        p.salesRatio = totalSales ? (p.sales / totalSales) * 100 : 0;
        p.ctr = p.views ? (p.clicks / p.views) * 100 : 0;
        p.cvr = p.clicks ? (p.orders / p.clicks) * 100 : 0;
        p.aov = p.orders ? p.sales / p.orders : 0;
      }
    ).sort((a, b) => b.sales - a.sales);

    let channelBreakdown = null;
    const cbDocs = sDocs.map((x) => x.channelBreakdown).filter(Boolean);
    if (cbDocs.length) {
      channelBreakdown = {};
      for (const k of [
        'totalSales',
        'fromProductPage',
        'fromLive',
        'fromVideo',
        'fromAffiliate',
        'fromAds',
      ]) {
        channelBreakdown[k] = cbDocs.reduce((s, c) => s + (c[k] || 0), 0);
      }
    }

    shopStats = {
      summary,
      daily: clipDailyDedup(
        sDocs.map((x) => x.daily || []),
        rs,
        re,
        (d) => d.date
      ),
      dailyPerSource: clipDailyDedup(
        sDocs.map((x) => x.dailyPerSource || []),
        rs,
        re,
        (d) => `${d.source}|${d.date}`
      ),
      trafficSources,
      adsSources,
      topProducts: topProducts.slice(0, 20),
      channelBreakdown,
    };
  }

  return {
    id: docs.map((d) => d.id).join('+'),
    periodStart,
    periodEnd,
    periods,
    periodCount: periods.length,
    ads,
    voucher,
    shopStats,
  };
};

export const loadPortfolioDataInRange = async (rangeStart, rangeEnd) => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy('periodEnd', 'desc'))
  );
  if (snap.empty) return null;

  const rs = new Date(rangeStart);
  rs.setHours(0, 0, 0, 0);
  const re = new Date(rangeEnd);
  re.setHours(23, 59, 59, 999);

  const docs = snap.docs
    .map((d) => ({ id: d.id, ...normalizeDoc(d.data()) }))
    .filter((d) => {
      const s =
        d.periodStart instanceof Date ? d.periodStart : new Date(d.periodStart);
      const e =
        d.periodEnd instanceof Date ? d.periodEnd : new Date(d.periodEnd);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return false;
      return s <= re && e >= rs; // period overlaps selected range
    });

  if (docs.length === 0) return null;
  return mergePortfolioDocs(docs, rs, re);
};

export const listPortfolioPeriods = async () => {
  const snap = await getDocs(
    query(collection(db, COLLECTION), orderBy('periodEnd', 'desc'))
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      periodStart: data.periodStart?.toDate?.() || data.periodStart,
      periodEnd: data.periodEnd?.toDate?.() || data.periodEnd,
      uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
      hasAds: !!data.ads,
      hasVoucher: !!data.voucher,
      hasShopStats: !!data.shopStats,
    };
  });
};

export const deletePortfolioPeriod = async (docId) => {
  await deleteDoc(doc(db, COLLECTION, docId));
};

const normalizeDoc = (data) => ({
  periodStart: data.periodStart?.toDate?.() || data.periodStart,
  periodEnd: data.periodEnd?.toDate?.() || data.periodEnd,
  uploadedAt: data.uploadedAt?.toDate?.() || data.uploadedAt,
  ads: data.ads || null,
  voucher: data.voucher || null,
  shopStats: data.shopStats || null,
});

/**
 * Generate dailyRevenues from parsed Shopee report files.
 * Merges shop stats daily + voucher daily + revenue-weighted ad spend.
 */
export const generateDailyRevenues = async (parsedFiles) => {
  let shopDaily = [];
  let voucherDaily = [];
  let totalAdSpend = 0;

  for (const { type, data } of parsedFiles) {
    if (!data) continue;
    if (type === 'shopStats') shopDaily = data.daily || [];
    if (type === 'voucher') voucherDaily = data.daily || [];
    if (type === 'ads') totalAdSpend = data.totals?.totalSpend || 0;
  }

  if (shopDaily.length === 0) return { written: 0 };

  // Build date-keyed map from shop stats
  const dayMap = new Map();
  for (const d of shopDaily) {
    if (!d.date) continue;
    const dt = d.date instanceof Date ? d.date : new Date(d.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    dayMap.set(key, {
      date: dt,
      grossIncome: d.sales || 0,
      totalOrders: d.orders || 0,
      voucherCost: 0,
      adSpend: 0,
    });
  }

  // Merge voucher daily
  for (const d of voucherDaily) {
    if (!d.date) continue;
    const dt = d.date instanceof Date ? d.date : new Date(d.date);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    if (dayMap.has(key)) {
      dayMap.get(key).voucherCost = d.voucherCost || 0;
    }
  }

  // Distribute ad spend revenue-weighted
  if (totalAdSpend > 0) {
    const totalRevenue = Array.from(dayMap.values()).reduce(
      (s, d) => s + d.grossIncome,
      0
    );
    for (const entry of dayMap.values()) {
      entry.adSpend =
        totalRevenue > 0
          ? Math.round((entry.grossIncome / totalRevenue) * totalAdSpend)
          : Math.round(totalAdSpend / dayMap.size);
    }
  }

  // Write to dailyRevenues in batches
  const entries = Array.from(dayMap.entries());
  const batchSize = 450;
  let written = 0;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = entries.slice(i, i + batchSize);

    for (const [key, entry] of chunk) {
      const docRef = doc(db, 'dailyRevenues', key);
      const { calculatedNetRevenue, successfulOrders } = buildFinancialSnapshot(
        {
          grossIncome: entry.grossIncome,
          canceledValue: 0,
          returnedValue: 0,
          totalOrders: entry.totalOrders,
          canceledOrders: 0,
          returnedOrders: 0,
          voucherCost: entry.voucherCost,
          adSpend: entry.adSpend,
        }
      );

      batch.set(
        docRef,
        {
          date: entry.date,
          grossIncome: entry.grossIncome,
          totalOrders: entry.totalOrders,
          successfulOrders,
          canceledOrders: 0,
          returnedOrders: 0,
          canceledValue: 0,
          returnedValue: 0,
          voucherCost: entry.voucherCost,
          adSpend: entry.adSpend,
          calculatedNetRevenue,
          uploadedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    written += chunk.length;
  }

  return { written };
};
