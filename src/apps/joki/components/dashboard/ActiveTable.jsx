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
  MoreHorizontal,
  Trash2,
  Rocket,
  CheckCheck,
  Check
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

// Clean helper to strictly display Basic, VIP, or VVIP
const getCleanService = (service) => {
  if (!service) return 'Basic';
  const s = service.toString().toUpperCase();
  if (s.includes('VVIP')) return 'VVIP';
  if (s.includes('VIP')) return 'VIP';
  return 'Basic';
};

// Clean helper to strictly display Slot Badge
const getCleanSlot = (customer) => {
  const srv = getCleanService(customer.service);
  if (srv === 'VVIP' || customer.slot === 'VVIP') return 'VVIP';
  if (srv === 'VIP' || customer.slot === 'VIP') return 'VIP';
  return customer.slot || '1';
};

const ActiveTable = ({ 
  onOpenExtendModal, 
  onOpenEditModal,
  onRequestMoveToQueue,
  onRequestStopCustomer, 
  onRequestClearActiveBillings,
  onStartQueueItem
}) => {
  const { 
    customers, 
    queue,
    updateJokiCustomer, 
    deleteJokiCustomer,
    finishAndArchiveCustomer,
    filter, 
    sortBy,
    isAdmin, 
    addToast 
  } = useJoki();
  
  const [now, setNow] = useState(Date.now());
  const [credentialCustomer, setCredentialCustomer] = useState(null);
  
  // Floating More-Menu State (Completely free from table overflow clipping)
  const [menuState, setMenuState] = useState(null); // { customer, top, right }

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close floating menu on window scroll/resize
  useEffect(() => {
    const handleDismiss = () => setMenuState(null);
    window.addEventListener('scroll', handleDismiss, true);
    window.addEventListener('resize', handleDismiss);
    return () => {
      window.removeEventListener('scroll', handleDismiss, true);
      window.removeEventListener('resize', handleDismiss);
    };
  }, []);

  const getRemaining = (customer) => {
    if (customer.finished || customer.isPendingClearance) return 0;
    if (customer.paused) return Math.max(0, customer.remainingAtPause || 0);
    return Math.max(0, Math.floor((customer.endTime - now) / 1000));
  };

  const getEndTime = (customer) => {
    if (customer.finished || customer.isPendingClearance) return customer.finishedTime || customer.endTime;
    if (customer.paused) return (customer.pauseStarted || now) + ((customer.remainingAtPause || 0) * 1000);
    return customer.endTime;
  };

  // Pause billing
  const handlePause = async (customer) => {
    const remaining = Math.max(0, Math.floor((customer.endTime - now) / 1000));
    await updateJokiCustomer(customer.id, {
      paused: true,
      pauseStarted: now,
      remainingAtPause: remaining
    });
    addToast(`Billing ${customer.username || customer.name} dijeda. Sisa waktu aman.`, 'warning');
  };

  // Resume billing
  const handleResume = async (customer) => {
    const pauseDuration = Math.max(0, Math.floor((now - (customer.pauseStarted || now)) / 1000));
    const newEndTime = now + ((customer.remainingAtPause || 0) * 1000);
    
    await updateJokiCustomer(customer.id, {
      totalPausedSeconds: (customer.totalPausedSeconds || 0) + pauseDuration,
      endTime: newEndTime,
      paused: false,
      pauseStarted: null,
      remainingAtPause: null
    });
    addToast(`Billing ${customer.username || customer.name} dilanjutkan! Jam selesai diperbarui.`, 'success');
  };

  // 1-Click Copy Ticket Link with Label
  const handleCopyTicketLink = (customer) => {
    const tId = customer.ticketId || `JK-${customer.id.slice(-5)}`;
    const ticketUrl = `${window.location.origin}/ticket/${tId}`;
    const targetName = customer.tiktokName 
      ? `@${customer.tiktokName.replace(/^@/, '')}` 
      : (customer.username || customer.name);
    
    const copyText = `Tiket Billing ${targetName}: ${ticketUrl}`;
    navigator.clipboard.writeText(copyText);
    addToast(`✓ Link tiket ${targetName} (${tId}) disalin!`, 'success');
  };

  // Clearance Handlers for Finished Slot
  const handleFillFromQueue = async (customer) => {
    await finishAndArchiveCustomer(customer.id);
    if (queue && queue.length > 0 && onStartQueueItem) {
      onStartQueueItem(queue[0]);
    } else {
      addToast('Slot telah diarsipkan ke Riwayat. Antrean saat ini kosong.', 'info');
    }
  };

  const handleFinishAndArchive = async (customer) => {
    await finishAndArchiveCustomer(customer.id);
  };

  // Open Floating Menu
  const handleOpenMenu = (e, customer) => {
    e.stopPropagation();
    if (menuState?.customer?.id === customer.id) {
      setMenuState(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < 220;

    setMenuState({
      customer,
      top: placeAbove ? (rect.top - 200) : (rect.bottom + 6),
      right: Math.max(12, window.innerWidth - rect.right)
    });
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
    setMenuState(null);
    addToast(`✓ Pesan DM untuk ${user} berhasil disalin!`, 'success');
  };
  // Delete / Cancel Active Billing Slot
  const handleDeleteSlot = async (customer) => {
    const name = customer.username || customer.name;
    const cleanS = getCleanSlot(customer);
    if (window.confirm(`Hapus permanen joki ${name} dari Slot ${cleanS}? (Billing akan dibatalkan langsung dan tidak dicatat ke riwayat omset)`)) {
      try {
        await deleteJokiCustomer(customer.id);
        addToast(`✓ Joki ${name} di Slot ${cleanS} berhasil dibatalkan/dihapus.`, 'info');
      } catch (err) {
        console.error(err);
        addToast('Gagal menghapus billing.', 'error');
      }
    }
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
      const getSlotVal = (c) => {
        const s = getCleanSlot(c);
        if (s === 'VVIP') return -2;
        if (s === 'VIP') return -1;
        return Number(s) || 99;
      };
      return getSlotVal(a) - getSlotVal(b);
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
      <div className="bg-bg-surface border border-border-default rounded-b-3xl overflow-hidden shadow-2xl">
        <div className="w-full overflow-x-auto lg:overflow-x-visible">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[10.5px] font-black uppercase tracking-wider">
                <th className="py-2.5 px-2 text-center w-8">#</th>
                <th className="py-2.5 px-2.5">Customer</th>
                <th className="py-2.5 px-2 text-center">Slot</th>
                <th className="py-2.5 px-2 text-center">Durasi</th>
                <th className="py-2.5 px-2 text-center">Mulai - Beres</th>
                <th className="py-2.5 px-2.5 text-center">Sisa Waktu</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                {isAdmin && <th className="py-2.5 px-2 text-center w-28">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-medium">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-text-dim">
                    <div className="flex flex-col items-center gap-2">
                      <Clock size={26} className="text-text-ghost" />
                      <span>Belum ada billing aktif. Pilih orang dari panel Antrian di kanan atau klik Order Baru.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const remaining = getRemaining(customer);
                  const isFinished = customer.finished || customer.isPendingClearance || (remaining <= 0 && !customer.paused);
                  const isWarning = !isFinished && !customer.paused && remaining > 0 && remaining <= 300;
                  const cleanService = getCleanService(customer.service);
                  const cleanSlot = getCleanSlot(customer);
                  const isVVIP = cleanService === 'VVIP' || cleanSlot === 'VVIP';
                  const isVIP = cleanService === 'VIP' || cleanSlot === 'VIP';
                  const isSpecialSlot = cleanSlot === 'VVIP' || cleanSlot === 'VIP';
                  const isDuplicateSlot = !isSpecialSlot && (slotCounts[cleanSlot] > 1);
                  const isMenuOpen = menuState?.customer?.id === customer.id;

                  return (
                    <tr 
                      key={customer.id} 
                      className={`transition-colors group ${
                        isFinished
                          ? 'bg-emerald-950/20 border-b border-emerald-500/20 hover:bg-emerald-950/30'
                          : isWarning
                          ? 'bg-rose-950/25 border-b border-rose-500/30 ring-1 ring-rose-500/40 animate-pulse hover:bg-rose-950/35'
                          : 'hover:bg-white/[0.02] border-b border-border-subtle'
                      }`}
                    >
                      {/* No */}
                      <td className="py-2.5 px-2 text-center text-text-dim font-mono text-xs">
                        {index + 1}
                      </td>

                      {/* Customer (Roblox Username + TikTok Handle) */}
                      <td className="py-2.5 px-2.5 font-bold text-text-primary">
                        <button
                          type="button"
                          onClick={() => handleCopyTicketLink(customer)}
                          title="Klik untuk salin Link Tiket Customer"
                          className="font-black text-sm tracking-tight text-white hover:text-accent-cyan transition-colors flex items-center gap-1 cursor-pointer text-left group"
                        >
                          <span className="truncate max-w-[130px]">{customer.username || customer.name}</span>
                          <Copy size={11} className="opacity-0 group-hover:opacity-100 text-accent-cyan transition-opacity shrink-0" />
                        </button>
                        {customer.tiktokName ? (
                          <div className="text-[10.5px] text-accent-cyan font-medium truncate max-w-[130px]">
                            @{customer.tiktokName}
                          </div>
                        ) : (
                          <div className="text-[10px] text-text-dim">-</div>
                        )}
                      </td>

                      {/* Slot & Service Badge */}
                      <td className="py-2.5 px-2 text-center">
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-lg text-xs font-black font-mono tracking-tight ${
                            cleanSlot === 'VVIP'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                              : cleanSlot === 'VIP'
                              ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/35'
                              : isDuplicateSlot
                              ? 'bg-accent-red/20 text-accent-red border border-accent-red/40 animate-pulse'
                              : 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/35'
                          }`}>
                            {cleanSlot === 'VVIP' ? '💎 VVIP' : (cleanSlot === 'VIP' ? '👑 VIP' : `SLOT ${cleanSlot}`)}
                          </span>
                          {!isVVIP && !isVIP && (
                            <span className="text-[9px] font-bold uppercase text-text-dim">
                              {cleanService}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-2 text-center text-text-secondary font-mono text-xs">
                        {formatDuration(customer.duration)}
                      </td>

                      {/* Time Schedule (Mulai -> Beres) */}
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-text-secondary">
                        <div className="text-text-dim text-[10px]">{formatClock(customer.startTime)}</div>
                        <div className="font-bold text-text-primary text-xs">{formatClock(getEndTime(customer))}</div>
                      </td>

                      {/* Countdown / Remaining Time */}
                      <td className="py-2.5 px-2.5 text-center">
                        {isFinished ? (
                          <span className="font-mono text-xs font-black tracking-tight px-2 py-1 rounded-lg bg-accent-green/20 text-accent-green border border-accent-green/40 shadow-sm">
                            🏁 00:00:00
                          </span>
                        ) : (
                          <span className={`font-mono text-xs font-black tracking-tight px-2 py-1 rounded-lg ${
                            customer.paused
                              ? 'bg-accent-orange/10 text-accent-orange border border-accent-orange/20'
                              : isWarning
                              ? 'bg-accent-red/20 text-accent-red border border-accent-red/30 animate-pulse'
                              : 'bg-accent-green/10 text-accent-green border border-accent-green/20'
                          }`}>
                            {formatTime(remaining)}
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-2.5 px-2 text-center">
                        {isFinished ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase bg-accent-green/20 text-accent-green border border-accent-green/40">
                            <CheckCheck size={11} />
                            <span>SELESAI</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                            customer.paused 
                              ? 'bg-accent-orange/15 text-accent-orange border border-accent-orange/30' 
                              : 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${customer.paused ? 'bg-accent-orange' : 'bg-accent-green animate-ping'}`} />
                            {customer.paused ? 'PAUSED' : 'RUNNING'}
                          </span>
                        )}
                      </td>

                      {/* SMART PRIORITY ACTION COLUMN */}
                      {isAdmin && (
                        <td className="py-2.5 px-2 text-center">
                          {isFinished ? (
                            <div className="flex items-center justify-center gap-1">
                              {/* 1. Isi dari Antrean */}
                              <button
                                onClick={() => handleFillFromQueue(customer)}
                                title="Arsipkan & Isi Slot ini dari Antrean Teratas"
                                className="px-2 py-1 rounded-lg bg-accent-green hover:bg-accent-green-light text-black font-black text-[11px] transition-all shadow flex items-center gap-1 cursor-pointer"
                              >
                                <Rocket size={11} />
                                <span>Isi Slot</span>
                              </button>

                              {/* 2. Selesaikan & Arsipkan */}
                              <button
                                onClick={() => handleFinishAndArchive(customer)}
                                title="Arsipkan ke Riwayat Transaksi (Kosongkan Slot)"
                                className="p-1 rounded-lg bg-white/10 text-white hover:bg-white/20 border border-white/20 transition-all cursor-pointer"
                              >
                                <Square size={12} />
                              </button>

                              {/* 3. Brankas Akun */}
                              <button
                                onClick={() => setCredentialCustomer(customer)}
                                title="Buka Brankas Akun"
                                className="p-1 rounded-lg bg-white/5 text-text-dim hover:text-white border border-white/10 transition-all cursor-pointer"
                              >
                                <Key size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {/* 1. Pause / Resume */}
                              {customer.paused ? (
                                <button
                                  onClick={() => handleResume(customer)}
                                  title="Resume billing"
                                  className="p-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/30 transition-all cursor-pointer"
                                >
                                  <Play size={12} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handlePause(customer)}
                                  title="Pause billing"
                                  className="p-1.5 rounded-lg bg-accent-orange/15 text-accent-orange hover:bg-accent-orange/25 border border-accent-orange/30 transition-all cursor-pointer"
                                >
                                  <Pause size={12} />
                                </button>
                              )}

                              {/* 2. Brankas Akun */}
                              <button
                                onClick={() => setCredentialCustomer(customer)}
                                title="Buka Brankas Akun"
                                className="p-1.5 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/25 border border-accent-green/30 transition-all cursor-pointer"
                              >
                                <Key size={12} />
                              </button>

                              {/* 3. Tambah / Perpanjang Waktu */}
                              <button
                                onClick={() => onOpenExtendModal(customer)}
                                title="Tambah / Perpanjang Waktu (+ Jam)"
                                className="p-1.5 rounded-lg bg-accent-purple/20 text-accent-purple-light hover:bg-accent-purple/30 border border-accent-purple/40 transition-all cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>

                              {/* 4. Menu Titik Tiga */}
                              <button
                                onClick={(e) => handleOpenMenu(e, customer)}
                                title="Aksi lainnya"
                                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  isMenuOpen
                                    ? 'bg-accent-cyan/25 text-accent-cyan border-accent-cyan shadow'
                                    : 'bg-white/5 text-text-muted hover:text-text-primary border-border-subtle hover:bg-white/10'
                                }`}
                              >
                                <MoreHorizontal size={12} />
                              </button>
                            </div>
                          )}
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

      {/* FLOATING FIXED MORE MENU (PORTAL-LIKE OUTSIDE TABLE CLIPPING) */}
      {menuState && (
        <>
          {/* Invisible Backdrop to handle click outside */}
          <div 
            className="fixed inset-0 z-[9998] bg-transparent cursor-default"
            onClick={() => setMenuState(null)}
          />

          {/* Floating Dropdown Card */}
          <div 
            style={{ 
            top: `${menuState.top}px`, 
            right: `${menuState.right}px` 
            }}
            className="fixed z-[9999] w-56 bg-[#13151b]/95 backdrop-blur-2xl border border-border-default rounded-2xl shadow-2xl p-1.5 space-y-1 text-left animate-slide-in"
          >
            <div className="text-[10px] font-extrabold uppercase px-2.5 py-1 text-text-dim border-b border-border-subtle flex items-center justify-between">
              <span>Menu Aksi:</span>
              <strong className="text-white truncate max-w-[110px]">{menuState.customer.username || menuState.customer.name}</strong>
            </div>

            {/* 1. Edit Billing & Brankas */}
            <button
              type="button"
              onClick={() => {
                const c = menuState.customer;
                setMenuState(null);
                onOpenEditModal(c);
              }}
              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-white hover:bg-white/10 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Edit3 size={13} className="text-accent-cyan" />
              <span>Edit Data & Brankas</span>
            </button>

            {/* 2. Tambah Waktu */}
            <button
              type="button"
              onClick={() => {
                const c = menuState.customer;
                setMenuState(null);
                onOpenExtendModal(c);
              }}
              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-accent-purple-light hover:bg-accent-purple/15 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus size={13} />
              <span>Tambah Waktu (+ Jam)</span>
            </button>

            {/* 3. Kembalikan ke Antrian */}
            <button
              type="button"
              onClick={() => {
                const c = menuState.customer;
                setMenuState(null);
                onRequestMoveToQueue(c);
              }}
              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-accent-yellow hover:bg-accent-yellow/15 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Undo2 size={13} />
              <span>Kembalikan ke Antrian</span>
            </button>

            {/* 4. Salin DM TikTok Templates */}
            <div className="pt-1 border-t border-border-subtle">
              <div className="text-[9px] font-extrabold uppercase px-2.5 py-0.5 text-text-faint">
                Salin Pesan DM TikTok:
              </div>
              <button
                type="button"
                onClick={() => handleCopyDM(menuState.customer, 'ACTIVE')}
                className="w-full px-2.5 py-1 rounded-lg text-left text-[11.5px] text-text-muted hover:text-white hover:bg-white/5 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🎮 Info Lagi Dimainkan</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyDM(menuState.customer, 'OTP')}
                className="w-full px-2.5 py-1 rounded-lg text-left text-[11.5px] text-accent-yellow hover:bg-accent-yellow/10 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🚨 Minta Kode OTP</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopyDM(menuState.customer, 'DONE')}
                className="w-full px-2.5 py-1 rounded-lg text-left text-[11.5px] text-accent-green hover:bg-accent-green/10 flex items-center gap-1.5 cursor-pointer"
              >
                <span>🎉 Info Joki Beres</span>
              </button>
            </div>

            {/* 5. Hentikan Billing & Hapus Permanen */}
            <div className="pt-1 border-t border-border-subtle space-y-1">
              <button
                type="button"
                onClick={() => {
                  const c = menuState.customer;
                  setMenuState(null);
                  onRequestStopCustomer(c);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-accent-orange hover:bg-accent-orange/15 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Square size={13} />
                <span>Hentikan Billing (Selesai)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const c = menuState.customer;
                  setMenuState(null);
                  handleDeleteSlot(c);
                }}
                className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-accent-red hover:bg-accent-red/15 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 size={13} />
                <span>Batalkan & Hapus Slot</span>
              </button>
            </div>
          </div>
        </>
      )}

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
