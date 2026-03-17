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
import { buildFinancialSnapshot } from './financialCalculator';
import {
  normalizeToLocalMidnight,
  toDateKey,
  toLocalEndOfDay,
  toLocalStartOfDay,
} from '../utils/dateUtils';

const MAX_BATCH_OPERATIONS = 450;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const chunkArray = (items, size) => {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const commitOperations = async (operations) => {
  const chunks = chunkArray(operations, MAX_BATCH_OPERATIONS);
  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((operation) => {
      if (operation.type === 'set') batch.set(operation.ref, operation.data);
      else batch.update(operation.ref, operation.data);
    });
    await batch.commit();
  }
};

export const importVoucherReports = async (reports = []) => {
  const dailyByDate = new Map();
  reports.forEach((item) => {
    const date = normalizeToLocalMidnight(item?.date);
    const key = toDateKey(date);
    if (!key) return;
    dailyByDate.set(key, {
      date,
      voucherCost: toNumber(item.voucherCost),
    });
  });

  const normalizedReports = Array.from(dailyByDate.values());
  if (!normalizedReports.length) {
    return { created: 0, updated: 0, skipped: 0, total: 0 };
  }

  const sortedDates = normalizedReports
    .map((item) => item.date)
    .sort((a, b) => a.getTime() - b.getTime());

  const existingQuery = query(
    collection(db, 'dailyRevenues'),
    where('date', '>=', toLocalStartOfDay(sortedDates[0])),
    where('date', '<=', toLocalEndOfDay(sortedDates[sortedDates.length - 1])),
    orderBy('date', 'asc')
  );
  const existingSnapshot = await getDocs(existingQuery);

  const existingByDate = new Map();
  existingSnapshot.docs.forEach((docItem) => {
    const data = docItem.data();
    const date = normalizeToLocalMidnight(
      data.date?.toDate ? data.date.toDate() : data.date
    );
    const key = toDateKey(date);
    if (!key || existingByDate.has(key)) return;
    existingByDate.set(key, {
      id: docItem.id,
      data,
    });
  });

  const operations = [];
  let created = 0;
  let updated = 0;
  let skipped = 0;

  normalizedReports.forEach((report) => {
    const key = toDateKey(report.date);
    const existing = key ? existingByDate.get(key) : null;

    if (!existing) {
      const financial = buildFinancialSnapshot({
        grossIncome: 0,
        totalOrders: 0,
        canceledOrders: 0,
        canceledValue: 0,
        returnedOrders: 0,
        returnedValue: 0,
        voucherCost: report.voucherCost,
        adSpend: 0,
      });

      operations.push({
        type: 'set',
        ref: doc(collection(db, 'dailyRevenues')),
        data: {
          date: report.date,
          year: report.date.getFullYear(),
          month: report.date.getMonth(),
          grossIncome: 0,
          totalOrders: 0,
          successfulOrders: financial.successfulOrders,
          canceledOrders: 0,
          canceledValue: 0,
          returnedOrders: 0,
          returnedValue: 0,
          voucherCost: report.voucherCost,
          adSpend: 0,
          adSpendSource: 'manual',
          calculatedNetRevenue: financial.calculatedNetRevenue,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
      });
      created += 1;
      return;
    }

    const currentVoucherCost = toNumber(existing.data.voucherCost);
    if (currentVoucherCost === report.voucherCost) {
      skipped += 1;
      return;
    }

    const financial = buildFinancialSnapshot({
      grossIncome: toNumber(existing.data.grossIncome),
      totalOrders: toNumber(existing.data.totalOrders),
      canceledOrders: toNumber(existing.data.canceledOrders),
      canceledValue: toNumber(existing.data.canceledValue),
      returnedOrders: toNumber(existing.data.returnedOrders),
      returnedValue: toNumber(existing.data.returnedValue),
      voucherCost: report.voucherCost,
      adSpend: toNumber(existing.data.adSpend),
    });

    operations.push({
      type: 'update',
      ref: doc(db, 'dailyRevenues', existing.id),
      data: {
        voucherCost: report.voucherCost,
        successfulOrders: financial.successfulOrders,
        calculatedNetRevenue: financial.calculatedNetRevenue,
        updatedAt: serverTimestamp(),
      },
    });
    updated += 1;
  });

  if (operations.length) {
    await commitOperations(operations);
  }

  return { created, updated, skipped, total: created + updated };
};
