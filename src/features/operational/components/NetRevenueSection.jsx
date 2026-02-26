// src/pages/OperationalPage/NetRevenueSection.jsx

import React, { useEffect, useState } from 'react';
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

const NetRevenueSection = ({ revenueReport, onRefreshRequest }) => {
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
  const [stagedUpdates, setStagedUpdates] = useState([]);

  useEffect(() => {
    const initialData = revenueReport.map((r) => ({
      ...r,
      voucherCost: r.voucherCost || 0,
      adSpend: r.adSpend || 0,
    }));
    setStagedUpdates(initialData);
  }, [revenueReport]);

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
    const successfulOrders =
      inputs.totalOrders - inputs.canceledOrders - inputs.returnedOrders;
    const actualGrossIncome =
      inputs.grossIncome - inputs.canceledValue - inputs.returnedValue;
    const adminFeeBase = actualGrossIncome - inputs.voucherCost;
    const adminFee = adminFeeBase * 0.075;
    const fixedFee = successfulOrders * 1250;
    const netRevenue =
      actualGrossIncome -
      inputs.voucherCost -
      adminFee -
      fixedFee -
      inputs.adSpend;
    const reportDateToSave = new Date(reportDate);
    reportDateToSave.setHours(0, 0, 0, 0);
    const newReport = {
      date: reportDateToSave,
      ...inputs,
      successfulOrders,
      calculatedNetRevenue: netRevenue,
      month: reportDateToSave.getMonth(),
      year: reportDateToSave.getFullYear(),
      createdAt: serverTimestamp(),
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
            ...newReport,
            updatedAt: serverTimestamp(),
          });
          Swal.fire('Berhasil!', 'Laporan diperbarui.', 'success');
        }
      } else {
        await addDoc(collection(db, 'dailyRevenues'), newReport);
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

    // 2. Lakukan perhitungan ULANG, sama seperti saat submit
    const successfulOrders =
      inputs.totalOrders - inputs.canceledOrders - inputs.returnedOrders;
    const actualGrossIncome =
      inputs.grossIncome - inputs.canceledValue - inputs.returnedValue;
    const adminFeeBase = actualGrossIncome - inputs.voucherCost;
    const adminFee = adminFeeBase * 0.075;
    const fixedFee = successfulOrders * 1250;
    const netRevenue =
      actualGrossIncome -
      inputs.voucherCost -
      adminFee -
      fixedFee -
      inputs.adSpend;

    // 3. Siapkan data LENGKAP untuk di-update
    const updatedData = {
      ...inputs, // Simpan kembali semua nilai input yang mungkin diubah
      successfulOrders,
      calculatedNetRevenue: netRevenue,
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

  const handleBatchUpdate = async () => {
    const confirmation = await Swal.fire({
      title: 'Simpan Perubahan?',
      text: `Anda akan memperbarui data Voucher & Iklan untuk laporan yang ditampilkan.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Ya, Simpan!',
      cancelButtonText: 'Batal',
    });
    if (!confirmation.isConfirmed) return;

    try {
      const batch = writeBatch(db);
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

        // Lanjutkan hanya jika ada perubahan pada voucher atau iklan
        if (
          originalReport &&
          (originalReport.voucherCost !== updatedVoucherCost ||
            originalReport.adSpend !== updatedAdSpend)
        ) {
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
            voucherCost: updatedVoucherCost, // Gunakan nilai yang sudah divalidasi
            adSpend: updatedAdSpend, // Gunakan nilai yang sudah divalidasi
          };

          // Lakukan perhitungan ulang dengan data terbaru
          const successfulOrders =
            inputs.totalOrders - inputs.canceledOrders - inputs.returnedOrders;
          const actualGrossIncome =
            inputs.grossIncome - inputs.canceledValue - inputs.returnedValue;
          const adminFeeBase = actualGrossIncome - inputs.voucherCost;
          const adminFee = adminFeeBase * 0.075;
          const fixedFee = successfulOrders * 1250;
          const netRevenue =
            actualGrossIncome -
            inputs.voucherCost -
            adminFee -
            fixedFee -
            inputs.adSpend;

          // Tambahkan operasi update ke batch
          batch.update(reportDocRef, {
            voucherCost: inputs.voucherCost,
            adSpend: inputs.adSpend,
            calculatedNetRevenue: netRevenue,
            updatedAt: serverTimestamp(),
          });
        }
      });

      if (changesCount === 0) {
        Swal.fire('Info', 'Tidak ada perubahan untuk disimpan.', 'info');
        return;
      }

      await batch.commit();
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
            <h3 className="text-lg font-semibold text-gray-800">
              Input Rekap Penjualan Harian
            </h3>
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
                        colSpan="3"
                        className="text-center py-4 text-gray-500"
                      >
                        Pilih rentang tanggal di atas untuk menampilkan data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {stagedUpdates.length > 0 && (
              <button
                onClick={handleBatchUpdate}
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Simpan Semua Perubahan Biaya
              </button>
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
    </section>
  );
};

export default NetRevenueSection;
