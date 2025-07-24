// src/pages/OperationalPage/DailyRecapSection.jsx

import React from 'react';

const StatCard = ({ title, value, isCurrency = true, currency = 'Rp', extraInfo = null }) => (
  <div className="bg-white p-4 rounded-lg shadow">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-1 text-3xl font-semibold text-gray-900">
      {isCurrency ? `${currency} ${value.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : value}
    </p>
    {extraInfo && <p className="text-xs text-gray-400 mt-1">{extraInfo}</p>}
  </div>
);

const DailyRecapSection = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <p className="text-center text-gray-500">Pilih rentang tanggal untuk melihat rekap.</p>;
  }
  
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Ringkasan Finansial Utama</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Pendapatan Kotor" value={data.totalGrossRevenue || 0} />
          <StatCard title="Total Biaya Iklan" value={data.totalAdSpend || 0} />
          <StatCard title="Total Pemasukan Bersih" value={data.totalNetRevenue || 0} extraInfo="Setelah biaya Shopee, sebelum gaji & iklan" />
          <div className="bg-green-100 p-4 rounded-lg shadow border border-green-200">
             <p className="text-sm font-medium text-green-700">🏆 Laba Bersih (Profit)</p>
             <p className="mt-1 text-3xl font-bold text-green-800">
               Rp {(data.netProfit || 0).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
             </p>
             <p className="text-xs text-green-600 mt-1">Pemasukan Bersih - Gaji - Iklan</p>
          </div>
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Metrik Kinerja</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total Gaji Admin" value={data.totalAdminPay || 0} />
          <StatCard title="Rasio Gaji dari Pemasukan" value={`${(data.salaryPercentage || 0).toFixed(2)}%`} isCurrency={false} extraInfo="Semakin kecil semakin baik" />
          <StatCard title="Rata-rata Pemasukan / Pesanan" value={data.avgRevenuePerOrder || 0} isCurrency={true} extraInfo="Pemasukan Bersih / Pesanan Sukses" />
        </div>
      </div>
    </section>
  );
};

export default DailyRecapSection;