// src/pages/OperationalPage/NetRevenueSection.jsx

import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../../config/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import BulkImportModal from './BulkImportModal';
import AdSpendDistributionModal from './AdSpendDistributionModal';
import VoucherImportModal from './VoucherImportModal';
import { parseShopeeReportForBulk } from '../utils/fileParser';
import { parseVoucherReportForBulk } from '../utils/voucherParser';
import { importDailyRevenueReports } from '../utils/dailyRevenueImporter';
import { buildFinancialSnapshot } from '../services/financialCalculator';
import { importVoucherReports } from '../services/voucherImporter';
import { normalizeToLocalMidnight } from '../utils/dateUtils';

const NetRevenueSection = ({
  revenueReport,
  onRefreshRequest,
  onImportedRangeDetected,
}) => {
  // --- STATE UNTUK FORM INPUT ---
  const [reportDate, setReportDate] = useState(new Date());
  const [grossIncome, setGrossIncome] = useState('');
  const [totalOrders, setTotalOrders] = useState('');
  const [voucherCost, setVoucherCost] = useState('');
  const [canceledOrders, setCanceledOrders] = useState('');
  const [canceledValue, setCanceledValue] = useState('');
  const [returnedOrders, setReturnedOrders] = useState('');
  const [returnedValue, setReturnedValue] = useState('');
  const [adSpend, setAdSpend] = useState('');

  // --- STATE UNTUK MODAL EDIT ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  // --- STATE UNTUK NAMPUNG TAB INTERNAL & MASS INPUT ---
  const [activeInputTab, setActiveInputTab] = useState('penjualan');
  const [activeBiayaTab, setActiveBiayaTab] = useState('voucher');
  const [activeIklanMode, setActiveIklanMode] = useState('manual');
  const [stagedUpdates, setStagedUpdates] = useState([]);
  const [isAdDistributionModalOpen, setIsAdDistributionModalOpen] =
    useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [parsedBulkReports, setParsedBulkReports] = useState([]);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [isVoucherImportOpen, setIsVoucherImportOpen] = useState(false);
  const [parsedVoucherReports, setParsedVoucherReports] = useState([]);
  const [isVoucherImporting, setIsVoucherImporting] = useState(false);
  const shopeeFileInputRef = useRef(null);
  const voucherFileInputRef = useRef(null);

  useEffect(() => {
    const initialData = revenueReport.map((r) => ({
      ...r,
      voucherCost: r.voucherCost || 0,
      adSpend: r.adSpend || 0,
    }));
    setStagedUpdates(initialData);
  }, [revenueReport]);

  const handleOpenShopeeImport = () => {
    shopeeFileInputRef.current?.click();
  };

  const handleShopeeFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsedReports = parseShopeeReportForBulk(buffer);

      if (!parsedReports.length) {
        Swal.fire(
          'Tidak Ada Data Harian',
          'File terdeteksi tetapi tidak menemukan baris harian yang valid.',
          'warning'
        );
        return;
      }

      setParsedBulkReports(parsedReports);
      setIsBulkImportOpen(true);
    } catch (error) {
      console.error('Failed to parse Shopee report file:', error);
      Swal.fire('Error', 'Gagal membaca file Shopee.', 'error');
    }
  };

  const handleConfirmShopeeImport = async (reportsToImport) => {
    if (!reportsToImport?.length) {
      Swal.fire('Info', 'Tidak ada data valid untuk diimpor.', 'info');
      return;
    }

    setIsBulkImporting(true);
    try {
      const result = await importDailyRevenueReports(reportsToImport);
      const validDates = reportsToImport
        .map((item) => item?.date)
        .filter((d) => d instanceof Date && !Number.isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());

      const minDate = validDates[0] || null;
      const maxDate = validDates[validDates.length - 1] || null;

      Swal.fire(
        'Berhasil!',
        `Import selesai. Dibuat: ${result.created}, Diperbarui: ${result.updated}.`,
        'success'
      );
      setIsBulkImportOpen(false);
      setParsedBulkReports([]);
      if (minDate && maxDate && onImportedRangeDetected) {
        onImportedRangeDetected(minDate, maxDate);
      }
      onRefreshRequest();
    } catch (error) {
      console.error('Failed to import daily revenues:', error);
      Swal.fire('Error', 'Gagal mengimpor laporan harian.', 'error');
    } finally {
      setIsBulkImporting(false);
    }
  };

  const handleOpenVoucherImport = () => {
    voucherFileInputRef.current?.click();
  };

  const handleVoucherFileSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsedReports = parseVoucherReportForBulk(buffer);
      if (!parsedReports.length) {
        Swal.fire(
          'Tidak Ada Data Voucher',
          'File tidak berisi data voucher harian yang valid.',
          'warning'
        );
        return;
      }

      setParsedVoucherReports(parsedReports);
      setIsVoucherImportOpen(true);
    } catch (error) {
      console.error('Failed to parse voucher report file:', error);
      Swal.fire('Error', 'Gagal membaca file voucher.', 'error');
    }
  };

  const handleConfirmVoucherImport = async (reportsToImport = []) => {
    if (!reportsToImport?.length) {
      Swal.fire('Info', 'Tidak ada data voucher untuk diimpor.', 'info');
      return;
    }

    setIsVoucherImporting(true);
    try {
      const result = await importVoucherReports(reportsToImport);
      Swal.fire(
        'Berhasil!',
        `Import voucher selesai. Dibuat: ${result.created}, Diperbarui: ${result.updated}, Dilewati: ${result.skipped}.`,
        'success'
      );
      setIsVoucherImportOpen(false);
      setParsedVoucherReports([]);
      onRefreshRequest();
    } catch (error) {
      console.error('Failed to import voucher reports:', error);
      Swal.fire('Error', 'Gagal mengimpor laporan voucher.', 'error');
    } finally {
      setIsVoucherImporting(false);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const inputs = {
      grossIncome: parseFloat(grossIncome) || 0,
      totalOrders: parseInt(totalOrders) || 0,
      voucherCost: parseFloat(voucherCost) || 0,
      canceledOrders: parseInt(canceledOrders) || 0,
      canceledValue: parseFloat(canceledValue) || 0,
      returnedOrders: parseInt(returnedOrders) || 0,
      returnedValue: parseFloat(returnedValue) || 0,
      adSpend: parseFloat(adSpend) || 0,
    };
    if (inputs.grossIncome <= 0 || inputs.totalOrders <= 0) {
      Swal.fire(
        'Peringatan',
        'Pendapatan Kotor dan Total Pesanan wajib diisi.',
        'warning'
      );
      return;
    }
    const financial = buildFinancialSnapshot(inputs);
    const reportDateToSave = normalizeToLocalMidnight(reportDate);
    const basePayload = {
      date: reportDateToSave,
      year: reportDateToSave.getFullYear(),
      month: reportDateToSave.getMonth(),
      ...inputs,
      ...financial,
      adSpendSource: 'manual',
      voucherCost: inputs.voucherCost,
      adSpend: inputs.adSpend,
    };
    try {
      const q = query(
        collection(db, 'dailyRevenues'),
        where('date', '==', reportDateToSave)
      );
      const existing = await getDocs(q);
      if (!existing.empty) {
        const docId = existing.docs[0].id;
        const confirm = await Swal.fire({
          title: 'Data Sudah Ada',
          text: `Timpa data untuk tanggal ini?`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Ya, Timpa!',
        });
        if (confirm.isConfirmed) {
          await updateDoc(doc(db, 'dailyRevenues', docId), {
            ...basePayload,
            updatedAt: serverTimestamp(),
          });
          Swal.fire('Berhasil!', 'Laporan diperbarui.', 'success');
        }
      } else {
        await addDoc(collection(db, 'dailyRevenues'), {
          ...basePayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        Swal.fire('Berhasil!', 'Laporan disimpan.', 'success');
      }
      setGrossIncome('');
      setTotalOrders('');
      setVoucherCost('');
      setCanceledOrders('');
      setCanceledValue('');
      setReturnedOrders('');
      (setReturnedValue(''), setAdSpend(''));
      onRefreshRequest();
    } catch {
      Swal.fire('Error', 'Gagal menyimpan laporan.', 'error');
    }
  };

  const handleOpenEditModal = (report) => {
    setEditingReport(report);
    setIsEditModalOpen(true);
  };

  const handleUpdateReport = async (e) => {
    e.preventDefault();
    if (!editingReport) return;

    // 1. Ambil semua data dari state 'editingReport' untuk dihitung ulang
    const inputs = {
      grossIncome: parseFloat(editingReport.grossIncome) || 0,
      totalOrders: parseInt(editingReport.totalOrders) || 0,
      voucherCost: parseFloat(editingReport.voucherCost) || 0,
      canceledOrders: parseInt(editingReport.canceledOrders) || 0,
      canceledValue: parseFloat(editingReport.canceledValue) || 0,
      returnedOrders: parseInt(editingReport.returnedOrders) || 0,
      returnedValue: parseFloat(editingReport.returnedValue) || 0,
      adSpend: parseFloat(editingReport.adSpend) || 0,
    };

    const financial = buildFinancialSnapshot(inputs);

    const updatedData = {
      ...inputs,
      ...financial,
      adSpendSource: 'manual',
      updatedAt: serverTimestamp(),
    };

    try {
      const reportDocRef = doc(db, 'dailyRevenues', editingReport.id);
      await updateDoc(reportDocRef, updatedData);

      Swal.fire('Berhasil!', 'Laporan berhasil diperbarui.', 'success');
      setIsEditModalOpen(false);
      setEditingReport(null);
      onRefreshRequest();
    } catch (error) {
      console.error('Error updating report:', error);
      Swal.fire('Error', 'Gagal memperbarui laporan.', 'error');
    }
  };

  const handleDeleteReport = async (reportId, reportDate) => {
    const confirm = await Swal.fire({
      title: 'Anda Yakin?',
      text: `Hapus laporan untuk ${reportDate.toLocaleDateString('id-ID')}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
    });
    if (!confirm.isConfirmed) return;
    try {
      await deleteDoc(doc(db, 'dailyRevenues', reportId));
      Swal.fire('Terhapus!', 'Laporan harian dihapus.', 'success');
      onRefreshRequest();
    } catch {
      Swal.fire('Error!', 'Gagal menghapus laporan.', 'error');
    }
  };

  const handleStagedUpdateChange = (id, field, value) => {
    setStagedUpdates((prev) =>
      prev.map((report) =>
        report.id === id ? { ...report, [field]: value } : report
      )
    );
  };

  const handleBatchUpdate = async (scope) => {
    const scopeLabel =
      scope === 'voucher'
        ? 'Voucher'
        : scope === 'adSpend'
          ? 'Iklan'
          : 'Voucher & Iklan';
    const confirmation = await Swal.fire({
      title: 'Simpan Perubahan?',
      text: `Anda akan memperbarui data ${scopeLabel} untuk laporan yang ditampilkan.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan!',
      cancelButtonText: 'Batal',
    });
    if (!confirmation.isConfirmed) return;

    try {
      const MAX_BATCH_OPERATIONS = 450;
      const operations = [];
      let changesCount = 0;

      // Loop melalui data yang mungkin telah diubah di UI
      stagedUpdates.forEach((updatedReport) => {
        // Temukan data asli dari props untuk perbandingan
        const originalReport = revenueReport.find(
          (r) => r.id === updatedReport.id
        );

        // Konversi nilai input menjadi angka untuk perbandingan yang akurat
        const updatedVoucherCost = parseFloat(updatedReport.voucherCost) || 0;
        const updatedAdSpend = parseFloat(updatedReport.adSpend) || 0;
        const shouldCheckVoucher = scope === 'voucher' || scope === 'both';
        const shouldCheckAdSpend = scope === 'adSpend' || scope === 'both';
        const voucherChanged =
          shouldCheckVoucher &&
          originalReport.voucherCost !== updatedVoucherCost;
        const adSpendChanged =
          shouldCheckAdSpend && originalReport.adSpend !== updatedAdSpend;

        // Lanjutkan hanya jika ada perubahan pada voucher atau iklan
        if (originalReport && (voucherChanged || adSpendChanged)) {
          changesCount++;
          const reportDocRef = doc(db, 'dailyRevenues', updatedReport.id);

          // Ambil semua data lain dari state yang terupdate untuk dihitung ulang
          const inputs = {
            grossIncome: parseFloat(updatedReport.grossIncome) || 0,
            totalOrders: parseInt(updatedReport.totalOrders) || 0,
            canceledOrders: parseInt(updatedReport.canceledOrders) || 0,
            canceledValue: parseFloat(updatedReport.canceledValue) || 0,
            returnedOrders: parseInt(updatedReport.returnedOrders) || 0,
            returnedValue: parseFloat(updatedReport.returnedValue) || 0,
            voucherCost: shouldCheckVoucher
              ? updatedVoucherCost
              : parseFloat(originalReport.voucherCost) || 0,
            adSpend: shouldCheckAdSpend
              ? updatedAdSpend
              : parseFloat(originalReport.adSpend) || 0,
          };

          const financial = buildFinancialSnapshot(inputs);

          // Tambahkan operasi update ke batch
          const payload = {
            calculatedNetRevenue: financial.calculatedNetRevenue,
            successfulOrders: financial.successfulOrders,
            updatedAt: serverTimestamp(),
          };
          if (shouldCheckVoucher) payload.voucherCost = inputs.voucherCost;
          if (shouldCheckAdSpend) {
            payload.adSpend = inputs.adSpend;
            payload.adSpendSource = 'manual';
          }
          operations.push({ ref: reportDocRef, payload });
        }
      });

      if (changesCount === 0) {
        Swal.fire('Info', 'Tidak ada perubahan untuk disimpan.', 'info');
        return;
      }

      for (let i = 0; i < operations.length; i += MAX_BATCH_OPERATIONS) {
        const chunk = operations.slice(i, i + MAX_BATCH_OPERATIONS);
        const batch = writeBatch(db);
        chunk.forEach((operation) => {
          batch.update(operation.ref, operation.payload);
        });
        await batch.commit();
      }
      Swal.fire(
        'Berhasil!',
        `${changesCount} laporan telah diperbarui.`,
        'success'
      );
      onRefreshRequest();
    } catch (error) {
      console.error('Error batch updating reports:', error);
      Swal.fire('Error', 'Gagal menyimpan perubahan massal.', 'error');
    }
  };

  const totalRevenueDisplayed = revenueReport.reduce(
    (sum, report) => sum + (report.calculatedNetRevenue || 0),
    0
  );

  return (
    <section className="bg-white p-4 rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveInputTab('penjualan')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeInputTab === 'penjualan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            1. Input Penjualan
          </button>
          <button
            onClick={() => setActiveInputTab('biaya')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeInputTab === 'biaya' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            2. Input Biaya (Voucher & Iklan)
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {/* Tab 1: Input data penjualan */}
        {activeInputTab === 'penjualan' && (
          <form onSubmit={handleReportSubmit} className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                Input Rekap Penjualan Harian
              </h3>
              <div className="flex items-center gap-2">
                <input
                  ref={shopeeFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleShopeeFileSelected}
                />
                <button
                  type="button"
                  onClick={handleOpenShopeeImport}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
                >
                  Import Shopee XLSX
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Import otomatis membaca data harian dari sheet Pesanan Siap
              Dikirim.
            </p>
            <div>
              <label className="block text-sm">Tanggal Laporan</label>
              <DatePicker
                selected={reportDate}
                onChange={(date) => setReportDate(date)}
                dateFormat="dd MMMM yyyy"
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm">
                  Total Pendapatan Kotor (Rp)
                </label>
                <input
                  type="number"
                  value={grossIncome}
                  onChange={(e) => setGrossIncome(e.target.value)}
                  required
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm">Total Pesanan</label>
                <input
                  type="number"
                  value={totalOrders}
                  onChange={(e) => setTotalOrders(e.target.value)}
                  required
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="font-semibold text-yellow-800">
                Pembatalan & Pengembalian
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">Jml Pesanan Dibatalkan</label>
                <input
                  type="number"
                  value={canceledOrders}
                  onChange={(e) => setCanceledOrders(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm">Total Nilai Batal (Rp)</label>
                <input
                  type="number"
                  value={canceledValue}
                  onChange={(e) => setCanceledValue(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm">
                  Jml Pesanan Dikembalikan
                </label>
                <input
                  type="number"
                  value={returnedOrders}
                  onChange={(e) => setReturnedOrders(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm">
                  Total Nilai Kembali (Rp)
                </label>
                <input
                  type="number"
                  value={returnedValue}
                  onChange={(e) => setReturnedValue(e.target.value)}
                  className="mt-1 p-2 w-full border rounded-md"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700"
            >
              Simpan Laporan Harian
            </button>
          </form>
        )}

        {/* Tab 2: Biaya Iklan & Voucher*/}
        {activeInputTab === 'biaya' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Input Biaya untuk Periode yang Ditampilkan
            </h3>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4">
                <button
                  onClick={() => setActiveBiayaTab('voucher')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeBiayaTab === 'voucher' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Voucher
                </button>
                <button
                  onClick={() => setActiveBiayaTab('iklan')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeBiayaTab === 'iklan' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Iklan
                </button>
              </nav>
            </div>

            {activeBiayaTab === 'voucher' && (
              <>
                <div className="flex items-center justify-end">
                  <input
                    ref={voucherFileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleVoucherFileSelected}
                  />
                  <button
                    type="button"
                    onClick={handleOpenVoucherImport}
                    className="bg-emerald-600 text-white px-3 py-2 rounded-md hover:bg-emerald-700"
                  >
                    Import Voucher XLSX
                  </button>
                </div>
                <div className="overflow-x-auto border rounded-md">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tanggal
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Biaya Voucher (Rp)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stagedUpdates.length > 0 ? (
                        stagedUpdates.map((report) => (
                          <tr key={report.id}>
                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800">
                              {report.date.toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <input
                                type="number"
                                value={report.voucherCost || ''}
                                onChange={(e) =>
                                  handleStagedUpdateChange(
                                    report.id,
                                    'voucherCost',
                                    e.target.value
                                  )
                                }
                                className="w-full p-1 border rounded-md"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="2"
                            className="text-center py-4 text-gray-500"
                          >
                            Pilih rentang tanggal di atas untuk menampilkan
                            data.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {stagedUpdates.length > 0 && (
                  <button
                    onClick={() => handleBatchUpdate('voucher')}
                    className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Simpan Perubahan Voucher
                  </button>
                )}
              </>
            )}

            {activeBiayaTab === 'iklan' && (
              <div className="space-y-4">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-4">
                    <button
                      onClick={() => setActiveIklanMode('manual')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeIklanMode === 'manual' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      Manual Input
                    </button>
                    <button
                      onClick={() => setActiveIklanMode('automatic')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${activeIklanMode === 'automatic' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                    >
                      Automatic Distribution
                    </button>
                  </nav>
                </div>

                {activeIklanMode === 'manual' && (
                  <>
                    <div className="overflow-x-auto border rounded-md">
                      <table className="min-w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Tanggal
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              Biaya Iklan (Rp)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stagedUpdates.length > 0 ? (
                            stagedUpdates.map((report) => (
                              <tr key={report.id}>
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-800">
                                  {report.date.toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <input
                                    type="number"
                                    value={report.adSpend || ''}
                                    onChange={(e) =>
                                      handleStagedUpdateChange(
                                        report.id,
                                        'adSpend',
                                        e.target.value
                                      )
                                    }
                                    className="w-full p-1 border rounded-md"
                                    placeholder="0"
                                  />
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="2"
                                className="text-center py-4 text-gray-500"
                              >
                                Pilih rentang tanggal di atas untuk menampilkan
                                data.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {stagedUpdates.length > 0 && (
                      <button
                        onClick={() => handleBatchUpdate('adSpend')}
                        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700"
                      >
                        Simpan Perubahan Iklan
                      </button>
                    )}
                  </>
                )}

                {activeIklanMode === 'automatic' && (
                  <div className="p-4 border rounded-md bg-indigo-50">
                    <p className="text-sm text-indigo-900">
                      Distribusikan total biaya iklan ke beberapa hari secara
                      otomatis (equal atau revenue-weighted) dengan preview
                      sebelum disimpan.
                    </p>
                    <button
                      onClick={() => setIsAdDistributionModalOpen(true)}
                      className="mt-3 bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700"
                    >
                      Buka Ad Spend Distribution
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-700">
          Laporan Pemasukan
        </h3>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="font-semibold text-blue-800">
              Total Pemasukan Bersih Periode Ini:{' '}
              <span className="block text-2xl font-bold">
                Rp{' '}
                {totalRevenueDisplayed.toLocaleString('id-ID', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </p>
          </div>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Tanggal
                  </th>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Pendapatan Kotor
                  </th>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Pesanan Sukses
                  </th>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Biaya Voucher
                  </th>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Biaya Iklan
                  </th>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Pemasukan Bersih
                  </th>
                  <th className="px-4 py-2 text-left text-xs uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {revenueReport.length > 0 ? (
                  revenueReport.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">
                        {report.date.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        Rp {report.grossIncome.toLocaleString('id-ID')}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {report.successfulOrders}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        Rp{' '}
                        {(report.voucherCost || 0).toLocaleString('id-ID', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        Rp{' '}
                        {(report.adSpend || 0).toLocaleString('id-ID', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </td>
                      <td className="px-4 py-2 text-sm font-bold text-green-700">
                        Rp{' '}
                        {(report.calculatedNetRevenue || 0).toLocaleString(
                          'id-ID',
                          { minimumFractionDigits: 0, maximumFractionDigits: 0 }
                        )}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          onClick={() => handleOpenEditModal(report)}
                          className="text-blue-600 hover:text-blue-900 font-medium mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteReport(report.id, report.date)
                          }
                          className="text-red-600 hover:text-red-900 font-medium mr-2"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Tidak ada laporan pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* MODAL UNTUK EDIT LAPORAN */}
            {isEditModalOpen && editingReport && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                  <h3 className="text-lg font-bold mb-4">
                    Edit Laporan untuk{' '}
                    {editingReport.date.toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </h3>
                  <form onSubmit={handleUpdateReport} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="editGrossIncome"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Pendapatan Kotor
                        </label>
                        <input
                          type="number"
                          id="editGrossIncome"
                          value={editingReport.grossIncome || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              grossIncome: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="editTotalOrders"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Total Pesanan
                        </label>
                        <input
                          type="number"
                          id="editTotalOrders"
                          value={editingReport.totalOrders || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              totalOrders: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="editVoucherCost"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Voucher Penjual
                        </label>
                        <input
                          type="number"
                          id="editVoucherCost"
                          value={editingReport.voucherCost || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              voucherCost: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="editCanceledOrders"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Pesanan Dibatalkan
                        </label>
                        <input
                          type="number"
                          id="editCanceledOrders"
                          value={editingReport.canceledOrders || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              canceledOrders: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="editCanceledValue"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nilai Batal (Rp)
                        </label>
                        <input
                          type="number"
                          id="editCanceledValue"
                          value={editingReport.canceledValue || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              canceledValue: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="editReturnedOrders"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Pesanan Dikembalikan
                        </label>
                        <input
                          type="number"
                          id="editReturnedOrders"
                          value={editingReport.returnedOrders || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              returnedOrders: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="editReturnedValue"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Nilai Kembali (Rp)
                        </label>
                        <input
                          type="number"
                          id="editReturnedValue"
                          value={editingReport.returnedValue || ''}
                          onChange={(e) =>
                            setEditingReport({
                              ...editingReport,
                              returnedValue: e.target.value,
                            })
                          }
                          className="mt-1 p-2 w-full border rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="editAdSpend"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Biaya Iklan (Rp)
                      </label>
                      <input
                        type="number"
                        id="editAdSpend"
                        value={editingReport.adSpend || ''}
                        onChange={(e) =>
                          setEditingReport({
                            ...editingReport,
                            adSpend: e.target.value,
                          })
                        }
                        className="mt-1 p-2 w-full border rounded-md"
                      />
                    </div>

                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Simpan Perubahan
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => {
          if (isBulkImporting) return;
          setIsBulkImportOpen(false);
        }}
        reports={parsedBulkReports}
        onConfirmImport={handleConfirmShopeeImport}
        isImporting={isBulkImporting}
      />

      <VoucherImportModal
        isOpen={isVoucherImportOpen}
        onClose={() => {
          if (isVoucherImporting) return;
          setIsVoucherImportOpen(false);
        }}
        reports={parsedVoucherReports}
        onConfirmImport={handleConfirmVoucherImport}
        isImporting={isVoucherImporting}
      />

      <AdSpendDistributionModal
        isOpen={isAdDistributionModalOpen}
        onClose={() => setIsAdDistributionModalOpen(false)}
        onApplied={() => {
          setIsAdDistributionModalOpen(false);
          onRefreshRequest();
        }}
      />
    </section>
  );
};

export default NetRevenueSection;
