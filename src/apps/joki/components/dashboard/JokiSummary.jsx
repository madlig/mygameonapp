import React from 'react';
import { useJoki } from '../../contexts/JokiContext';

const JokiSummary = () => {
  const { customers, streamerMode } = useJoki();

  if (streamerMode) return null;

  const active = customers.filter(c => !c.finished);
  const running = active.filter(c => !c.paused);
  const paused = active.filter(c => c.paused);
  const finished = customers.filter(c => c.finished);
  const revenue = customers.reduce((total, customer) => total + Number(customer.price || 0), 0);

  const formatRupiah = (value) => {
    return "Rp" + Number(value).toLocaleString("id-ID");
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 my-4">
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="text-[13px] text-gray-500">Total Joki Aktif</div>
        <div className="mt-1 text-2xl font-bold">{active.length}</div>
      </div>
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="text-[13px] text-gray-500">Running</div>
        <div className="mt-1 text-2xl font-bold">{running.length}</div>
      </div>
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="text-[13px] text-gray-500">Paused</div>
        <div className="mt-1 text-2xl font-bold">{paused.length}</div>
      </div>
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="text-[13px] text-gray-500">Selesai / Stop</div>
        <div className="mt-1 text-2xl font-bold">{finished.length}</div>
      </div>
      <div className="bg-white border border-gray-300 rounded-lg p-4 col-span-2 md:col-span-1">
        <div className="text-[13px] text-gray-500">Omset</div>
        <div className="mt-1 text-2xl font-bold">{formatRupiah(revenue)}</div>
      </div>
    </div>
  );
};

export default JokiSummary;
