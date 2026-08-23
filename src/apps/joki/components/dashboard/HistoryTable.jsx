import React from 'react';
import { useJoki } from '../../contexts/JokiContext';

const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
};

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const formatRupiah = (value) => {
  return "Rp" + Number(value).toLocaleString("id-ID");
};

const HistoryTable = () => {
  const { customers, streamerMode } = useJoki();

  if (streamerMode) return null;

  const finished = customers
    .filter(c => c.finished)
    .sort((a, b) => (b.finishedTime || 0) - (a.finishedTime || 0));

  return (
    <div className="mt-6">
      <div className="font-bold text-lg mb-3">📋 Riwayat Joki</div>
      <div className="bg-white border border-gray-300 overflow-x-auto">
        <table className="w-full border-collapse min-w-[1250px]">
          <thead>
            <tr>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">No</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Nama</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Layanan</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Durasi</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Harga</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Mulai</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Jam Selesai / Stop</th>
              <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {finished.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-11 text-center text-gray-500">Belum ada riwayat joki.</td>
              </tr>
            ) : (
              finished.map((customer, index) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{index + 1}</td>
                  <td className="border border-gray-300 p-2.5 text-left font-bold bg-white">{customer.name}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{customer.service}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{formatDuration(customer.duration)}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{formatRupiah(customer.price)}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{formatDateTime(customer.startTime)}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{formatDateTime(customer.finishedTime)}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
                      {customer.stopped ? 'STOPPED' : 'SELESAI'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryTable;
