// src/pages/OperationalPage/DailyRecapSection.jsx
import React from 'react';

const StatCard = ({ title, value, isCurrency = true, currency = 'Rp', extraInfo = null }) => (
  <div className="bg-white p-4 rounded-lg shadow flex flex-col justify-between">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-3 text-2xl font-bold text-gray-900">
      {isCurrency ? `${currency} ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : value}
    </p>
    {extraInfo && <p className="text-xs text-gray-400 mt-2">{extraInfo}</p>}
  </div>
);

const DailyRecapSection = ({ data = {} }) => {
  const {
    totalGrossRevenue = 0,
    totalAdSpend = 0,
    totalNetRevenue = 0,
    netProfit = 0,
  } = data;

  return (
    <section className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-700">Ringkasan Finansial Utama</h2>

      {/* Grid responsif: 1 kolom mobile, 2 pada md, 4 pada lg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pendapatan Kotor" value={totalGrossRevenue} />
        <StatCard title="Total Biaya Iklan" value={totalAdSpend} />
        <StatCard title="Total Pemasukan Bersih" value={totalNetRevenue} extraInfo="Setelah biaya Shopee & iklan, sebelum gaji" />
        <div className="bg-green-50 p-4 rounded-lg shadow flex flex-col justify-between">
          <p className="text-sm font-medium text-green-700">🏆 Laba Bersih (Profit)</p>
          <p className="mt-3 text-2xl font-bold text-green-800">{`Rp ${netProfit.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</p>
          <p className="text-xs text-green-600 mt-2">Pemasukan Bersih - Gaji Admin</p>
        </div>
      </div>

      {/* Optional: show compact metrics on mobile */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-md font-semibold text-gray-700 mb-3">Detail Tambahan</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="text-sm text-gray-600">
            <div className="text-xs text-gray-500">Total Orders (sample)</div>
            <div className="font-medium">—</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="text-xs text-gray-500">Avg Revenue / Order</div>
            <div className="font-medium">—</div>
          </div>
          <div className="text-sm text-gray-600">
            <div className="text-xs text-gray-500">Salary Ratio</div>
            <div className="font-medium">{data.salaryPercentage ? `${data.salaryPercentage.toFixed(1)}%` : '—'}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyRecapSection;