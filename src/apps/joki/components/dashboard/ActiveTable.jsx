import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Play, 
  Pause, 
  Plus, 
  Square, 
  Clock, 
  Edit3, 
  Undo2, 
  AlertTriangle, 
  Key, 
  Copy, 
  MessageSquare, 
  ArrowUpDown,
  Flame,
  Check,
  ChevronDown
} from 'lucide-react';
import CredentialModal from '../modals/CredentialModal';

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
  onOpenEditModal,
  onRequestMoveToQueue,
  onRequestStopCustomer, 
  onRequestClearActiveBillings
}) => {
  const { 
    customers, 
    updateJokiCustomer, 
    filter, 
    isAdmin,
    addToast 
  } = useJoki();
  
  const [now, setNow] = useState(Date.now());
  const [sortBy, setSortBy] = useState('SHORTEST_TIME'); // 'SHORTEST_TIME' | 'SLOT' | 'NAME' | 'DEFAULT'
  const [credentialCustomer, setCredentialCustomer] = useState(null);
  const [dmMenuCustomer, setDmMenuCustomer] = useState(null);

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

  // 1-Click Copy Ticket Link
  const handleCopyTicketLink = (customer) => {
    const tId = customer.ticketId || `JK-${customer.id.slice(-5)}`;
    const ticketUrl = `${window.location.origin}/ticket/${tId}`;
    navigator.clipboard.writeText(ticketUrl);
    addToast(`✓ Link tiket ${customer.username || customer.name} (${tId}) disalin!`, 'success');
  };

  // Copy TikTok DM Template
  const handleCopyDM = (customer, templateType) => {
    const tId = customer.ticketId || `JK-${customer.id.slice(-5)}`;
    const ticketUrl = `${window.location.origin}/ticket/${tId}`;
    const user = customer.username || customer.name;
    const tt = customer.tiktokName ? `@${customer.tiktokName}` : '';

    let text = '';
    if (templateType === 'ACTIVE') {
      text = `Halo bro ${tt}! Akun Roblox kamu (${user}) lagi dimainin di live ya bro! Ini link tiket live buat liat sisa waktu & jam beres: ${ticketUrl}. Pantau terus ya bro!`;
    } else if (templateType === 'OTP') {
      text = `Bro ${tt}, giliran akun kamu (${user}) nih mau dimainin! Standby ya, kalau ada kode OTP email masuk langsung kirim kesini ya bro.`;
    } else if (templateType === 'DONE') {
      text = `Akun kamu (${user}) udah beres dijoki ya bro! Makasih banyak udah order di live. Tiket kamu otomatis ditutup dalam 5 menit demi keamanan. Cek akun & jangan lupa ganti password ya bro!`;
    } else if (templateType === 'RESCHEDULE') {
      text = `Sorry banget ya bro ${tt}, jadwal live joki akun (${user}) diundur sebentar karena ada kendala mendadak. Tiket kamu tetap aman di sini: ${ticketUrl}. Nanti gas lagi ya bro!`;
    }

    navigator.clipboard.writeText(text);
    setDmMenuCustomer(null);
    addToast(`✓ Pesan DM untuk ${user} berhasil disalin!`, 'success');
  };

  let filteredCustomers = customers.filter(c => {
    if (c.finished) return false;
    if (filter === 'RUNNING') return !c.paused;
    if (filter === 'PAUSED') return c.paused;
    return true;
  });

  // Calculate duplicate slot occurrences
  const slotCounts = {};
  filteredCustomers.forEach(c => {
    const s = getCleanSlot(c);
    if (s !== 'VIP') {
      slotCounts[s] = (slotCounts[s] || 0) + 1;
    }
  });

  // Apply Smart Sorting
  filteredCustomers.sort((a, b) => {
    if (sortBy === 'SHORTEST_TIME') {
      const remA = getRemaining(a);
      const remB = getRemaining(b);
      return remA - remB; // Shortest remaining time on top ("Nu Sakedeng Dei")
    }
    if (sortBy === 'SLOT') {
      const slotA = a.slot === 'VIP' ? 99 : Number(a.slot || 1);
      const slotB = b.slot === 'VIP' ? 99 : Number(b.slot || 1);
      return slotA - slotB;
    }
    if (sortBy === 'NAME') {
      const nameA = (a.username || a.name || '').toLowerCase();
      const nameB = (b.username || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    }
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  return (
    <div className="flex flex-col gap-2.5">
      {/* TOOLBAR SORTING & HELPER */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-1">
        <div className="flex items-center gap-1.5 text-xs text-text-dim">
          <span className="text-[11px] font-bold">Urutkan Tabel:</span>
          <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-xl border border-border-default shadow-inner">
            <button
              type="button"
              onClick={() => setSortBy('SHORTEST_TIME')}
              className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === 'SHORTEST_TIME'
                  ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Flame size={12} className={sortBy === 'SHORTEST_TIME' ? 'text-accent-orange' : ''} />
              <span>Sisa Waktu Tercepat</span>
            </button>

            <button
              type="button"
              onClick={() => setSortBy('SLOT')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sortBy === 'SLOT'
                  ? 'bg-accent-purple/20 text-accent-purple-light border border-accent-purple/40'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Nomor Slot
            </button>

            <button
              type="button"
              onClick={() => setSortBy('NAME')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sortBy === 'NAME'
                  ? 'bg-white/10 text-white border border-border-subtle'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Abjad (A-Z)
            </button>
          </div>
        </div>

        <div className="text-[11px] text-text-faint font-semibold hidden md:block">
          💡 <span className="text-text-dim">Klik username untuk salin link tiket</span>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[950px]">
            <thead>
              <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3.5">Username Roblox</th>
                <th className="py-3 px-3.5">Akun TikTok</th>
                <th className="py-3 px-3 text-center">Layanan</th>
                <th className="py-3 px-3 text-center">Slot</th>
                <th className="py-3 px-3 text-center">Durasi</th>
                <th className="py-3 px-3 text-center">Mulai</th>
                <th className="py-3 px-3.5 text-center">Sisa Waktu</th>
                <th className="py-3 px-3 text-center">Jam Beres</th>
                <th className="py-3 px-3 text-center">Status</th>
                {isAdmin && <th className="py-3 px-3 text-center w-48">Aksi & Brankas</th>}
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
                  const isDuplicateSlot = !isVIP && (slotCounts[cleanSlot] > 1);
                  
                  return (
                    <tr 
                      key={customer.id} 
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isDuplicateSlot ? 'bg-accent-red/[0.04]' : ''
                      }`}
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-text-faint font-mono">
                        {index + 1}
                      </td>

                      {/* Roblox Username (Clickable for Ticket Link) */}
                      <td className="py-3 px-3.5 font-bold text-text-primary">
                        <button
                          type="button"
                          onClick={() => handleCopyTicketLink(customer)}
                          title="Klik untuk salin Link Tiket Customer"
                          className="font-black text-sm tracking-tight text-white hover:text-accent-cyan transition-colors flex items-center gap-1.5 cursor-pointer text-left group"
                        >
                          <span>{customer.username || customer.name}</span>
                          <Copy size={12} className="opacity-0 group-hover:opacity-100 text-accent-cyan transition-opacity" />
                        </button>
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

                      {/* Slot */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <span className={`inline-flex items-center justify-center min-w-[32px] px-2 py-0.5 rounded-lg text-xs font-extrabold font-mono tracking-tight ${
                            isVIP
                              ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/35'
                              : isDuplicateSlot
                              ? 'bg-accent-red/20 text-accent-red border border-accent-red/40 animate-pulse'
                              : 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/35'
                          }`}>
                            {cleanSlot === 'VIP' ? '👑 VIP' : `SLOT ${cleanSlot}`}
                          </span>
                          {isDuplicateSlot && (
                            <span title="Slot ini terduplikasi! Klik tombol ↩️ untuk kembalikan ke antrian" className="text-accent-red">
                              <AlertTriangle size={12} />
                            </span>
                          )}
                        </div>
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

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-3 px-3 text-center relative">
                          <div className="flex items-center justify-center gap-1">
                            {/* Brankas Button (1-Click Password & Email Vault) */}
                            <button
                              onClick={() => setCredentialCustomer(customer)}
                              title="Buka Brankas Akun (Salin Pass/Email)"
                              className="p-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/30 transition-all cursor-pointer"
                            >
                              <Key size={13} />
                            </button>

                            {/* DM Menu Button */}
                            <div className="relative">
                              <button
                                onClick={() => setDmMenuCustomer(dmMenuCustomer?.id === customer.id ? null : customer)}
                                title="Salin Pesan DM TikTok Siap Kirim"
                                className="p-1.5 rounded-lg bg-accent-cyan/15 text-accent-cyan hover:bg-accent-cyan/25 border border-accent-cyan/30 transition-all cursor-pointer"
                              >
                                <MessageSquare size={13} />
                              </button>

                              {/* DM Template Dropdown Menu */}
                              {dmMenuCustomer?.id === customer.id && (
                                <div className="absolute right-0 top-full mt-1 w-52 bg-bg-surface border border-border-default rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 text-left">
                                  <div className="text-[9.5px] font-extrabold uppercase px-2 py-1 text-text-dim border-b border-border-subtle">
                                    Salin Chat DM TikTok:
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDM(customer, 'ACTIVE')}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-white hover:bg-white/10 flex items-center justify-between"
                                  >
                                    <span>🎮 Info Lagi Dimainkan</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDM(customer, 'OTP')}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-accent-yellow hover:bg-accent-yellow/10 flex items-center justify-between"
                                  >
                                    <span>🚨 Minta Kode OTP</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDM(customer, 'DONE')}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-accent-green hover:bg-accent-green/10 flex items-center justify-between"
                                  >
                                    <span>🎉 Info Joki Beres</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDM(customer, 'RESCHEDULE')}
                                    className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold text-accent-orange hover:bg-accent-orange/10 flex items-center justify-between"
                                  >
                                    <span>⏳ Undur Jadwal Live</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Pause / Resume */}
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

                            {/* Return to Queue */}
                            <button
                              onClick={() => onRequestMoveToQueue(customer)}
                              title="Kembalikan ke antrian"
                              className="p-1.5 rounded-lg bg-accent-yellow/15 text-accent-yellow hover:bg-accent-yellow/25 border border-accent-yellow/30 transition-all cursor-pointer"
                            >
                              <Undo2 size={13} />
                            </button>

                            {/* Edit Billing */}
                            <button
                              onClick={() => onOpenEditModal(customer)}
                              title="Edit data billing / Brankas / Koreksi waktu"
                              className="p-1.5 rounded-lg bg-white/5 text-text-secondary hover:text-white hover:bg-white/10 border border-border-subtle transition-all cursor-pointer"
                            >
                              <Edit3 size={13} />
                            </button>

                            {/* Extend Time */}
                            <button
                              onClick={() => onOpenExtendModal(customer)}
                              title="Tambah waktu"
                              className="p-1.5 rounded-lg bg-accent-purple/15 text-accent-purple-light hover:bg-accent-purple/25 border border-accent-purple/30 transition-all cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>

                            {/* Stop Billing */}
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

      {/* Admin Action: Kosongkan Billing Aktif */}
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

      {/* Credential Popover Modal */}
      {credentialCustomer && (
        <CredentialModal
          customer={credentialCustomer}
          onClose={() => setCredentialCustomer(null)}
        />
      )}
    </div>
  );
};

export default ActiveTable;
