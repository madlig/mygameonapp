// src/pages/OperationalPage/AdminShiftSection.jsx

import { db } from '../../../config/firebaseConfig';
import { collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import Swal from 'sweetalert2';

const AdminShiftSection = ({
  shiftReport, onRefreshRequest,
  adminName, setAdminName, activeShift,
  handleStartShift, handleEndShift, getActiveShiftDuration,
  grossIncomeInput, setGrossIncomeInput, ordersCountInput, setOrdersCountInput
}) => {
  const adminList = ["Fariz", "Adli"];
  const totalGaji = shiftReport.reduce((sum, report) => sum + report.pay, 0);
  
  const handleDeleteRow = async (report) => {
    const confirmation = await Swal.fire({ title: 'Anda Yakin?', html: `Hapus semua shift untuk <b>${report.adminName}</b> pada <b>${report.date.toLocaleDateString('id-ID')}</b>?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus!' });
    if (!confirmation.isConfirmed) return;

    const startOfDay = new Date(report.date); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(report.date); endOfDay.setHours(23, 59, 59, 999);

    try {
        const q = query(collection(db, 'adminShifts'), where('adminName', '==', report.adminName), where('startTime', '>=', startOfDay), where('startTime', '<=', endOfDay));
        const snapshot = await getDocs(q);
        if (snapshot.empty) { Swal.fire('Info', 'Tidak ada data untuk dihapus.', 'info'); return; }
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        Swal.fire('Terhapus!', 'Data shift telah dihapus.', 'success');
        onRefreshRequest();
    } catch { Swal.fire('Error!', 'Gagal menghapus data.', 'error'); }
  };
  
  return (
    <section className="bg-white p-4 rounded-lg shadow space-y-6">
      <h2 className="text-xl font-semibold text-gray-700">Admin Shift Management</h2>
      {!activeShift ? (
        <>
            <div className="mb-4"><label className="block text-sm">Pilih Admin:</label><select value={adminName} onChange={e => setAdminName(e.target.value)} className="mt-1 p-2 w-full border rounded-md"><option value="">-- Pilih Admin --</option>{adminList.map(name => (<option key={name} value={name}>{name}</option>))}</select></div>
            <button onClick={handleStartShift} className="w-full bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50" disabled={!adminName.trim()}>Mulai Shift</button>
        </>
      ) : (
        <div className="bg-blue-50 p-4 rounded-md shadow-inner">
            <p className="text-lg font-semibold text-blue-800 mb-2">Shift Aktif:</p>
            <p>Admin: <span className="font-medium">{activeShift.adminName}</span></p>
            <p>Mulai: <span className="font-medium">{activeShift.startTime?.toLocaleTimeString('id-ID')}</span></p>
            <p className="mb-4">Durasi: <span className="font-medium">{getActiveShiftDuration()}</span></p>
            <div className="mb-4"><label className="block text-sm">Gross Income (Rp):</label><input type="number" value={grossIncomeInput} onChange={e => setGrossIncomeInput(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
            <div className="mb-4"><label className="block text-sm">Jumlah Pesanan:</label><input type="number" value={ordersCountInput} onChange={e => setOrdersCountInput(e.target.value)} className="mt-1 p-2 w-full border rounded-md" /></div>
            <button onClick={handleEndShift} className="w-full bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700">Selesaikan Segmen Shift</button>
        </div>
      )}
      
      <hr className="my-6"/>
      <h3 className="text-lg font-semibold text-gray-700">Laporan Gaji per Tanggal & Admin</h3>
      <div className="mt-6">
        {shiftReport.length === 0 ? ( <p>Tidak ada shift pada periode ini.</p> ) : 
        (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-50 rounded-lg"><p className="font-semibold text-indigo-800">Total Gaji Periode Ini: <span className="block text-2xl font-bold">Rp {totalGaji.toLocaleString('id-ID', {minimumFractionDigts:0, maximumFractionDigits:0})}</span></p></div>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50"><tr><th className="px-4 py-2 text-left text-xs uppercase">Tanggal</th><th className="px-4 py-2 text-left text-xs uppercase">Admin</th><th className="px-4 py-2 text-left text-xs uppercase">Total Durasi</th><th className="px-4 py-2 text-left text-xs uppercase">Total Pendapatan</th><th className="px-4 py-2 text-left text-xs uppercase">Total Pesanan</th><th className="px-4 py-2 text-left text-xs uppercase">Total Gaji</th><th className="px-4 py-2 text-left text-xs uppercase">Aksi</th></tr></thead>
                <tbody className="bg-white divide-y">
                  {shiftReport.map(report => (
                    <tr key={`${report.date.toISOString()}_${report.adminName}`} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm">{report.date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</td>
                      <td className="px-4 py-2 text-sm font-bold">{report.adminName}</td>
                      <td className="px-4 py-2 text-sm">{report.totalDurationHours.toFixed(2)} jam</td>
                      <td className="px-4 py-2 text-sm">Rp {report.totalGrossIncome.toLocaleString('id-ID')}</td>
                      <td className="px-4 py-2 text-sm">{report.totalOrders}</td>
                      <td className="px-4 py-2 text-sm font-bold text-purple-700">Rp {report.pay.toLocaleString('id-ID', {minimumFractionDigts:0, maximumFractionDigits:0})}</td>
                      <td className="px-4 py-2 text-sm"><button onClick={() => handleDeleteRow(report)} className="text-red-600 hover:text-red-900">Hapus</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminShiftSection;