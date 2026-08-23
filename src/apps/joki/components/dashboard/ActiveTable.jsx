import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Play, Pause, Plus, Square, Clock } from 'lucide-react';

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

// Clean helper to strictly display Basic or VIP
const getCleanService = (service) => {
  if (!service) return 'Basic';
  return service.toString().toUpperCase().includes('VIP') ? 'VIP' : 'Basic';
};

// Clean helper to strictly display Slot Badge
const getCleanSlot = (customer) => {
  const isVIP = getCleanService(customer.service) === 'VIP' || customer.slot === 'VIP';
  if (isVIP) return 'VIP';
  return customer.slot || '1';
};

const ActiveTable = ({ 
  onOpenExtendModal, 
  onRequestStopCustomer, 
  onRequestClearActiveBillings
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
    if (customer.paused) return (customer.pauseStarted || now) + ((customer.remainingAtPause || 0) * 1000);
    return customer.endTime;
  };

  const handlePause = async (customer) => {
    const remaining = getRemaining(customer);
    const timeNow = Date.now();
    await updateJokiCustomer(customer.id, {
      remainingAtPause: remaining,
      pauseStarted: timeNow,
      paused: true
    });
    addToast(`Billing ${customer.username || customer.name} dijeda.`, 'info');
  };

  const handleResume = async (customer) => {
    const timeNow = Date.now();
    const pauseDuration = Math.max(0, Math.floor((timeNow - (customer.pauseStarted || timeNow)) / 1000));
    const newEndTime = timeNow + ((customer.remainingAtPause || 0) * 1000);

    await updateJokiCustomer(customer.id, {
      totalPausedSeconds: (customer.totalPausedSeconds || 0) + pauseDuration,
      endTime: newEndTime,
      paused: false,
      pauseStarted: null,
      remainingAtPause: null
    });
    addToast(`Billing ${customer.username || customer.name} dilanjutkan! Jam selesai diperbarui.`, 'success');
  };

  const filteredCustomers = customers.filter(c => {
    if (c.finished) return false;
    const query = searchQuery.toLowerCase().trim();
    const cleanService = getCleanService(c.service);
    const cleanSlot = getCleanSlot(c);

    const matchesSearch = 
      (c.username && c.username.toLowerCase().includes(query)) ||
      (c.tiktokName && c.tiktokName.toLowerCase().includes(query)) ||
      (c.name && c.name.toLowerCase().includes(query)) ||
      (cleanSlot && cleanSlot.toString().toLowerCase().includes(query)) ||
      (cleanService && cleanService.toLowerCase().includes(query));

    let matchesFilter = true;
    if (filter === 'RUNNING') matchesFilter = !c.paused;
    if (filter === 'PAUSED') matchesFilter = c.paused;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex flex-col gap-2.5">
      <div className="bg-bg-surface border border-border-default rounded-b-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[950px]">
            <thead>
              <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3.5">Username Roblox</th>
                <th className="py-3 px-3.5">Akun TikTok</th>
                {/* Layanan & Slot BERSEBELAHAN */}
                <th className="py-3 px-3 text-center">Layanan</th>
                <th className="py-3 px-3 text-center">Slot</th>
                <th className="py-3 px-3 text-center">Durasi</th>
                <th className="py-3 px-3 text-center">Mulai</th>
                <th className="py-3 px-3.5 text-center">Sisa Waktu</th>
                <th className="py-3 px-3 text-center">Jam Beres</th>
                <th className="py-3 px-3 text-center">Status</th>
                {isAdmin && <th className="py-3 px-3 text-center w-36">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 11 : 10} className="py-12 text-center text-text-dim">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={26} className="text-text-ghost" />
                      <span>Belum ada billing aktif. Pilih orang dari panel Antrian di kanan atau klik Tambah Joki.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const remaining = getRemaining(customer);
                  const isWarning = !customer.paused && remaining <= 300; // <= 5 menit
                  const cleanService = getCleanService(customer.service);
                  const isVIP = cleanService === 'VIP';
                  const cleanSlot = getCleanSlot(customer);
                  
                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-text-faint font-mono">
                        {index + 1}
                      </td>

                      {/* Roblox Username */}
                      <td className="py-3 px-3.5 font-bold text-text-primary">
                        <span className="font-extrabold text-sm tracking-tight text-white">
                          {customer.username || customer.name}
                        </span>
                      </td>

                      {/* TikTok Account */}
                      <td className="py-3 px-3.5 text-text-secondary">
                        {customer.tiktokName ? (
                          <span className="inline-flex items-center gap-0.5 text-text-muted">
                            <span className="text-accent-cyan">@</span>{customer.tiktokName}
                          </span>
                        ) : (
                          <span className="text-text-dim">-</span>
                        )}
                      </td>

                      {/* Layanan */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase tracking-wide ${
                          isVIP 
                            ? 'text-accent-yellow bg-accent-yellow/15 border border-accent-yellow/30' 
                            : 'text-accent-purple-light bg-accent-purple/15 border border-accent-purple/30'
                        }`}>
                          {cleanService}
                        </span>
                      </td>

                      {/* Slot (Bersebelahan dengan Layanan) */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-lg text-xs font-extrabold font-mono tracking-tight ${
                          isVIP
                            ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/35'
                            : 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/35'
                        }`}>
                          {cleanSlot === 'VIP' ? '👑 VIP' : `SLOT ${cleanSlot}`}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-3 px-3 text-center text-text-secondary font-mono">
                        {formatDuration(customer.duration)}
                      </td>

                      {/* Start Time */}
                      <td className="py-3 px-3 text-center text-text-tertiary font-mono">
                        {formatClock(customer.startTime)}
                      </td>

                      {/* Countdown / Remaining Time */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`font-mono text-sm font-extrabold tracking-tight px-2 py-1 rounded-lg ${
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
                      <td className="py-3 px-3 text-center font-mono font-bold text-text-primary">
                        {formatClock(getEndTime(customer))}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          customer.paused 
                            ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/30' 
                            : 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${customer.paused ? 'bg-accent-orange' : 'bg-accent-green animate-ping'}`} />
                          {customer.paused ? 'PAUSED' : 'RUNNING'}
                        </span>
                      </td>

                      {/* Admin Actions (Tanpa Tombol Trash) */}
                      {isAdmin && (
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
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

      {/* Admin Action: Kosongkan Billing Aktif (TETAP MUNCUL WALAUPUN STREAMER MODE ON) */}
      {isAdmin && filteredCustomers.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRequestClearActiveBillings}
            className="text-xs font-bold text-accent-red/90 hover:text-accent-red hover:bg-accent-red/10 py-1.5 px-3 rounded-xl border border-border-subtle hover:border-accent-red/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>🧹 Kosongkan Semua Billing Aktif</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ActiveTable;
