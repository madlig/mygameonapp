import React, { useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import Modal from '../../../components/common/Modal';
import { db } from '../../../config/firebaseConfig';
import { buildFinancialSnapshot } from '../services/financialCalculator';
import {
  normalizeToLocalMidnight,
  parseYmdToLocalDate,
  toLocalEndOfDay,
  toLocalStartOfDay,
} from '../utils/dateUtils';

const MAX_BATCH_OPERATIONS = 450;

const toInputDateValue = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatDate = (date) =>
  date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const distributeEqual = (rows, total) => {
  const raw = rows.map(() => total / rows.length);
  return raw.map((value) => Math.round(value));
};

const distributeRevenueWeighted = (rows, total) => {
  const totalGross = rows.reduce(
    (sum, row) => sum + toNumber(row.grossIncome),
    0
  );
  if (totalGross <= 0) {
    return distributeEqual(rows, total);
  }
  return rows.map((row) => {
    const weight = toNumber(row.grossIncome) / totalGross;
    return Math.round(weight * total);
  });
};

const applyRoundingBalance = (values, total) => {
  if (!values.length) return values;
  const currentSum = values.reduce((sum, value) => sum + value, 0);
  const diff = total - currentSum;
  const balanced = [...values];
  balanced[balanced.length - 1] += diff;
  return balanced;
};

const buildAllocations = (rows, totalAdSpend, mode) => {
  const roundedTotal = Math.round(totalAdSpend);
  const rounded =
    mode === 'revenueWeighted'
      ? distributeRevenueWeighted(rows, roundedTotal)
      : distributeEqual(rows, roundedTotal);
  const balanced = applyRoundingBalance(rounded, roundedTotal);
  return rows.reduce((acc, row, index) => {
    acc[row.id] = balanced[index];
    return acc;
  }, {});
};

const AdSpendDistributionModal = ({ isOpen, onClose, onApplied }) => {
  const now = new Date();
  const [startDate, setStartDate] = useState(toInputDateValue(now));
  const [endDate, setEndDate] = useState(toInputDateValue(now));
  const [totalAdSpend, setTotalAdSpend] = useState('');
  const [distributionMode, setDistributionMode] = useState('equal');
  const [previewRows, setPreviewRows] = useState([]);
  const [step, setStep] = useState('form');
  const [isProcessing, setIsProcessing] = useState(false);
  const [metadata, setMetadata] = useState(null);

  const summary = useMemo(() => {
    const rowsToUpdate = previewRows.filter((row) => row.willUpdate);
    const totalCalculated = rowsToUpdate.reduce(
      (sum, row) => sum + toNumber(row.calculatedAdSpend),
      0
    );
    return { toUpdate: rowsToUpdate.length, totalCalculated };
  }, [previewRows]);

  if (!isOpen) return null;

  const handleGeneratePreview = async () => {
    const localStart = parseYmdToLocalDate(startDate);
    const localEnd = parseYmdToLocalDate(endDate);
    if (!localStart || !localEnd) {
      Swal.fire(
        'Peringatan',
        'Start date dan end date wajib valid.',
        'warning'
      );
      return;
    }

    const parsedTotalAdSpend = toNumber(totalAdSpend);
    if (!Number.isFinite(parsedTotalAdSpend) || parsedTotalAdSpend <= 0) {
      Swal.fire('Peringatan', 'Total ad spend harus lebih dari 0.', 'warning');
      return;
    }

    const rangeStart = toLocalStartOfDay(localStart);
    const rangeEnd = toLocalEndOfDay(localEnd);
    if (rangeStart > rangeEnd) {
      Swal.fire(
        'Peringatan',
        'Start date tidak boleh melebihi end date.',
        'warning'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const q = query(
        collection(db, 'dailyRevenues'),
        where('date', '>=', rangeStart),
        where('date', '<=', rangeEnd),
        orderBy('date', 'asc')
      );
      const snapshot = await getDocs(q);
      const rows = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          ...data,
          date: normalizeToLocalMidnight(
            data.date?.toDate ? data.date.toDate() : data.date
          ),
          adSpend: toNumber(data.adSpend),
          grossIncome: toNumber(data.grossIncome),
          voucherCost: toNumber(data.voucherCost),
          totalOrders: toNumber(data.totalOrders),
          canceledOrders: toNumber(data.canceledOrders),
          canceledValue: toNumber(data.canceledValue),
          returnedOrders: toNumber(data.returnedOrders),
          returnedValue: toNumber(data.returnedValue),
        };
      });

      if (!rows.length) {
        Swal.fire(
          'Info',
          'Tidak ada data harian pada rentang tanggal ini.',
          'info'
        );
        return;
      }

      const conflictRows = rows.filter((row) => row.adSpend > 0);
      let conflictPolicy = 'overwrite';
      if (conflictRows.length > 0) {
        const decision = await Swal.fire({
          title: 'Ad Spend Sudah Ada',
          text: `${conflictRows.length} hari sudah memiliki adSpend. Pilih aksi:`,
          icon: 'warning',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: 'Overwrite',
          denyButtonText: 'Keep Existing',
          cancelButtonText: 'Cancel',
        });

        if (decision.isDismissed) return;
        conflictPolicy = decision.isDenied ? 'keepExisting' : 'overwrite';
      }

      const targetRows =
        conflictPolicy === 'keepExisting'
          ? rows.filter((row) => row.adSpend === 0)
          : rows;

      if (!targetRows.length) {
        Swal.fire('Info', 'Tidak ada baris yang perlu diperbarui.', 'info');
        return;
      }

      const allocations = buildAllocations(
        targetRows,
        parsedTotalAdSpend,
        distributionMode
      );

      const preview = rows.map((row) => {
        const hasAllocation = allocations[row.id] !== undefined;
        const nextAdSpend = hasAllocation ? allocations[row.id] : row.adSpend;
        return {
          ...row,
          calculatedAdSpend: nextAdSpend,
          willUpdate: hasAllocation && nextAdSpend !== row.adSpend,
        };
      });

      setMetadata({
        startDate: rangeStart,
        endDate: rangeEnd,
        totalAdSpend: Math.round(parsedTotalAdSpend),
        distributionMode,
      });
      setPreviewRows(preview);
      setStep('preview');
    } catch (error) {
      console.error('Failed generating ad spend preview:', error);
      Swal.fire('Error', 'Gagal membuat preview distribusi iklan.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyDistribution = async () => {
    if (!previewRows.length) return;
    const rowsToUpdate = previewRows.filter((row) => row.willUpdate);
    if (!rowsToUpdate.length) {
      Swal.fire('Info', 'Tidak ada perubahan untuk disimpan.', 'info');
      return;
    }

    setIsProcessing(true);
    try {
      const operations = rowsToUpdate.map((row) => {
        const nextAdSpend = toNumber(row.calculatedAdSpend);
        const financial = buildFinancialSnapshot({
          grossIncome: row.grossIncome,
          canceledValue: row.canceledValue,
          returnedValue: row.returnedValue,
          totalOrders: row.totalOrders,
          canceledOrders: row.canceledOrders,
          returnedOrders: row.returnedOrders,
          voucherCost: row.voucherCost,
          adSpend: nextAdSpend,
        });

        return {
          ref: doc(db, 'dailyRevenues', row.id),
          data: {
            adSpend: nextAdSpend,
            adSpendSource: 'distributed',
            calculatedNetRevenue: financial.calculatedNetRevenue,
            successfulOrders: financial.successfulOrders,
            updatedAt: serverTimestamp(),
          },
        };
      });

      const chunks = chunkArray(operations, MAX_BATCH_OPERATIONS);
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((operation) => {
          batch.update(operation.ref, operation.data);
        });
        await batch.commit();
      }

      await addDoc(collection(db, 'adSpendDistributions'), {
        startDate:
          metadata?.startDate ||
          toLocalStartOfDay(parseYmdToLocalDate(startDate)),
        endDate:
          metadata?.endDate || toLocalEndOfDay(parseYmdToLocalDate(endDate)),
        totalAdSpend:
          metadata?.totalAdSpend || Math.round(toNumber(totalAdSpend)),
        distributionMode: metadata?.distributionMode || distributionMode,
        affectedDays: rowsToUpdate.length,
        createdAt: serverTimestamp(),
      });

      Swal.fire(
        'Berhasil!',
        `${rowsToUpdate.length} laporan diperbarui.`,
        'success'
      );
      setPreviewRows([]);
      setStep('form');
      setTotalAdSpend('');
      setMetadata(null);
      onApplied && onApplied();
    } catch (error) {
      console.error('Failed applying ad spend distribution:', error);
      Swal.fire('Error', 'Gagal menyimpan distribusi iklan.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (isProcessing) return;
    setStep('form');
    setPreviewRows([]);
    setMetadata(null);
    onClose && onClose();
  };

  return (
    <Modal onClose={handleClose} ariaLabel="Ad Spend Distribution">
      <div className="p-6 w-full max-w-4xl">
        <h2 className="text-xl font-bold text-gray-800">
          Ad Spend Distribution
        </h2>

        {step === 'form' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 p-2 border rounded-md w-full"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Ad Spend
              </label>
              <input
                type="number"
                value={totalAdSpend}
                onChange={(e) => setTotalAdSpend(e.target.value)}
                className="mt-1 p-2 border rounded-md w-full"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Distribution Mode
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="distributionMode"
                    value="equal"
                    checked={distributionMode === 'equal'}
                    onChange={(e) => setDistributionMode(e.target.value)}
                  />
                  equal
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="distributionMode"
                    value="revenueWeighted"
                    checked={distributionMode === 'revenueWeighted'}
                    onChange={(e) => setDistributionMode(e.target.value)}
                  />
                  revenueWeighted
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 rounded-md"
                disabled={isProcessing}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? 'Memproses...' : 'Preview Distribusi'}
              </button>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-600">
              <p>
                Hari yang akan diupdate: <strong>{summary.toUpdate}</strong>
              </p>
              <p>
                Total ad spend hasil update:{' '}
                <strong>
                  Rp {summary.totalCalculated.toLocaleString('id-ID')}
                </strong>
              </p>
            </div>

            <div className="overflow-x-auto border rounded-md max-h-[50vh]">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Gross Income
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Calculated Ad Spend
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewRows.map((row) => (
                    <tr
                      key={row.id}
                      className={row.willUpdate ? '' : 'opacity-60'}
                    >
                      <td className="px-3 py-2 text-sm">
                        {formatDate(row.date)}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        Rp {toNumber(row.grossIncome).toLocaleString('id-ID')}
                      </td>
                      <td className="px-3 py-2 text-sm font-semibold">
                        Rp{' '}
                        {toNumber(row.calculatedAdSpend).toLocaleString(
                          'id-ID'
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {row.willUpdate ? 'will update' : 'keep existing'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2 bg-gray-200 rounded-md"
                disabled={isProcessing}
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleApplyDistribution}
                className="px-4 py-2 bg-green-600 text-white rounded-md disabled:opacity-50"
                disabled={isProcessing}
              >
                {isProcessing ? 'Menyimpan...' : 'Simpan Distribusi'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AdSpendDistributionModal;
