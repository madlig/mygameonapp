// src/pages/OperationalPage/AdminShiftSection.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';

const AdminShiftSection = ({
  shiftReport, onRefreshRequest,
  adminName, setAdminName, activeShift,
  handleStartShift, handleEndShift, getActiveShiftDuration,
}) => {
  const [localAdmin, setLocalAdmin] = useState(adminName || "");
  const adminList = ["Fariz", "Adli"];

  const totalGaji = shiftReport.reduce((sum, report) => sum + (report.pay || 0), 0);

  return (
    <section className="space-y-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Admin Shift Management</h2>

        {/* Responsive form: single column mobile, inline on md */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-sm text-gray-600">Pilih Admin:</label>
            <select value={localAdmin} onChange={(e) => { setLocalAdmin(e.target.value); setAdminName(e.target.value); }} className="mt-1 p-2 w-full border rounded-md">
              <option value="">-- Pilih Admin --</option>
              {adminList.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <div>
            <button onClick={handleStartShift} className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Mulai Shift</button>
          </div>

          <div>
            <button onClick={handleEndShift} className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" disabled={!activeShift}>Selesaikan Shift</button>
          </div>
        </div>

        {/* Active shift info (if present) */}
        {activeShift && (
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <p className="text-sm">Shift Aktif: <span className="font-medium">{activeShift.adminName}</span></p>
            <p className="text-sm">Mulai: <span className="font-medium">{activeShift.startTime?.toLocaleTimeString?.() || ''}</span></p>
            <p className="text-sm">Durasi: <span className="font-medium">{getActiveShiftDuration()}</span></p>
          </div>
        )}
      </div>

      {/* Summary card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold text-gray-700 mb-2">Laporan Gaji per Tanggal & Admin</h3>
        <div className="bg-indigo-50 p-4 rounded mb-4">
          <div className="text-sm text-indigo-700">Total Gaji Periode Ini:</div>
          <div className="text-2xl font-bold text-indigo-900">Rp {totalGaji.toLocaleString('id-ID')}</div>
        </div>

        {/* Table responsive */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase">Tanggal</th>
                <th className="px-3 py-2 text-left text-xs uppercase">Admin</th>
                <th className="px-3 py-2 text-left text-xs uppercase">Total Durasi</th>
                <th className="px-3 py-2 text-left text-xs uppercase">Total Pendapatan</th>
                <th className="px-3 py-2 text-left text-xs uppercase">Total Pesanan</th>
                <th className="px-3 py-2 text-left text-xs uppercase">Total Gaji</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {shiftReport.length === 0 ? (
                <tr><td colSpan="6" className="text-center p-4 text-gray-500">Tidak ada data shift.</td></tr>
              ) : shiftReport.map((report, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">{report.date?.toLocaleDateString?.('id-ID', { day: 'numeric', month: 'long' })}</td>
                  <td className="px-3 py-2 text-sm font-medium">{report.adminName}</td>
                  <td className="px-3 py-2 text-sm">{report.totalDurationHours?.toFixed(2)} jam</td>
                  <td className="px-3 py-2 text-sm">Rp {report.totalGrossIncome?.toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2 text-sm">{report.totalOrders || 0}</td>
                  <td className="px-3 py-2 text-sm font-bold text-purple-700">Rp {report.pay?.toLocaleString('id-ID')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default AdminShiftSection;