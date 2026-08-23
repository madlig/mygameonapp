import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatClock = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
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

const ActiveTable = ({ onOpenExtendModal, onStopCustomer, onDeleteCustomer }) => {
  const { customers, updateJokiCustomer, searchQuery, filter } = useJoki();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemaining = (customer) => {
    if (customer.finished) return 0;
    if (customer.paused) return Math.max(0, customer.remainingAtPause || 0);
    return Math.max(0, Math.floor((customer.endTime - now) / 1000));
  };

  const getEndTime = (customer) => {
    if (customer.finished) return customer.finishedTime || customer.endTime;
    if (customer.paused) return customer.pauseStarted + (customer.remainingAtPause * 1000);
    return customer.endTime;
  };

  const handlePause = async (customer) => {
    await updateJokiCustomer(customer.id, {
      remainingAtPause: getRemaining(customer),
      pauseStarted: Date.now(),
      paused: true
    });
  };

  const handleResume = async (customer) => {
    const timeNow = Date.now();
    const pauseDuration = Math.max(0, Math.floor((timeNow - customer.pauseStarted) / 1000));
    await updateJokiCustomer(customer.id, {
      totalPausedSeconds: (customer.totalPausedSeconds || 0) + pauseDuration,
      endTime: timeNow + (customer.remainingAtPause * 1000),
      paused: false,
      pauseStarted: null,
      remainingAtPause: null
    });
  };

  const filteredCustomers = customers.filter(c => {
    if (c.finished) return false;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (filter === 'RUNNING') matchesFilter = !c.paused;
    if (filter === 'PAUSED') matchesFilter = c.paused;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white border border-gray-300 overflow-x-auto">
      <table className="w-full border-collapse min-w-[1250px]">
        <thead>
          <tr>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">No</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Nama</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Layanan</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Durasi</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Mulai</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Billing / Waktu Tersisa</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Jam Beres</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Status</th>
            <th className="bg-gray-200 border border-slate-300 p-3 text-center text-[13px] whitespace-nowrap">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.length === 0 ? (
            <tr>
              <td colSpan="9" className="p-11 text-center text-gray-500">Tidak ada billing aktif.</td>
            </tr>
          ) : (
            filteredCustomers.map((customer, index) => {
              const remaining = getRemaining(customer);
              const isWarning = !customer.paused && remaining <= 300; // <= 5 menit
              
              return (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{index + 1}</td>
                  <td className="border border-gray-300 p-2.5 text-left font-bold bg-white">{customer.name}</td>
                  <td className={`border border-gray-300 p-2.5 text-center font-bold bg-white ${customer.service === 'VIP' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {customer.service}
                  </td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{formatDuration(customer.duration)}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">{formatClock(customer.startTime)}</td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">
                    <span className={`font-mono text-[17px] font-bold ${customer.paused ? 'text-amber-600' : isWarning ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                      {formatTime(remaining)}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">
                    <span className="font-mono font-bold">{formatClock(getEndTime(customer))}</span>
                  </td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${customer.paused ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                      {customer.paused ? 'PAUSED' : 'RUNNING'}
                    </span>
                  </td>
                  <td className="border border-gray-300 p-2.5 text-center bg-white">
                    <div className="flex justify-center items-center gap-1 flex-wrap">
                      {customer.paused ? (
                        <button onClick={() => handleResume(customer)} className="bg-green-600 text-white border-none rounded px-2.5 py-1.5 font-bold cursor-pointer hover:opacity-85 text-sm">▶ Resume</button>
                      ) : (
                        <button onClick={() => handlePause(customer)} className="bg-amber-500 text-white border-none rounded px-2.5 py-1.5 font-bold cursor-pointer hover:opacity-85 text-sm">⏸ Pause</button>
                      )}
                      <button onClick={() => onOpenExtendModal(customer)} className="bg-blue-600 text-white border-none rounded px-2.5 py-1.5 font-bold cursor-pointer hover:opacity-85 text-sm">+ Waktu</button>
                      <button onClick={() => onStopCustomer(customer)} className="bg-red-900 text-white border-none rounded px-2.5 py-1.5 font-bold cursor-pointer hover:opacity-85 text-sm">■ Stop</button>
                      <button onClick={() => onDeleteCustomer(customer)} className="bg-red-500 text-white border-none rounded px-2.5 py-1.5 font-bold cursor-pointer hover:opacity-85 text-sm">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ActiveTable;
