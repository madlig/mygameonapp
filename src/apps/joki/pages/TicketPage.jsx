import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  db 
} from '../../../config/firebaseConfig';
import { 
  collection, 
  onSnapshot,
  doc
} from 'firebase/firestore';
import { 
  Gamepad2, 
  Clock, 
  Crown, 
  Sparkles, 
  Tv, 
  AlertCircle, 
  CheckCircle2, 
  Pause, 
  Hourglass, 
  ShieldCheck, 
  Radio, 
  Flame, 
  Coffee,
  Moon,
  Gem
} from 'lucide-react';
import { computeLiveStatus } from '../services/jokiFirebase';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatClock = (timestamp) => {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
};

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const TicketPage = () => {
  const { ticketId: rawTicketId, workspaceId: paramWorkspaceId } = useParams();
  const searchTicketId = (rawTicketId || '').trim().toUpperCase();

  const [loading, setLoading] = useState(true);
  const [ticketData, setTicketData] = useState(null);
  const [workspaceInfo, setWorkspaceInfo] = useState(null);
  const [workspaceSettings, setWorkspaceSettings] = useState(null);
  const [activeCustomers, setActiveCustomers] = useState([]);
  const [queueList, setQueueList] = useState([]);
  const [now, setNow] = useState(Date.now());

  // 1-second ticker for live countdowns
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to workspaces to locate the ticket
  useEffect(() => {
    const wsRef = collection(db, 'joki_workspaces');
    const unsubWs = onSnapshot(wsRef, (snap) => {
      const allWs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // If workspace is specified in URL, use it; otherwise search across all workspaces
      const targetWorkspaces = paramWorkspaceId 
        ? allWs.filter(w => w.id === paramWorkspaceId) 
        : allWs;

      let found = false;
      const allSettingsMap = {};
      const subUnsubs = [];

      targetWorkspaces.forEach(ws => {
        const custCol = collection(db, 'joki_workspaces', ws.id, 'customers');
        const queueCol = collection(db, 'joki_workspaces', ws.id, 'queue');
        const settingsDoc = doc(db, 'joki_workspaces', ws.id, 'settings', 'global');

        // Settings listener
        const uSettings = onSnapshot(settingsDoc, (sSnap) => {
          if (sSnap.exists()) {
            const sData = sSnap.data();
            allSettingsMap[ws.id] = sData;
            setTicketData(prev => {
              if (prev && prev.workspaceId === ws.id) {
                setWorkspaceSettings(sData);
              }
              return prev;
            });
          }
        });
        subUnsubs.push(uSettings);

        // Customers listener (Active / Finished)
        const uCust = onSnapshot(custCol, (cSnap) => {
          const custs = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));

          // Check if ticket is in customers
          const matchCust = custs.find(c => {
            const tId = (c.ticketId || `JK-${c.id.slice(-5)}`).toUpperCase();
            return tId === searchTicketId || c.id === rawTicketId;
          });

          if (matchCust) {
            found = true;
            setActiveCustomers(custs.filter(c => !c.finished));
            setTicketData({ ...matchCust, type: 'CUSTOMER', workspaceId: ws.id });
            setWorkspaceInfo(ws);
            if (allSettingsMap[ws.id]) {
              setWorkspaceSettings(allSettingsMap[ws.id]);
            }
            setLoading(false);
          }
        });
        subUnsubs.push(uCust);

        // Queue listener
        const uQueue = onSnapshot(queueCol, (qSnap) => {
          const qItems = qSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          qItems.sort((a, b) => (a.orderIndex ?? a.createdAt ?? 0) - (b.orderIndex ?? b.createdAt ?? 0));

          // Check if ticket is in queue
          const matchQueue = qItems.find(q => {
            const tId = (q.ticketId || `JK-${q.id.slice(-5)}`).toUpperCase();
            return tId === searchTicketId || q.id === rawTicketId;
          });

          if (matchQueue) {
            found = true;
            setQueueList(qItems);
            setTicketData({ ...matchQueue, type: 'QUEUE', workspaceId: ws.id });
            setWorkspaceInfo(ws);
            if (allSettingsMap[ws.id]) {
              setWorkspaceSettings(allSettingsMap[ws.id]);
            }
            setLoading(false);
          }
        });
        subUnsubs.push(uQueue);
      });

      setTimeout(() => {
        if (!found) setLoading(false);
      }, 1500);

      return () => {
        subUnsubs.forEach(u => u());
      };
    });

    return () => unsubWs();
  }, [searchTicketId, paramWorkspaceId, rawTicketId]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan animate-spin mb-3">
          <Gamepad2 size={24} />
        </div>
        <p className="text-sm font-bold text-text-secondary animate-pulse m-0">
          Mencari Tiket Joki Kamu...
        </p>
      </div>
    );
  }

  // Not Found Screen
  if (!ticketData) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-accent-red/15 border border-accent-red/30 flex items-center justify-center text-accent-red mb-4">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black text-white m-0 mb-1 tracking-tight">
          Tiket Tidak Ditemukan
        </h2>
        <p className="text-xs text-text-muted max-w-xs mb-6">
          Kode tiket <strong className="text-accent-cyan">#{searchTicketId}</strong> tidak terdaftar atau sudah dibersihkan dari server.
        </p>
        <Link 
          to="/"
          className="px-6 py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple-light text-xs font-extrabold text-white transition-all shadow-lg shadow-accent-purple/20"
        >
          Lihat Live Monitor Utama
        </Link>
      </div>
    );
  }

  // Calculate Self-Destruct State (5 Minutes after finish)
  const isFinished = ticketData.type === 'CUSTOMER' && ticketData.finished;
  const finishTimestamp = ticketData.finishedTime || ticketData.endTime || ticketData.createdAt;
  const elapsedSinceFinishSeconds = Math.max(0, Math.floor((now - finishTimestamp) / 1000));
  const SELF_DESTRUCT_LIMIT = 5 * 60; // 5 minutes
  const isSelfDestructed = isFinished && elapsedSinceFinishSeconds >= SELF_DESTRUCT_LIMIT;
  const remainingDestructSeconds = Math.max(0, SELF_DESTRUCT_LIMIT - elapsedSinceFinishSeconds);

  // Self-Destructed Expired Screen
  if (isSelfDestructed) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-white/5 border border-border-default flex items-center justify-center text-text-muted mb-4">
          <ShieldCheck size={32} />
        </div>
        <h2 className="text-xl font-black text-white m-0 mb-1 tracking-tight">
          Tiket Ini Sudah Selesai & Hangus
        </h2>
        <p className="text-xs text-text-muted max-w-sm mb-6">
          Sesi joki untuk akun <strong>{ticketData.username || ticketData.name}</strong> sudah selesai dan tiket otomatis ditutup demi keamanan akun kamu.
        </p>

        <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default max-w-xs w-full mb-6 text-left">
          <div className="text-xs font-black text-accent-cyan mb-1 flex items-center gap-1.5">
            <Flame size={14} className="text-accent-orange" />
            <span>Mau Joki Lagi?</span>
          </div>
          <p className="text-[11.5px] text-text-secondary m-0">
            Yuk mampir dan pesan antrean baru di live streaming Streamer!
          </p>
        </div>

        <Link 
          to="/"
          className="px-6 py-3 rounded-xl bg-accent-cyan text-bg-primary text-xs font-black transition-all shadow-lg shadow-accent-cyan/20"
        >
          Buka Live Stream Streamer
        </Link>
      </div>
    );
  }

  // Determine Customer State
  const serviceUpper = (ticketData.service || '').toUpperCase();
  const isVVIP = serviceUpper.includes('VVIP') || ticketData.slot === 'VVIP';
  const isVIP = !isVVIP && (serviceUpper.includes('VIP') || ticketData.slot === 'VIP');
  const streamerName = workspaceInfo?.name || 'Kadal Gaming';

  // Compute Time-Based & Active-Slot Live Status
  const liveState = computeLiveStatus(workspaceSettings, activeCustomers);
  const streamStatus = liveState.status;
  const nextSchedule = liveState.subtext || '';

  // Queue Calculations (If in Queue)
  let queuePosition = 1;
  let estimatedWaitMinutes = 0;
  let estimatedSlotName = 'Slot 1';
  let estimatedStartTimeStr = '--:--';

  if (ticketData.type === 'QUEUE') {
    const subQueue = isVVIP
      ? queueList.filter(q => (q.service || '').toUpperCase() === 'VVIP')
      : isVIP 
      ? queueList.filter(q => (q.service || '').toUpperCase() === 'VIP')
      : queueList.filter(q => {
          const s = (q.service || '').toUpperCase();
          return s !== 'VIP' && s !== 'VVIP';
        });

    const myIndex = subQueue.findIndex(q => q.id === ticketData.id);
    queuePosition = myIndex >= 0 ? myIndex + 1 : 1;

    // Filter relevant active slots
    const relevantSlots = isVVIP
      ? activeCustomers.filter(c => (c.service || '').toUpperCase().includes('VVIP') || c.slot === 'VVIP')
      : isVIP
      ? activeCustomers.filter(c => ((c.service || '').toUpperCase() === 'VIP' || c.slot === 'VIP') && !((c.service || '').toUpperCase().includes('VVIP') || c.slot === 'VVIP'))
      : activeCustomers.filter(c => !(c.service || '').toUpperCase().includes('VIP') && c.slot !== 'VIP' && c.slot !== 'VVIP');

    if (streamStatus === 'OFFLINE') {
      estimatedWaitMinutes = 0;
      estimatedSlotName = isVVIP ? 'SLOT VVIP' : (isVIP ? 'SLOT VIP' : 'Slot Live');
      estimatedStartTimeStr = liveState.liveStartTime ? `Pukul ${liveState.liveStartTime} WIB` : 'Sesi Live Berikutnya';
    } else if (relevantSlots.length === 0) {
      // Slot is currently vacant
      estimatedWaitMinutes = 0;
      estimatedSlotName = isVVIP ? 'SLOT VVIP' : (isVIP ? 'SLOT VIP' : 'Slot Siap!');
      estimatedStartTimeStr = 'Segera (Slot Siap)';
    } else {
      // Sort active slots by remaining finish time
      const sortedByFinish = [...relevantSlots].sort((a, b) => {
        const remA = a.paused ? (a.remainingAtPause || 0) : Math.max(0, (a.endTime - now) / 1000);
        const remB = b.paused ? (b.remainingAtPause || 0) : Math.max(0, (b.endTime - now) / 1000);
        return remA - remB;
      });

      // Target slot based on position index
      const targetSlotIndex = Math.min(queuePosition - 1, sortedByFinish.length - 1);
      const targetCustomer = sortedByFinish[targetSlotIndex];
      const remSec = targetCustomer?.paused 
        ? (targetCustomer?.remainingAtPause || 0)
        : Math.max(0, Math.floor(((targetCustomer?.endTime || now) - now) / 1000));

      estimatedWaitMinutes = Math.max(1, Math.round(remSec / 60));
      estimatedSlotName = isVVIP ? 'SLOT VVIP' : (isVIP ? 'SLOT VIP' : `SLOT ${targetCustomer?.slot || '1'}`);
      estimatedStartTimeStr = formatClock(now + (remSec * 1000));
    }
  }

  // Active Billing Remaining Time
  let remainingSeconds = 0;
  let isPaused = false;
  if (ticketData.type === 'CUSTOMER' && !ticketData.finished) {
    isPaused = ticketData.paused;
    remainingSeconds = isPaused
      ? Math.max(0, ticketData.remainingAtPause || 0)
      : Math.max(0, Math.floor((ticketData.endTime - now) / 1000));
  }

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-4 py-8 select-none font-sans">
      <div className="w-full max-w-[420px] flex flex-col gap-3.5">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan font-black text-xs">
              🎮
            </div>
            <div>
              <div className="text-xs font-black tracking-tight text-white flex items-center gap-1">
                <span>{streamerName}</span>
              </div>
              <span className="text-[10px] text-text-dim font-bold tracking-wide">
                TIKET JOKI AFK ROBLOX
              </span>
            </div>
          </div>

          <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-white/5 border border-border-default text-accent-cyan">
            #{ticketData.ticketId || `JK-${ticketData.id.slice(-5)}`}
          </span>
        </div>

        {/* Streamer Broadcast / Schedule Banner (Context-Aware) */}
        {streamStatus === 'LIVE' ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-accent-red/20 to-accent-purple/20 border border-accent-red/40 flex items-center justify-between gap-2 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-red shrink-0" />
              <div className="text-xs font-black text-white truncate">
                🔴 Streamer Sedang LIVE STREAM!
              </div>
            </div>
            <Link
              to="/"
              className="text-[11px] font-black px-3 py-1 rounded-xl bg-accent-red hover:bg-accent-red/90 text-white shrink-0 shadow"
            >
              Nonton Live
            </Link>
          </div>
        ) : streamStatus === 'BREAK' ? (
          <div className="p-3 rounded-2xl bg-accent-orange/15 border border-accent-orange/35 flex items-center gap-2 text-accent-orange text-xs font-bold">
            <Coffee size={15} />
            <span>Streamer lagi istirahat sebentar. Joki segera dilanjutkan!</span>
          </div>
        ) : (
          /* OFFLINE BANNER (Context-Aware for Active Slot vs Queue) */
          <div className="p-3 rounded-2xl bg-bg-surface border border-border-default flex flex-col gap-1 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted font-bold">
              <Moon size={13} className="text-accent-purple-light" />
              <span>Status Streamer: <strong>Off Stream</strong></span>
            </div>
            <p className="text-[11.5px] text-text-dim m-0 leading-relaxed">
              {ticketData.type === 'CUSTOMER' && !ticketData.finished ? (
                <span>
                  Sesi live sudah selesai. Joki di <strong className="text-white">{ticketData.slot === 'VVIP' ? 'Slot VVIP' : (ticketData.slot === 'VIP' ? 'Slot VIP' : `Slot ${ticketData.slot}`)}</strong> dijeda dan <strong className="text-accent-green">sisa waktu aman</strong> untuk dilanjutkan saat live berikutnya!
                </span>
              ) : (
                <span>
                  {nextSchedule 
                    ? `${nextSchedule}. Akun kamu tetap aman di antrean!` 
                    : 'Akun kamu aman di antrean dan akan dimainkan pada sesi live berikutnya.'}
                </span>
              )}
            </p>
          </div>
        )}

        {/* MAIN TICKET CARD */}
        <div className={`rounded-3xl p-5 border-2 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
          isVVIP
            ? 'bg-gradient-to-b from-[#211116] to-[#121318] border-rose-500/50 shadow-rose-500/10'
            : isVIP
            ? 'bg-gradient-to-b from-[#181611] to-[#121318] border-accent-yellow/40 shadow-accent-yellow/5'
            : 'bg-gradient-to-b from-[#14151f] to-[#0f1015] border-accent-cyan/30 shadow-accent-cyan/5'
        }`}>

          {/* User Profile Header */}
          <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
            <div className="min-w-0">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-dim mb-0.5">
                Customer Roblox
              </div>
              <div className="text-lg font-black text-white tracking-tight truncate flex items-center gap-1.5">
                <span>{ticketData.username || ticketData.name}</span>
                {isVVIP ? (
                  <Gem size={16} className="text-rose-400 shrink-0" />
                ) : isVIP ? (
                  <Crown size={16} className="text-accent-yellow shrink-0" />
                ) : null}
              </div>
              {ticketData.tiktokName && (
                <span className="text-xs text-accent-cyan font-bold">
                  @{ticketData.tiktokName}
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                isVVIP
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
                  : isVIP
                  ? 'bg-accent-yellow/20 text-accent-yellow border-accent-yellow/40'
                  : 'bg-accent-purple/20 text-accent-purple-light border-accent-purple/40'
              }`}>
                {isVVIP ? '💎 VVIP' : (isVIP ? '👑 VIP' : 'Basic')}
              </span>
              <div className="text-[11px] font-mono text-text-muted font-bold mt-1">
                {formatDuration(ticketData.duration)}
              </div>
            </div>
          </div>

          {/* CONDITION 1: JUST FINISHED (Within 5 mins) */}
          {isFinished && (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-accent-green/20 border border-accent-green/40 flex items-center justify-center text-accent-green">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-white m-0">
                  🎉 JOKI BERES! MAKASIH BRO!
                </h3>
                <p className="text-xs text-text-muted mt-1 m-0">
                  Akun kamu sudah selesai dimainkan. Silakan cek akun & ganti password ya!
                </p>
              </div>

              {/* Self-Destruct Warning */}
              <div className="p-3 rounded-2xl bg-accent-orange/10 border border-accent-orange/30 text-accent-orange text-xs font-bold font-mono">
                ⏳ Tiket ditutup otomatis dalam: <strong className="text-white">{formatTime(remainingDestructSeconds)}</strong>
              </div>
            </div>
          )}

          {/* CONDITION 2: ACTIVE BILLING (Running / Paused) */}
          {ticketData.type === 'CUSTOMER' && !ticketData.finished && (
            <div className="space-y-4">
              {/* Status Pill */}
              <div className="text-center">
                <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wide ${
                  isPaused && streamStatus === 'OFFLINE'
                    ? 'bg-accent-purple/20 text-accent-purple-light border border-accent-purple/40'
                    : isPaused 
                    ? 'bg-accent-orange/20 text-accent-orange border border-accent-orange/40' 
                    : 'bg-accent-green/20 text-accent-green border border-accent-green/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    isPaused && streamStatus === 'OFFLINE'
                      ? 'bg-accent-purple-light'
                      : isPaused ? 'bg-accent-orange' : 'bg-accent-green animate-ping'
                  }`} />
                  {isPaused && streamStatus === 'OFFLINE'
                    ? '⏸️ DIJEDA (OFF STREAM)'
                    : isPaused 
                    ? '⏸️ DIJEDA BENTAR' 
                    : '🟢 LAGI DIMAINKAN'}
                </span>
              </div>

              {/* BIG COUNTDOWN BOX */}
              <div className="py-4 px-3 rounded-2xl bg-bg-primary/90 border border-white/10 text-center shadow-inner">
                <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-text-dim mb-1">
                  Sisa Waktu Joki
                </div>
                <div className={`font-mono text-4xl md:text-5xl font-black tracking-tight ${
                  isPaused && streamStatus === 'OFFLINE' 
                    ? 'text-accent-purple-light' 
                    : isPaused ? 'text-accent-orange' : isVVIP ? 'text-rose-400' : 'text-accent-green'
                }`}>
                  {formatTime(remainingSeconds)}
                </div>
                <div className="text-[11px] font-bold text-text-tertiary mt-1.5 flex items-center justify-center gap-1">
                  <span>Slot Bermain:</span>
                  <strong className="text-white font-mono">
                    {ticketData.slot === 'VVIP' ? '💎 VVIP (SUPER PRIORITY)' : (ticketData.slot === 'VIP' ? '👑 VIP' : `SLOT ${ticketData.slot}`)}
                  </strong>
                </div>
              </div>

              {/* Context-Aware Paused Notice (Bocil-Friendly) */}
              {isPaused && (
                <div className={`p-3.5 rounded-2xl text-xs font-medium leading-relaxed border ${
                  streamStatus === 'OFFLINE'
                    ? 'bg-accent-purple/10 border-accent-purple/30 text-text-secondary'
                    : 'bg-accent-orange/10 border-accent-orange/25 text-accent-orange'
                }`}>
                  {streamStatus === 'OFFLINE' ? (
                    <div>
                      <strong className="text-accent-purple-light block mb-0.5">
                        😴 Joki Dijeda Dulu (Streamer Udahan Live)
                      </strong>
                      <span>
                        Waktu joki kamu <strong className="text-accent-green">AMAN BANGET</strong> bro! Streamer lagi istirahat/off stream. Sisa waktu <strong>{formatTime(remainingSeconds)}</strong> bakal langsung dilanjutin pas sesi live streaming berikutnya ya!
                      </span>
                    </div>
                  ) : (
                    <div>
                      ⚠️ <strong>Waktu kamu aman bro!</strong> Streamer lagi menjeda billing sebentar (misal: cek problem/verifikasi akun). Sisa waktu kamu tidak berkurang.
                    </div>
                  )}
                </div>
              )}

              {/* Timing Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5 font-medium">
                <div>
                  <span className="text-text-dim text-[10.5px] block">Mulai Dimainkan:</span>
                  <strong className="text-white font-mono">{formatClock(ticketData.startTime)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-text-dim text-[10.5px] block">Perkiraan Beres:</span>
                  {streamStatus === 'OFFLINE' && isPaused ? (
                    <strong className="text-accent-purple-light font-bold text-[11px] block">
                      {liveState.liveStartTime ? `📅 Besok Jam ${liveState.liveStartTime} WIB` : '📅 Lanjut Next Live'}
                    </strong>
                  ) : (
                    <strong className="text-accent-cyan font-mono">{formatClock(ticketData.endTime)}</strong>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CONDITION 3: IN QUEUE */}
          {ticketData.type === 'QUEUE' && (
            <div className="space-y-4">
              {/* Position Banner */}
              <div className="p-4 rounded-2xl bg-bg-primary/90 border border-white/10 text-center shadow-inner">
                <div className="text-[11px] font-extrabold uppercase tracking-widest text-text-dim mb-1">
                  Urutan Antrean Kamu {isVVIP ? '(VVIP Super Priority)' : isVIP ? '(VIP Priority)' : ''}
                </div>
                <div className={`font-mono text-4xl md:text-5xl font-black tracking-tight ${
                  isVVIP ? 'text-rose-400' : queuePosition === 1 ? 'text-accent-yellow' : 'text-accent-cyan'
                }`}>
                  #{queuePosition}
                </div>
                <div className="text-xs font-bold text-text-secondary mt-1">
                  {streamStatus === 'OFFLINE'
                    ? '😴 Streamer Off Stream (Antrean Kamu Aman)'
                    : queuePosition === 1 
                    ? '🔥 GILIRAN BERIKUTNYA! Siap-siap ya!' 
                    : `Ada ${queuePosition - 1} orang di depan kamu`}
                </div>
              </div>

              {/* Wait Time & Target Slot Prediction */}
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-dim">⏳ Estimasi Waktu Tunggu:</span>
                  <strong className={`font-mono text-sm ${isVVIP ? 'text-rose-400' : 'text-accent-yellow'}`}>
                    {streamStatus === 'OFFLINE' ? 'Saat Live Mulai' : `~${estimatedWaitMinutes} Menit lagi`}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-text-dim">⏱️ Perkiraan Masuk Slot:</span>
                  <strong className="text-white font-mono text-[11.5px]">
                    {estimatedStartTimeStr}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-text-dim">🎰 Target Slot:</span>
                  <strong className={`font-mono ${isVVIP ? 'text-rose-400' : 'text-accent-cyan'}`}>
                    {estimatedSlotName}
                  </strong>
                </div>
              </div>

              {queuePosition === 1 && streamStatus !== 'OFFLINE' && (
                <div className={`p-3 rounded-xl border text-xs font-medium ${
                  isVVIP 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                    : 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                }`}>
                  ⚡ <strong>Siap-siap bro!</strong> Streamer akan segera memasukkan akunmu ke slot live begitu slot kosong.
                </div>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10.5px] text-text-dim">
            <span>🔒 Transaksi Lunas Terverifikasi</span>
            <span>{isVVIP ? '💎 VVIP MEMBER' : isVIP ? '👑 VIP MEMBER' : 'STANDARD'}</span>
          </div>
        </div>

        {/* Action Button: Kembali ke Live Monitor */}
        <Link
          to="/"
          className="w-full py-3 rounded-2xl bg-bg-surface hover:bg-white/5 border border-border-default text-xs font-bold text-center text-text-muted hover:text-white transition-all shadow-md"
        >
          ← Buka Dashboard Live Monitor
        </Link>
      </div>
    </div>
  );
};

export default TicketPage;
