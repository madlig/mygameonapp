import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';

const JokiHeader = ({ onOpenAddModal, onClearTransactions }) => {
  const { 
    globalPaused, 
    updateJokiSettings, 
    customers, 
    updateJokiCustomer, 
    streamerMode, 
    toggleStreamerMode 
  } = useJoki();
  
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemaining = (customer) => {
    if (customer.finished) return 0;
    if (customer.paused) return Math.max(0, customer.remainingAtPause || 0);
    return Math.max(0, Math.floor((customer.endTime - Date.now()) / 1000));
  };

  const handlePauseAll = async () => {
    const active = customers.filter(c => !c.finished);
    if (active.length === 0) {
      alert("Tidak ada billing aktif.");
      return;
    }
    
    if (!window.confirm("PAUSE SEMUA BILLING?\n\nSemua customer aktif akan dihentikan sementara.")) {
      return;
    }

    const now = Date.now();
    await updateJokiSettings({ globalPaused: true, globalPauseStarted: now });
    
    for (const customer of active) {
      if (!customer.finished && !customer.paused) {
        await updateJokiCustomer(customer.id, {
          remainingAtPause: getRemaining(customer),
          pauseStarted: now,
          paused: true
        });
      }
    }
  };

  const handleResumeAll = async () => {
    const paused = customers.filter(c => c.paused && !c.finished);
    if (paused.length === 0) {
      alert("Tidak ada billing yang sedang pause.");
      return;
    }

    if (!window.confirm("RESUME SEMUA BILLING?")) {
      return;
    }

    const now = Date.now();
    await updateJokiSettings({ globalPaused: false, globalPauseStarted: null });

    for (const customer of paused) {
      const pauseDuration = Math.max(0, Math.floor((now - customer.pauseStarted) / 1000));
      await updateJokiCustomer(customer.id, {
        totalPausedSeconds: customer.totalPausedSeconds + pauseDuration,
        endTime: now + (customer.remainingAtPause * 1000),
        paused: false,
        pauseStarted: null,
        remainingAtPause: null
      });
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-t-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
      <div>
        <h1 className="m-0 text-2xl font-bold">🥚 Steal an Egg — Joki Billing</h1>
        <p className="mt-1.5 text-gray-500 text-sm">Dashboard Billing Jasa Joki Roblox</p>
        <div className="mt-2 font-mono text-sm text-gray-700">
          Sekarang: {currentTime || "--"}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Tombol yang selalu muncul */}
        <button 
          onClick={onOpenAddModal}
          className="bg-blue-600 text-white border-none rounded-md px-3.5 py-2.5 font-bold cursor-pointer transition hover:opacity-85"
        >
          + Tambah Joki
        </button>
        
        <button 
          onClick={handlePauseAll}
          className="bg-red-600 text-white border-none rounded-md px-3.5 py-2.5 font-bold cursor-pointer transition hover:opacity-85"
        >
          ⏸ PAUSE ALL
        </button>
        
        <button 
          onClick={handleResumeAll}
          className="bg-green-600 text-white border-none rounded-md px-3.5 py-2.5 font-bold cursor-pointer transition hover:opacity-85"
        >
          ▶ RESUME ALL
        </button>

        <button 
          onClick={toggleStreamerMode}
          className={`${streamerMode ? 'bg-red-600' : 'bg-purple-600'} text-white border-none rounded-md px-3.5 py-2.5 font-bold cursor-pointer transition hover:opacity-85`}
        >
          {streamerMode ? '🔒 Streamer Mode ON' : '🎥 Streamer Mode'}
        </button>

        {/* Tombol HANYA ADMIN MODE */}
        {!streamerMode && (
          <button 
            onClick={onClearTransactions}
            className="bg-red-800 text-white border-none rounded-md px-3.5 py-2.5 font-bold cursor-pointer transition hover:opacity-85"
          >
            🗑 Clear Transaksi
          </button>
        )}
      </div>
    </div>
  );
};

export default JokiHeader;
