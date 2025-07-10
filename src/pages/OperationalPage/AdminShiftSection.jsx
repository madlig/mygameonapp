// src/pages/OperationalPage/AdminShiftSection.jsx
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

const AdminShiftSection = ({
  adminName,
  setAdminName,
  activeShift,
  dailyAdminSummaries,
  grossIncomeInput,
  setGrossIncomeInput,
  ordersCountInput,
  setOrdersCountInput,
  handleStartShift,
  handleEndShift,
  getActiveShiftDuration,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- Poin 1: Daftar nama admin yang ditentukan ---
  const adminList = ["Fariz", "Adli"];

  useEffect(() => {
    let interval = null;
    if (activeShift) {
      interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeShift]);

  const summarizedAdmins = Object.values(dailyAdminSummaries);

  return (
    <section className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Admin Shift Management</h2>

      {!activeShift && (
        <div className="mb-4">
          <label htmlFor="adminName" className="block text-sm font-medium text-gray-700">
            Pilih Admin: {/* Ubah label */}
          </label>
          {/* Ganti input text dengan elemen select */}
          <select
            id="adminName"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Pilih Admin --</option> {/* Opsi default */}
            {adminList.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!activeShift ? (
        <button
          onClick={handleStartShift}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!adminName.trim()} // Tombol tetap disabled jika adminName kosong (belum ada pilihan)
        >
          Mulai Shift
        </button>
      ) : (
        <div className="bg-blue-50 p-4 rounded-md shadow-inner">
          <p className="text-lg font-semibold text-blue-800 mb-2">Shift Aktif:</p>
          <p className="text-blue-700">Admin: <span className="font-medium">{activeShift.adminName}</span></p>
          <p className="text-blue-700">Mulai: <span className="font-medium">{activeShift.startTime?.toLocaleTimeString('id-ID')}</span></p>
          <p className="text-blue-700 mb-4">Durasi: <span className="font-medium">{getActiveShiftDuration()}</span></p>

          <div className="mb-4">
            <label htmlFor="grossIncomeInput" className="block text-sm font-medium text-gray-700">
              Gross Income Selama Segmen Shift Ini (Rp):
            </label>
            <input
              type="number"
              id="grossIncomeInput"
              value={grossIncomeInput}
              onChange={(e) => setGrossIncomeInput(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 500000"
              min="0"
              step="any"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="ordersCountInput" className="block text-sm font-medium text-gray-700">
              Jumlah Pesanan Selama Segmen Shift Ini:
            </label>
            <input
              type="number"
              id="ordersCountInput"
              value={ordersCountInput}
              onChange={(e) => setOrdersCountInput(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 10"
              min="0"
            />
          </div>

          <button
            onClick={handleEndShift}
            className="w-full bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700"
          >
            Selesaikan Segmen Shift
          </button>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Ringkasan Shift Hari Ini (Per Admin)</h3>
        {summarizedAdmins.length === 0 ? (
          <p className="text-gray-500">Belum ada shift yang selesai hari ini.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {summarizedAdmins.map(adminSummary => (
              <li key={adminSummary.segments[0].adminName} className="py-2 text-gray-800">
                <p><span className="font-bold text-lg text-indigo-800">{adminSummary.segments[0].adminName}</span></p>
                <p className="text-sm text-gray-600">Total Durasi: {adminSummary.totalDurationHours?.toFixed(2)} jam</p>
                <p className="text-sm text-gray-600">Total Gross Income: Rp {adminSummary.totalGrossIncome?.toLocaleString('id-ID')}</p>
                <p className="text-sm text-gray-600">Total Pesanan: {adminSummary.totalOrders}</p>
                <p className="text-sm font-bold text-purple-700">Total Bayaran: Rp {adminSummary.totalPay?.toLocaleString('id-ID')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AdminShiftSection;