// src/pages/OperationalPage/NetRevenueSection.jsx

import React, { useState } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const NetRevenueSection = ({ revenueReport, onRefreshRequest }) => {
  const [reportDate, setReportDate] = useState(new Date());
  const [grossIncome, setGrossIncome] = useState('');
  const [totalOrders, setTotalOrders] = useState('');
  const [voucherCost, setVoucherCost] = useState('');
  const [canceledOrders, setCanceledOrders] = useState('');
  const [canceledValue, setCanceledValue] = useState('');
  const [returnedOrders, setReturnedOrders] = useState('');
  const [returnedValue, setReturnedValue] = useState('');

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    const inputs = { grossIncome: parseFloat(grossIncome) || 0, totalOrders: parseInt(totalOrders) || 0, voucherCost: parseFloat(voucherCost) || 0, canceledOrders: parseInt(canceledOrders) || 0, canceledValue: parseFloat(canceledValue) || 0, returnedOrders: parseInt(returnedOrders) || 0, returnedValue: parseFloat(returnedValue) || 0, };
    if (inputs.grossIncome <= 0 || inputs.totalOrders <= 0) { Swal.fire('Peringatan', 'Pendapatan Kotor dan Total Pesanan wajib diisi.', 'warning'); return; }
    const successfulOrders = inputs.totalOrders - inputs.canceledOrders - inputs.returnedOrders;
    const actualGrossIncome = inputs.grossIncome - inputs.canceledValue - inputs.returnedValue;
    const adminFeeBase = actualGrossIncome - inputs.voucherCost;
    const adminFee = adminFeeBase * 0.075;
    const fixedFee = successfulOrders * 1250;
    const netRevenue = actualGrossIncome - inputs.voucherCost - adminFee - fixedFee;
    const reportDateToSave = new Date(reportDate); reportDateToSave.setHours(0, 0, 0, 0);
    const newReport = { date: reportDateToSave, ...inputs, successfulOrders, calculatedNetRevenue: netRevenue, month: reportDateToSave.getMonth(), year: reportDateToSave.getFullYear(), createdAt: serverTimestamp() };
    try {
        const q = query(collection(db, 'dailyRevenues'), where('date', '==', reportDateToSave));
        const existing = await getDocs(q);
        if (!existing.empty) {
            const docId = existing.docs[0].id;
            const confirm = await Swal.fire({ title: 'Data Sudah Ada', text: `Timpa data untuk tanggal ini?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya, Timpa!' });
            if (confirm.isConfirmed) { await updateDoc(doc(db, 'dailyRevenues', docId), { ...newReport, updatedAt: serverTimestamp() }); Swal.fire('Berhasil!', 'Laporan diperbarui.', 'success'); }
        } else { await addDoc(collection(db, 'dailyRevenues'), newReport); Swal.fire('Berhasil!', 'Laporan disimpan.', 'success'); }
        setGrossIncome(''); setTotalOrders(''); setVoucherCost(''); setCanceledOrders(''); setCanceledValue(''); setReturnedOrders(''); setReturnedValue('');
        onRefreshRequest();
    } catch (error) { Swal.fire('Error', 'Gagal menyimpan laporan.', 'error'); }
  };
  
  const handleDeleteReport = async (reportId, reportDate) => {
    const confirm = await Swal.fire({ title: 'Anda Yakin?', text: `Hapus laporan untuk ${reportDate.toLocaleDateString('id-ID')}?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!' });
    if (!confirm.isConfirmed) return;
    try {
        await deleteDoc(doc(db, 'dailyRevenues', reportId));
        Swal.fire('Terhapus!', 'Laporan harian dihapus.', 'success');
        onRefreshRequest();
    } catch (error) { Swal.fire('Error!', 'Gagal menghapus laporan.', 'error'); }
  };
  
  const totalRevenueDisplayed = revenueReport.reduce((sum, report) => sum + (report.calculatedNetRevenue || 0), 0);

  return (
    <section className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Input Rekap Pemasukan Harian</h2>
      <form onSubmit={handleReportSubmit} className="space-y-4">
        <div><label className="block text-sm">Tanggal Laporan</label><DatePicker selected={reportDate} onChange={date => setReportDate(date)} dateFormat="dd MMMM yyyy" className="mt-1 p-2 w-full border rounded-md" /></div>
        <div className="grid md:grid-cols-3 gap-4">
          <div><label className="block text-sm">Total Pendapatan Kotor (Rp)</label><input type="number" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} required className="mt-1 p-2 w-full border rounded-md" /></div>
          <div><label className="block text-sm">Total Pesanan</label><input type="number" value={totalOrders} onChange={e => setTotalOrders(e.target.value)} required className="mt-1 p-2 w-full border rounded-md" /></div>
          <div><label className="block text-sm">Total Voucher Penjual (Rp)</label><input type="number" value={voucherCost} onChange={e => setVoucherCost(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
        </div>
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400"><p className="font-semibold text-yellow-800">Pembatalan & Pengembalian</p></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm">Jml Pesanan Dibatalkan</label><input type="number" value={canceledOrders} onChange={e => setCanceledOrders(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
          <div><label className="block text-sm">Total Nilai Batal (Rp)</label><input type="number" value={canceledValue} onChange={e => setCanceledValue(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="block text-sm">Jml Pesanan Dikembalikan</label><input type="number" value={returnedOrders} onChange={e => setReturnedOrders(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
          <div><label className="block text-sm">Total Nilai Kembali (Rp)</label><input type="number" value={returnedValue} onChange={e => setReturnedValue(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
        </div>
        <button type="submit" className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700">Simpan Laporan Harian</button>
      </form>
      <div className="mt-6 pt-4 border-t">
        <h3 className="text-lg font-semibold text-gray-700">Laporan Pemasukan</h3>
        <div className="space-y-4 mt-4">
          <div className="p-4 bg-blue-50 rounded-lg"><p className="font-semibold text-blue-800">Total Pemasukan Bersih Periode Ini: <span className="block text-2xl font-bold">Rp {totalRevenueDisplayed.toLocaleString('id-ID')}</span></p></div>
          <div className="overflow-x-auto border rounded-md">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs uppercase">Tanggal</th><th className="px-4 py-2 text-left text-xs uppercase">Pendapatan Kotor</th><th className="px-4 py-2 text-left text-xs uppercase">Pesanan Sukses</th><th className="px-4 py-2 text-left text-xs uppercase">Pemasukan Bersih</th><th className="px-4 py-2 text-left text-xs uppercase">Aksi</th></tr></thead>
              <tbody className="bg-white divide-y">
                {revenueReport.length > 0 ? revenueReport.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">{report.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long' })}</td>
                    <td className="px-4 py-2 text-sm">Rp {report.grossIncome.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-2 text-sm">{report.successfulOrders}</td>
                    <td className="px-4 py-2 text-sm font-bold text-green-700">Rp {(report.calculatedNetRevenue || 0).toLocaleString('id-ID')}</td>
                    <td className="px-4 py-2 text-sm"><button onClick={() => handleDeleteReport(report.id, report.date)} className="text-red-600 hover:text-red-900">Hapus</button></td>
                  </tr>
                )) : ( <tr><td colSpan="5" className="text-center py-4">Tidak ada laporan pada periode ini.</td></tr> )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NetRevenueSection;