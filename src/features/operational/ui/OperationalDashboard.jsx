import React, { useEffect, useMemo, useRef, useState } from 'react';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import Swal from 'sweetalert2';
import { db } from '../../../config/firebaseConfig';
import AllocationPreviewModal from '../components/AllocationPreviewModal';
import AdSpendDistributionModal from '../components/AdSpendDistributionModal';
import BulkImportModal from '../components/BulkImportModal';
import VoucherImportModal from '../components/VoucherImportModal';
import { buildFinancialSnapshot } from '../services/financialCalculator';
import { importDailyRevenueReports } from '../utils/dailyRevenueImporter';
import { parseShopeeReportForBulk } from '../utils/fileParser';
import { importVoucherReports } from '../services/voucherImporter';
import { parseVoucherReportForBulk } from '../utils/voucherParser';
import DataOperationsPanel from './DataOperationsPanel';
import DailyFinancialTable from './DailyFinancialTable';
import FinancialCharts from './FinancialCharts';
import OperationalSummaryCards from './OperationalSummaryCards';

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

const OperationalDashboard = ({
  revenueReport,
  recapData,
  onRefreshRequest,
  onImportedRangeDetected,
}) => {
  const [rows, setRows] = useState([]);
  const [editedRowIds, setEditedRowIds] = useState(new Set());
  const [sortDirection, setSortDirection] = useState('desc');

  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesPreviewRows, setSalesPreviewRows] = useState([]);
  const [isSalesImporting, setIsSalesImporting] = useState(false);

  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [voucherPreviewRows, setVoucherPreviewRows] = useState([]);
  const [isVoucherImporting, setIsVoucherImporting] = useState(false);

  const [isAdsModalOpen, setIsAdsModalOpen] = useState(false);
  const [isBulkPreviewOpen, setIsBulkPreviewOpen] = useState(false);

  const salesFileInputRef = useRef(null);
  const voucherFileInputRef = useRef(null);

  useEffect(() => {
    const initial = revenueReport.map((item) => ({
      ...item,
      voucherCost: toNumber(item.voucherCost),
      adSpend: toNumber(item.adSpend),
    }));
    setRows(initial);
    setEditedRowIds(new Set());
  }, [revenueReport]);

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    copy.sort((a, b) =>
      sortDirection === 'desc'
        ? b.date.getTime() - a.date.getTime()
        : a.date.getTime() - b.date.getTime()
    );
    return copy;
  }, [rows, sortDirection]);

  const summaryMetrics = useMemo(() => {
    const totalVoucherCost = rows.reduce(
      (sum, row) => sum + toNumber(row.voucherCost),
      0
    );
    return {
      ...recapData,
      totalVoucherCost,
    };
  }, [recapData, rows]);

  const handleCellChange = (id, field, value) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: toNumber(value) } : row
      )
    );
    setEditedRowIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const saveInlineEdits = async () => {
    const changedRows = rows.filter((row) => editedRowIds.has(row.id));
    if (!changedRows.length) {
      Swal.fire('Info', 'Tidak ada perubahan yang disimpan.', 'info');
      return;
    }

    try {
      const operations = [];

      changedRows.forEach((row) => {
        const original = revenueReport.find((item) => item.id === row.id);
        if (!original) return;

        const nextVoucher = toNumber(row.voucherCost);
        const nextAdSpend = toNumber(row.adSpend);
        const prevVoucher = toNumber(original.voucherCost);
        const prevAdSpend = toNumber(original.adSpend);
        if (nextVoucher === prevVoucher && nextAdSpend === prevAdSpend) return;

        const financial = buildFinancialSnapshot({
          grossIncome: toNumber(row.grossIncome),
          totalOrders: toNumber(row.totalOrders),
          canceledOrders: toNumber(row.canceledOrders),
          canceledValue: toNumber(row.canceledValue),
          returnedOrders: toNumber(row.returnedOrders),
          returnedValue: toNumber(row.returnedValue),
          voucherCost: nextVoucher,
          adSpend: nextAdSpend,
        });

        operations.push({
          ref: doc(db, 'dailyRevenues', row.id),
          payload: {
            voucherCost: nextVoucher,
            adSpend: nextAdSpend,
            adSpendSource: 'manual',
            successfulOrders: financial.successfulOrders,
            calculatedNetRevenue: financial.calculatedNetRevenue,
            updatedAt: serverTimestamp(),
          },
        });
      });

      if (!operations.length) {
        Swal.fire('Info', 'Tidak ada perubahan nilai untuk disimpan.', 'info');
        return;
      }

      const chunks = chunkArray(operations, MAX_BATCH_OPERATIONS);
      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((operation) =>
          batch.update(operation.ref, operation.payload)
        );
        await batch.commit();
      }

      Swal.fire(
        'Berhasil!',
        `${operations.length} baris diperbarui.`,
        'success'
      );
      setEditedRowIds(new Set());
      onRefreshRequest();
    } catch (error) {
      console.error('Failed to save inline edits:', error);
      Swal.fire('Error', 'Gagal menyimpan perubahan tabel.', 'error');
    }
  };

  const handleSalesFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseShopeeReportForBulk(buffer);
      if (!parsed.length) {
        Swal.fire('Warning', 'Data sales harian tidak ditemukan.', 'warning');
        return;
      }
      setSalesPreviewRows(parsed);
      setIsSalesModalOpen(true);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal membaca file sales.', 'error');
    }
  };

  const handleConfirmSalesImport = async (rowsToImport) => {
    if (!rowsToImport.length) return;
    setIsSalesImporting(true);
    try {
      const result = await importDailyRevenueReports(rowsToImport);
      const validDates = rowsToImport
        .map((item) => item.date)
        .sort((a, b) => a - b);
      if (validDates.length && onImportedRangeDetected) {
        onImportedRangeDetected(
          validDates[0],
          validDates[validDates.length - 1]
        );
      }
      Swal.fire(
        'Berhasil!',
        `Sales import selesai. Dibuat: ${result.created}, Diperbarui: ${result.updated}.`,
        'success'
      );
      setIsSalesModalOpen(false);
      setSalesPreviewRows([]);
      onRefreshRequest();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal import sales.', 'error');
    } finally {
      setIsSalesImporting(false);
    }
  };

  const handleVoucherFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseVoucherReportForBulk(buffer);
      if (!parsed.length) {
        Swal.fire('Warning', 'Data voucher harian tidak ditemukan.', 'warning');
        return;
      }
      setVoucherPreviewRows(parsed);
      setIsVoucherModalOpen(true);
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal membaca file voucher.', 'error');
    }
  };

  const handleConfirmVoucherImport = async (rowsToImport) => {
    if (!rowsToImport.length) return;
    setIsVoucherImporting(true);
    try {
      const result = await importVoucherReports(rowsToImport);
      Swal.fire(
        'Berhasil!',
        `Voucher import selesai. Dibuat: ${result.created}, Diperbarui: ${result.updated}.`,
        'success'
      );
      setIsVoucherModalOpen(false);
      setVoucherPreviewRows([]);
      onRefreshRequest();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Gagal import voucher.', 'error');
    } finally {
      setIsVoucherImporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <OperationalSummaryCards metrics={summaryMetrics} />
      <FinancialCharts revenueReport={rows} />
      <DailyFinancialTable
        rows={sortedRows}
        editedRowIds={editedRowIds}
        sortDirection={sortDirection}
        onSortToggle={() =>
          setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))
        }
        onCellChange={handleCellChange}
      />
      <DataOperationsPanel
        editedCount={editedRowIds.size}
        onImportSales={() => salesFileInputRef.current?.click()}
        onImportVoucher={() => voucherFileInputRef.current?.click()}
        onOpenAdsDistribution={() => setIsAdsModalOpen(true)}
        onOpenBulkEdit={() => setIsBulkPreviewOpen(true)}
        onSaveInlineEdits={saveInlineEdits}
      />

      <input
        ref={salesFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleSalesFileSelected}
      />
      <input
        ref={voucherFileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleVoucherFileSelected}
      />

      <BulkImportModal
        isOpen={isSalesModalOpen}
        onClose={() => {
          if (isSalesImporting) return;
          setIsSalesModalOpen(false);
        }}
        reports={salesPreviewRows}
        onConfirmImport={handleConfirmSalesImport}
        isImporting={isSalesImporting}
      />

      <VoucherImportModal
        isOpen={isVoucherModalOpen}
        onClose={() => {
          if (isVoucherImporting) return;
          setIsVoucherModalOpen(false);
        }}
        reports={voucherPreviewRows}
        onConfirmImport={handleConfirmVoucherImport}
        isImporting={isVoucherImporting}
      />

      <AdSpendDistributionModal
        isOpen={isAdsModalOpen}
        onClose={() => setIsAdsModalOpen(false)}
        onApplied={() => {
          setIsAdsModalOpen(false);
          onRefreshRequest();
        }}
      />

      <AllocationPreviewModal
        isOpen={isBulkPreviewOpen}
        onClose={() => setIsBulkPreviewOpen(false)}
        title="Pratinjau Bulk Edit"
        totalCost={rows.reduce(
          (sum, row) => sum + toNumber(row.voucherCost) + toNumber(row.adSpend),
          0
        )}
        allocationData={rows.map((row) => ({
          date: row.date,
          grossIncome: row.grossIncome,
          allocatedCost: toNumber(row.voucherCost) + toNumber(row.adSpend),
        }))}
        onConfirm={() => {
          setIsBulkPreviewOpen(false);
          saveInlineEdits();
        }}
      />
    </div>
  );
};

export default OperationalDashboard;
