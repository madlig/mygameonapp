import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { buildFinancialSnapshot } from '../services/financialCalculator';
import {
  normalizeToLocalMidnight,
  toDateKey,
  toLocalEndOfDay,
  toLocalStartOfDay,
} from './dateUtils';

const MAX_BATCH_OPERATIONS = 450;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const commitWriteOperations = async (operations) => {
  const chunks = chunkArray(operations, MAX_BATCH_OPERATIONS);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((operation) => {
      if (operation.type === 'set') {
        batch.set(operation.ref, operation.data);
      } else {
        batch.update(operation.ref, operation.data);
      }
    });
    await batch.commit();
  }
};

const buildPayload = (report, existing = null) => {
  const normalizedDate = normalizeToLocalMidnight(report.date);
  if (!normalizedDate) return null;

  const grossIncome = toNumber(report.grossIncome);
  const totalOrders = toNumber(report.totalOrders);
  const canceledOrders = toNumber(report.canceledOrders);
  const canceledValue = toNumber(report.canceledValue);
  const returnedOrders = toNumber(report.returnedOrders);
  const returnedValue = toNumber(report.returnedValue);
  const voucherCost = toNumber(existing?.voucherCost ?? 0);
  const adSpend = toNumber(existing?.adSpend ?? 0);
  const financial = buildFinancialSnapshot({
    grossIncome,
    canceledValue,
    returnedValue,
    totalOrders,
    canceledOrders,
    returnedOrders,
    voucherCost,
    adSpend,
  });

  return {
    date: normalizedDate,
    year: normalizedDate.getFullYear(),
    month: normalizedDate.getMonth(),
    grossIncome,
    totalOrders,
    canceledOrders,
    canceledValue,
    returnedOrders,
    returnedValue,
    voucherCost,
    adSpend,
    adSpendSource: existing?.adSpendSource || 'manual',
    ...financial,
  };
};

const isSameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export const importDailyRevenueReports = async (reports = []) => {
  const normalizedReportsByDate = new Map();

  reports.forEach((report) => {
    const normalizedDate = normalizeToLocalMidnight(report?.date);
    const key = toDateKey(normalizedDate);
    if (!key) return;
    normalizedReportsByDate.set(key, {
      ...report,
      date: normalizedDate,
    });
  });

  const normalizedReports = Array.from(normalizedReportsByDate.values());
  if (!normalizedReports.length) {
    return { created: 0, updated: 0, total: 0 };
  }

  const sortedDates = normalizedReports
    .map((item) => item.date)
    .sort((a, b) => a.getTime() - b.getTime());
  const startDate = toLocalStartOfDay(sortedDates[0]);
  const endDate = toLocalEndOfDay(sortedDates[sortedDates.length - 1]);

  const existingQuery = query(
    collection(db, 'dailyRevenues'),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );
  const existingSnapshot = await getDocs(existingQuery);
  const existingByDateKey = new Map();

  existingSnapshot.docs.forEach((existingDoc) => {
    const data = existingDoc.data();
    const existingDate = data.date?.toDate ? data.date.toDate() : data.date;
    const key = toDateKey(existingDate);
    if (!key) return;
    existingByDateKey.set(key, {
      id: existingDoc.id,
      data,
    });
  });

  const operations = [];
  let created = 0;
  let updated = 0;

  normalizedReports.forEach((report) => {
    const key = toDateKey(report.date);
    if (!key) return;
    const existing = existingByDateKey.get(key);
    const payload = buildPayload(report, existing?.data);
    if (!payload) return;

    if (!existing) {
      const newRef = doc(collection(db, 'dailyRevenues'));
      operations.push({
        type: 'set',
        ref: newRef,
        data: {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });
      created += 1;
      return;
    }

    const comparableExisting = {
      date: normalizeToLocalMidnight(
        existing.data.date?.toDate
          ? existing.data.date.toDate()
          : existing.data.date
      ),
      year: existing.data.year,
      month: existing.data.month,
      grossIncome: toNumber(existing.data.grossIncome),
      totalOrders: toNumber(existing.data.totalOrders),
      successfulOrders: toNumber(existing.data.successfulOrders),
      canceledOrders: toNumber(existing.data.canceledOrders),
      canceledValue: toNumber(existing.data.canceledValue),
      returnedOrders: toNumber(existing.data.returnedOrders),
      returnedValue: toNumber(existing.data.returnedValue),
      voucherCost: toNumber(existing.data.voucherCost),
      adSpend: toNumber(existing.data.adSpend),
      adSpendSource: existing.data.adSpendSource || 'manual',
      calculatedNetRevenue: toNumber(existing.data.calculatedNetRevenue),
    };

    const comparablePayload = {
      ...payload,
      successfulOrders: toNumber(payload.successfulOrders),
      calculatedNetRevenue: toNumber(payload.calculatedNetRevenue),
    };

    if (isSameValue(comparableExisting, comparablePayload)) {
      return;
    }

    operations.push({
      type: 'update',
      ref: doc(db, 'dailyRevenues', existing.id),
      data: {
        ...payload,
        updatedAt: serverTimestamp(),
      },
    });
    updated += 1;
  });

  if (operations.length > 0) {
    await commitWriteOperations(operations);
  }

  return { created, updated, total: created + updated };
};
