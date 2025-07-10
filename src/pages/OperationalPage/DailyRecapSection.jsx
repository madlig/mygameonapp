// src/pages/OperationalPage/DailyRecapSection.jsx
import React from 'react';

const DailyRecapSection = ({ dailyRecap }) => {
  return (
    <section className="bg-white p-4 rounded-lg shadow mt-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Rekap Harian Hari Ini</h2>
      <p className="text-gray-800 mb-2">Total Gross Income (Semua Shift): <span className="font-bold text-indigo-700">Rp {dailyRecap.totalGrossIncomeToday.toLocaleString('id-ID')}</span></p>
      <p className="text-gray-800 mb-2">Total Bayaran Admin (Semua Shift): <span className="font-bold text-green-700">Rp {dailyRecap.totalAdminPayToday.toLocaleString('id-ID')}</span></p>
      <p className="text-gray-800 mb-2">Pemasukan Bersih Tercatat: <span className="font-bold text-blue-700">Rp {dailyRecap.netRevenueToday.toLocaleString('id-ID')}</span></p>
      <p className="text-gray-800">Net Profit Harian (Pemasukan Bersih - Bayaran Admin): <span className="font-bold text-red-700">Rp {dailyRecap.netProfitToday.toLocaleString('id-ID')}</span></p>
    </section>
  );
};

export default DailyRecapSection;