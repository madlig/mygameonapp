import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Play, Pause, Plus, Square, Trash2, User, Clock } from 'lucide-react';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatClock = (timestamp) => {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: false
  });
};

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const ActiveTable = ({ 
  onOpenExtendModal, 
  onRequestStopCustomer, 
  onRequestDeleteCustomer 
}) => {
  const { 
    customers, 
    updateJokiCustomer, 
    searchQuery, 
    filter, 
    isAdmin,
    addToast 
  } = useJoki();
  
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
    addToast(`Billing ${customer.username || customer.name} dijeda.`, 'info');
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
    addToast(`Billing ${customer.username || customer.name} dilanjutkan.`, 'success');
  };

  const filteredCustomers = customers.filter(c => {
    if (c.finished) return false;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = 
      (c.username && c.username.toLowerCase().includes(query)) ||
      (c.tiktokName && c.tiktokName.toLowerCase().includes(query)) ||
      (c.name && c.name.toLowerCase().includes(query)) ||
      (c.service && c.service.toLowerCase().includes(query));

    let matchesFilter = true;
    if (filter === 'RUNNING') matchesFilter = !c.paused;
    if (filter === 'PAUSED') matchesFilter = c.paused;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-bg-surface border border-border-default rounded-b-2xl overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[1000px]">
          <thead>
            <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[11px] font-extrabold uppercase tracking-wider">
              <th className="py-3 px-4 text-center w-12">No</th>
              <th className="py-3 px-4">Username Roblox</th>
              <th className="py-3 px-4">Akun TikTok</th>
              <th className="py-3 px-4 text-center">Layanan / Slot</th>
              <th className="py-3 px-4 text-center">Durasi</th>
              <th className="py-3 px-4 text-center">Mulai</th>
              <th className="py-3 px-4 text-center">Sisa Waktu</th>
              <th className="py-3 px-4 text-center">Jam Beres</th>
              <th className="py-3 px-4 text-center">Status</th>
              {isAdmin && <th className="py-3 px-4 text-center w-48">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle text-xs font-medium">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 10 : 9} className="py-14 text-center text-text-dim">
                  <div className="flex flex-col items-center gap-2">
                    <Clock size={28} className="text-text-ghost" />
                    <span>Tidak ada antrean joki yang sedang aktif.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCustomers.map((customer, index) => {
                const remaining = getRemaining(customer);
                const isWarning = !customer.paused && remaining <= 300; // <= 5 menit
                const isVIP = customer.service && customer.service.toUpperCase().includes('VIP');
                
                return (
                  <tr 
                    key={customer.id} 
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* No */}
                    <td className="py-3 px-4 text-center text-text-faint font-mono">
                      {index + 1}
                    </td>

                    {/* Roblox Username */}
                    <td className="py-3 px-4 font-bold text-text-primary">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple shrink-0 text-[10px]">
                          🎮
                        </div>
                        <span className="font-extrabold text-sm tracking-tight text-white">
                          {customer.username || customer.name}
                        </span>
                      </div>
                    </td>

                    {/* TikTok Account */}
                    <td className="py-3 px-4 text-text-secondary">
                      {customer.tiktokName ? (
                        <span className="inline-flex items-center gap-1 text-text-muted">
                          <span className="text-accent-cyan">@</span>{customer.tiktokName}
                        </span>
                      ) : (
                        <span className="text-text-dim">-</span>
                      )}
                    </td>

                    {/* Service / Slot */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-extrabold tracking-wide ${
                        isVIP 
                          ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
                          : 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
                      }`}>
                        {customer.service}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-center text-text-secondary font-mono">
                      {formatDuration(customer.duration)}
                    </td>

                    {/* Start Time */}
                    <td className="py-3 px-4 text-center text-text-tertiary font-mono">
                      {formatClock(customer.startTime)}
                    </td>

                    {/* Countdown / Remaining Time */}
                    <td className="py-3 px-4 text-center">
                      <span className={`font-mono text-base font-extrabold tracking-tight px-2.5 py-1 rounded-lg ${
                        customer.paused
                          ? 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20'
                          : isWarning
                          ? 'bg-accent-red/20 text-accent-red border border-accent-red/30 animate-pulse'
                          : 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                      }`}>
                        {formatTime(remaining)}
                      </span>
                    </td>

                    {/* Estimated Finish Time */}
                    <td className="py-3 px-4 text-center font-mono font-bold text-text-primary">
                      {formatClock(getEndTime(customer))}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        customer.paused 
                          ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/30' 
                          : 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${customer.paused ? 'bg-accent-orange' : 'bg-accent-green animate-ping'}`} />
                        {customer.paused ? 'PAUSED' : 'RUNNING'}
                      </span>
                    </td>

                    {/* Admin Actions */}
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {customer.paused ? (
                            <button
                              onClick={() => handleResume(customer)}
                              title="Resume billing"
                              className="p-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/30 transition-all cursor-pointer"
                            >
                              <Play size={13} />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePause(customer)}
                              title="Pause billing"
                              className="p-1.5 rounded-lg bg-accent-orange/15 text-accent-orange hover:bg-accent-orange/25 border border-accent-orange/30 transition-all cursor-pointer"
                            >
                              <Pause size={13} />
                            </button>
                          )}

                          <button
                            onClick={() => onOpenExtendModal(customer)}
                            title="Tambah waktu"
                            className="p-1.5 rounded-lg bg-accent-purple/15 text-accent-purple-light hover:bg-accent-purple/25 border border-accent-purple/30 transition-all cursor-pointer"
                          >
                            <Plus size={13} />
                          </button>

                          <button
                            onClick={() => onRequestStopCustomer(customer)}
                            title="Hentikan billing"
                            className="p-1.5 rounded-lg bg-accent-red/15 text-accent-red hover:bg-accent-red/25 border border-accent-red/30 transition-all cursor-pointer"
                          >
                            <Square size={13} />
                          </button>

                          <button
                            onClick={() => onRequestDeleteCustomer(customer)}
                            title="Hapus data"
                            className="p-1.5 rounded-lg text-text-dim hover:text-accent-red hover:bg-accent-red/10 transition-all cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActiveTable;
