import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../../config/firebaseConfig';
import { 
  collection, 
  onSnapshot,
  doc
} from 'firebase/firestore';
import { 
  Gamepad2, 
  Crown, 
  AlertCircle, 
  CheckCircle2, 
  Coffee,
  Moon,
  Gem,
  Bell,
  BellRing,
  Lock
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

// Web Audio API Synthesizer Chime (Works 100% offline & without external audio files)
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, now);
    osc.frequency.setValueAtTime(783.99, now + 0.12);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.5);
  } catch (err) {
    console.warn('Audio chime warning:', err);
  }
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

  // Notification State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem(`notify_${searchTicketId}`) === 'true';
  });

  // Track state transitions for smart notifications
  const prevTypeRef = useRef(null);
  const prevLiveStatusRef = useRef(null);
  const prevPausedRef = useRef(null);
  const prevFinishedRef = useRef(null);

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

  // Request & Toggle Notifications
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setNotificationsEnabled(true);
          localStorage.setItem(`notify_${searchTicketId}`, 'true');
          playNotificationChime();
          new Notification('🔔 Pengingat Tiket Aktif!', {
            body: 'Kamu akan mendapat pemberitahuan saat giliran main tiba, live dimulai, atau joki selesai.',
            icon: '/favicon.ico'
          });
        }
      } else {
        setNotificationsEnabled(true);
        localStorage.setItem(`notify_${searchTicketId}`, 'true');
        playNotificationChime();
      }
    } else {
      setNotificationsEnabled(false);
      localStorage.setItem(`notify_${searchTicketId}`, 'false');
    }
  };

  // Helper to trigger browser notification & chime
  const notifyCustomer = (title, body) => {
    playNotificationChime();
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' });
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Compute Live Status
  const liveState = computeLiveStatus(workspaceSettings, activeCustomers);
  const streamStatus = liveState.status;
  const nextSchedule = liveState.subtext || '';

  // Active Billing calculations (always computed before hook returns)
  const isFinished = ticketData ? (ticketData.finished || ticketData.isPendingClearance) : false;
  const isPaused = ticketData?.type === 'CUSTOMER' && !ticketData.finished ? Boolean(ticketData.paused) : false;
  const remainingSeconds = (ticketData?.type === 'CUSTOMER' && !ticketData.finished)
    ? (isPaused ? Math.max(0, ticketData.remainingAtPause || 0) : Math.max(0, Math.floor((ticketData.endTime - now) / 1000)))
    : 0;

  // State Transition Notifications Effect (Hook declared unconditionally at top level)
  useEffect(() => {
    if (!notificationsEnabled || !ticketData) return;

    // 1. Turned from Queue into Active Billing
    if (prevTypeRef.current === 'QUEUE' && ticketData.type === 'CUSTOMER') {
      notifyCustomer('🎮 Giliran Dimainkan!', 'Yey, akun Roblox kamu sekarang sedang dimainkan di live!');
    }

    // 2. Streamer started live stream
    if (prevLiveStatusRef.current === 'OFFLINE' && streamStatus === 'LIVE') {
      notifyCustomer('🔴 Streamer Sedang Live!', 'Streamer sekarang sedang LIVE streaming! Yuk tonton sekarang!');
    }

    // 3. Paused / Break transition
    if (prevPausedRef.current === false && isPaused === true) {
      if (streamStatus === 'OFFLINE') {
        notifyCustomer('😴 Streamer Selesai Live', 'Streamer sudah off live. Sisa waktu joki kamu aman tersimpan untuk live berikutnya!');
      } else {
        notifyCustomer('☕ Streamer Istirahat', 'Streamer lagi jeda sebentar. Sisa waktu joki kamu aman terjeda.');
      }
    }

    // 4. Finished Billing
    if (prevFinishedRef.current === false && (isFinished || (remainingSeconds <= 0 && ticketData.type === 'CUSTOMER'))) {
      notifyCustomer('🎉 Joki Roblox Selesai!', 'Akun Roblox kamu sudah selesai dimainkan! Selamat have fun di Roblox!');
    }

    prevTypeRef.current = ticketData.type;
    prevLiveStatusRef.current = streamStatus;
    prevPausedRef.current = isPaused;
    prevFinishedRef.current = isFinished;
  }, [ticketData?.type, streamStatus, isPaused, isFinished, remainingSeconds, notificationsEnabled, ticketData]);

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
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="w-14 h-14 rounded-3xl bg-accent-red/15 border border-accent-red/30 flex items-center justify-center text-accent-red mb-3">
          <AlertCircle size={30} />
        </div>
        <h2 className="text-lg font-black text-white m-0">Tiket Tidak Ditemukan</h2>
        <p className="text-xs text-text-muted max-w-xs mt-1.5 mb-5">
          Tiket ID <strong className="text-accent-cyan">#{searchTicketId}</strong> tidak ditemukan atau sudah selesai & otomatis terhapus demi keamanan.
        </p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-xl bg-accent-cyan text-bg-primary font-black text-xs hover:bg-accent-cyan-light transition-all shadow-lg"
        >
          Lihat Live Monitor
        </Link>
      </div>
    );
  }

  // Self-Destruct Timer (5 Minutes after finish)
  const finishTimestamp = ticketData?.finishedTime || ticketData?.endTime || (ticketData?.finished ? (ticketData?.createdAt || Date.now()) : 0);
  const destructDeadline = finishTimestamp ? (finishTimestamp + (5 * 60 * 1000)) : 0;
  const remainingDestructSeconds = finishTimestamp ? Math.max(0, Math.floor((destructDeadline - now) / 1000)) : 0;
  const isSelfDestructed = isFinished && finishTimestamp > 0 && remainingDestructSeconds <= 0;

  // Expired / Self-Destructed Screen (Immediately inaccessible when 5 mins expire)
  if (isSelfDestructed) {
    return (
      <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-4 text-center select-none font-sans animate-[fadeIn_0.3s_ease]">
        <div className="w-full max-w-[400px] p-6 sm:p-7 rounded-3xl bg-bg-surface border border-white/10 shadow-2xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-1">
            <Lock size={28} />
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10.5px] font-mono font-black uppercase tracking-wider inline-block mb-2">
              TIKET KADALUARSA
            </span>
            <h2 className="text-lg font-black text-white m-0 tracking-tight">
              Akses Tiket Telah Ditutup
            </h2>
            <p className="text-xs text-text-secondary mt-1.5 leading-relaxed m-0">
              Tiket <strong className="text-accent-cyan font-mono">#{searchTicketId}</strong> sudah selesai dan otomatis dihapus demi menjaga kerahasiaan & keamanan akun Roblox kamu.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-white font-bold">
              <span>🛡️ Proteksi Keamanan Otomatis:</span>
            </div>
            <div>• Data sesi dan akun joki telah dimusnahkan.</div>
            <div>• Terima kasih telah mempercayakan joki di live streaming kami!</div>
          </div>

          <Link
            to="/"
            className="w-full py-2.5 rounded-2xl bg-accent-cyan hover:bg-accent-cyan-light text-bg-primary font-black text-xs transition-all shadow-lg shadow-accent-cyan/20 block text-center"
          >
            Buka Live Monitor
          </Link>
        </div>
      </div>
    );
  }

  // Service Tier helpers
  const getCustomerTier = (c) => {
    if (!c) return 'Basic';
    const sStr = String(c.slot || '').toUpperCase();
    const srv = String(c.service || '').toUpperCase();
    if (sStr.includes('VVIP') || srv.includes('VVIP')) return 'VVIP';
    if (sStr.includes('VIP') || srv.includes('VIP')) return 'VIP';
    return 'Basic';
  };

  const myTier = getCustomerTier(ticketData);
  const isVVIP = myTier === 'VVIP';
  const isVIP = myTier === 'VIP';
  const streamerName = workspaceInfo?.name || 'Kadal Gaming';

  // Queue Calculations (If in Queue)
  let queuePosition = 1;
  let totalWaitSeconds = 0;
  let estimatedSlotName = isVVIP ? 'SLOT VVIP' : isVIP ? 'SLOT VIP' : 'SLOT Basic';
  let estimatedStartTimeStr = '--:--';

  if (ticketData.type === 'QUEUE') {
    // 1. Filter subQueue strictly by tier
    const subQueue = queueList.filter(q => getCustomerTier(q) === myTier);
    const myIndex = subQueue.findIndex(q => (q.id === ticketData.id || (q.ticketId && q.ticketId === ticketData.ticketId)));
    queuePosition = myIndex >= 0 ? myIndex + 1 : 1;

    // 2. Active customers running in this tier
    const activeInTier = activeCustomers.filter(c => !c.finished && getCustomerTier(c) === myTier);

    // 3. Number of slots allocated to this tier
    const customServices = workspaceSettings?.services;
    const tierSrv = Array.isArray(customServices) 
      ? customServices.find(s => s.tier === myTier && s.enabled)
      : null;
    const tierSlotCapacity = Math.max(1, Number(tierSrv?.slotCount) || (myTier === 'VVIP' ? 1 : myTier === 'VIP' ? 2 : 4));

    if (streamStatus === 'OFFLINE') {
      totalWaitSeconds = 0;
      estimatedSlotName = isVVIP ? 'SLOT VVIP' : (isVIP ? 'SLOT VIP' : 'Slot Live');
      estimatedStartTimeStr = liveState.liveStartTime ? `Pukul ${liveState.liveStartTime} WIB` : 'Sesi Live Berikutnya';
    } else {
      // 4. Build slot availability pool (timestamps when each slot becomes free)
      const slotPool = [];
      activeInTier.forEach(c => {
        let finishTs = c.endTime || now;
        if (c.paused) {
          const remAtPause = Number(c.remainingAtPause || 0);
          finishTs = now + (remAtPause * 1000);
        }
        finishTs = Math.max(now, finishTs);
        slotPool.push({
          availableAt: finishTs,
          slotLabel: c.slot ? (String(c.slot).toUpperCase().includes('SLOT') ? c.slot : `SLOT ${c.slot}`) : null
        });
      });

      // Add currently empty/unoccupied slots (available right now)
      const emptyCount = tierSlotCapacity - activeInTier.length;
      for (let i = 0; i < emptyCount; i++) {
        slotPool.push({
          availableAt: now,
          slotLabel: isVVIP ? 'SLOT VVIP' : isVIP ? 'SLOT VIP' : `SLOT ${activeInTier.length + i + 1}`
        });
      }

      if (slotPool.length === 0) {
        slotPool.push({
          availableAt: now,
          slotLabel: isVVIP ? 'SLOT VVIP' : isVIP ? 'SLOT VIP' : 'SLOT 1'
        });
      }

      // Sort slots from earliest available to latest
      slotPool.sort((a, b) => a.availableAt - b.availableAt);

      // 5. Simulate queue processing for customers ahead of this ticket
      const precedingQueue = myIndex > 0 ? subQueue.slice(0, myIndex) : [];
      precedingQueue.forEach(qAhead => {
        const earliestSlot = slotPool.shift();
        const startTs = Math.max(now, earliestSlot.availableAt);
        const durHours = Number(qAhead.duration || 1);
        const releaseTs = startTs + (durHours * 3600 * 1000);
        slotPool.push({
          availableAt: releaseTs,
          slotLabel: earliestSlot.slotLabel
        });
        slotPool.sort((a, b) => a.availableAt - b.availableAt);
      });

      // 6. Next available slot is assigned to this customer!
      const myAssignedSlot = slotPool.length > 0 ? slotPool[0] : { availableAt: now, slotLabel: null };
      const mySlotAvailableTime = myAssignedSlot.availableAt;
      totalWaitSeconds = Math.max(0, Math.floor((mySlotAvailableTime - now) / 1000));

      if (totalWaitSeconds <= 60) {
        estimatedStartTimeStr = 'Segera (Giliran Anda!)';
      } else {
        estimatedStartTimeStr = formatClock(mySlotAvailableTime);
      }

      estimatedSlotName = myAssignedSlot.slotLabel || (isVVIP ? 'SLOT VVIP' : isVIP ? 'SLOT VIP' : 'SLOT Basic');
    }
  }

  const totalBillingSeconds = Math.max(1, Math.round(Number(ticketData.duration || 1) * 3600));
  const ringProgress = Math.min(1, Math.max(0, remainingSeconds / totalBillingSeconds));
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 68; // r=68 => ~427.25

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-4 py-6 select-none font-sans">
      <div className="w-full max-w-[420px] flex flex-col gap-3">
        
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

          <div className="flex items-center gap-1.5">
            {/* Notify Me Button */}
            <button
              type="button"
              onClick={handleToggleNotifications}
              title={notificationsEnabled ? 'Pengingat Notifikasi Aktif' : 'Aktifkan Pengingat Notifikasi'}
              className={`p-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                notificationsEnabled
                  ? 'bg-accent-green/20 text-accent-green border-accent-green/40 shadow-sm'
                  : 'bg-white/5 text-text-dim hover:text-white border-white/10 hover:bg-white/10'
              }`}
            >
              {notificationsEnabled ? <BellRing size={13} className="animate-bounce" /> : <Bell size={13} />}
              <span className="text-[10px] hidden sm:inline">{notificationsEnabled ? 'Notif Aktif' : 'Ingatkan Aku'}</span>
            </button>

            <span className="font-mono text-xs font-black px-2 py-1 rounded-xl bg-white/5 border border-border-default text-accent-cyan">
              #{ticketData.ticketId || `JK-${ticketData.id.slice(-5)}`}
            </span>
          </div>
        </div>

        {/* Streamer Broadcast / Schedule Banner (Context-Aware) */}
        {streamStatus === 'LIVE' ? (
          <div className="p-2.5 rounded-2xl bg-gradient-to-r from-accent-red/20 to-accent-purple/20 border border-accent-red/40 flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-red shrink-0 animate-ping" />
              <div className="text-xs font-black text-white truncate">
                🔴 Streamer Sedang LIVE STREAM!
              </div>
            </div>
            <Link
              to="/"
              className="text-[10.5px] font-black px-3 py-1 rounded-xl bg-accent-red hover:bg-accent-red/90 text-white shrink-0 shadow transition-transform active:scale-95"
            >
              Nonton Live
            </Link>
          </div>
        ) : streamStatus === 'BREAK' ? (
          <div className="p-2.5 rounded-2xl bg-accent-orange/15 border border-accent-orange/35 flex items-center gap-2 text-accent-orange text-xs font-bold">
            <Coffee size={14} className="shrink-0" />
            <span>Streamer lagi istirahat sebentar. Joki segera dilanjutkan!</span>
          </div>
        ) : (
          <div className="p-2.5 rounded-2xl bg-bg-surface border border-border-default flex flex-col gap-0.5 text-xs">
            <div className="flex items-center gap-1.5 text-text-muted font-bold">
              <Moon size={13} className="text-accent-purple-light" />
              <span>Status Streamer: <strong>Off Stream</strong></span>
            </div>
            <p className="text-[11px] text-text-dim m-0 leading-relaxed">
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
        <div className={`rounded-3xl p-5 sm:p-6 border-2 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
          isVVIP
            ? 'bg-gradient-to-b from-[#211116] to-[#121318] border-rose-500/50 shadow-rose-500/10'
            : isVIP
            ? 'bg-gradient-to-b from-[#181611] to-[#121318] border-accent-yellow/40 shadow-accent-yellow/5'
            : 'bg-gradient-to-b from-[#14151f] to-[#0f1015] border-accent-cyan/30 shadow-accent-cyan/5'
        }`}>

          {/* User Profile Header */}
          <div className="flex items-start justify-between pb-3.5 mb-3.5 border-b border-white/10 gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-wider text-text-dim mb-0.5">
                CUSTOMER ROBLOX
              </div>
              <div className="text-lg font-black text-white tracking-tight truncate flex items-center gap-1.5">
                <span className="truncate">{ticketData.username || ticketData.name}</span>
                {isVVIP ? (
                  <Gem size={16} className="text-rose-400 shrink-0" />
                ) : isVIP ? (
                  <Crown size={16} className="text-accent-yellow shrink-0" />
                ) : null}
              </div>
              {ticketData.tiktokName && (
                <div className="text-xs text-accent-cyan font-bold truncate">
                  @{ticketData.tiktokName.replace(/^@/, '')}
                </div>
              )}
            </div>

            <div className="text-right shrink-0 flex flex-col items-end">
              <span className={`inline-block px-2.5 py-0.5 rounded-xl text-[11px] font-black uppercase tracking-wider border shadow-sm ${
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
            <div className="text-center py-3 space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-green/20 border border-accent-green/40 flex items-center justify-center text-accent-green">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <h3 className="text-base font-black text-white m-0">
                  🎉 YEY JOKI BERES!
                </h3>
                <p className="text-xs text-text-secondary mt-1 m-0 leading-relaxed">
                  Akun kamu sudah selesai dijoki di live streamer. Makasih banyak ya dan have fun seru-seruan di Roblox! ✨🎮
                </p>
              </div>

              {/* Reassuring Self-Destruct Notice */}
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono space-y-1">
                <div className="text-[10.5px] text-text-dim font-sans flex items-center justify-center gap-1">
                  <Lock size={11} className="text-accent-cyan" />
                  <span>Tiket terhapus otomatis demi keamanan:</span>
                </div>
                <div className="text-sm font-black text-accent-cyan">
                  ⏳ {formatTime(remainingDestructSeconds)}
                </div>
              </div>
            </div>
          )}

          {/* CONDITION 2: ACTIVE BILLING (Radial Cooldown Ring) */}
          {ticketData.type === 'CUSTOMER' && !isFinished && (
            <div className="space-y-3">
              {/* Status Pill */}
              <div className="text-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wide ${
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

              {/* RADIAL COOLDOWN RING (SVG Circular Timer) */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    {/* Background Track */}
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      fill="transparent"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="9"
                    />
                    {/* Depleting Active Cooldown Ring */}
                    <circle
                      cx="80"
                      cy="80"
                      r="68"
                      fill="transparent"
                      stroke={
                        isPaused && streamStatus === 'OFFLINE'
                          ? '#c084fc'
                          : isPaused
                          ? '#f97316'
                          : isVVIP
                          ? '#f43f5e'
                          : isVIP
                          ? '#eab308'
                          : '#06b6d4'
                      }
                      strokeWidth="9"
                      strokeDasharray={CIRCLE_CIRCUMFERENCE}
                      strokeDashoffset={CIRCLE_CIRCUMFERENCE * (1 - ringProgress)}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>

                  {/* Inside Center Details */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-dim">
                      Sisa Waktu
                    </span>
                    <span className={`font-mono text-3xl font-black tracking-tight mt-0.5 ${
                      isPaused && streamStatus === 'OFFLINE' 
                        ? 'text-accent-purple-light' 
                        : isPaused ? 'text-accent-orange' : isVVIP ? 'text-rose-400' : 'text-white'
                    }`}>
                      {formatTime(remainingSeconds)}
                    </span>
                    <span className="text-[10px] font-bold text-text-muted mt-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 font-mono">
                      {ticketData.slot === 'VVIP' ? '💎 SLOT VVIP' : (ticketData.slot === 'VIP' ? '👑 SLOT VIP' : `SLOT ${ticketData.slot || '1'}`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Context-Aware Paused Notice (Child-Friendly & Calm) */}
              {isPaused && (
                <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed border ${
                  streamStatus === 'OFFLINE'
                    ? 'bg-accent-purple/10 border-accent-purple/30 text-text-secondary'
                    : 'bg-accent-orange/10 border-accent-orange/25 text-accent-orange'
                }`}>
                  {streamStatus === 'OFFLINE' ? (
                    <div>
                      <strong className="text-accent-purple-light block mb-0.5">
                        😴 Joki Dijeda Dulu (Streamer Sedang Off Live)
                      </strong>
                      <span>
                        Waktu joki kamu <strong className="text-accent-green">aman tersimpan</strong> ya! Sisa waktu <strong>{formatTime(remainingSeconds)}</strong> akan otomatis dilanjutkan pas sesi live berikutnya.
                      </span>
                    </div>
                  ) : (
                    <div>
                      ⚠️ <strong>Waktu joki kamu aman!</strong> Streamer lagi istirahat atau jeda billing sebentar. Sisa waktu tidak berkurang.
                    </div>
                  )}
                </div>
              )}

              {/* Timing Details */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-white/[0.02] p-2.5 rounded-xl border border-white/5 font-medium">
                <div>
                  <span className="text-text-dim text-[10px] block">Mulai Dimainkan:</span>
                  <strong className="text-white font-mono">{formatClock(ticketData.startTime)}</strong>
                </div>
                <div className="text-right">
                  <span className="text-text-dim text-[10px] block">Perkiraan Beres:</span>
                  {streamStatus === 'OFFLINE' && isPaused ? (
                    <strong className="text-accent-purple-light font-bold text-[11px] block">
                      {liveState.liveStartTime ? `📅 Jam ${liveState.liveStartTime} WIB` : '📅 Lanjut Next Live'}
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
            <div className="space-y-3">
              {/* Position Banner */}
              <div className="p-3.5 rounded-2xl bg-bg-primary/90 border border-white/10 text-center shadow-inner">
                <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-text-dim mb-0.5">
                  Urutan Antrean Kamu {isVVIP ? '(VVIP Super Priority)' : isVIP ? '(VIP Priority)' : ''}
                </div>
                <div className={`font-mono text-4xl font-black tracking-tight ${
                  isVVIP ? 'text-rose-400' : queuePosition === 1 ? 'text-accent-yellow' : 'text-accent-cyan'
                }`}>
                  #{queuePosition}
                </div>
                <div className="text-xs font-bold text-text-secondary mt-0.5">
                  {streamStatus === 'OFFLINE'
                    ? '😴 Streamer Off Stream (Antrean Kamu Aman)'
                    : queuePosition === 1 
                    ? '🔥 GILIRAN BERIKUTNYA! Siap-siap ya!' 
                    : `Ada ${queuePosition - 1} akun di depan kamu`}
                </div>
              </div>

              {/* Wait Time & Target Slot Prediction */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-text-dim">⏳ Estimasi Waktu Tunggu:</span>
                  <strong className={`font-mono text-sm ${isVVIP ? 'text-rose-400' : 'text-accent-yellow'}`}>
                    {streamStatus === 'OFFLINE' 
                      ? 'Saat Live Mulai' 
                      : totalWaitSeconds <= 60
                      ? 'Segera (Giliran Anda!)'
                      : `~${formatDuration(totalWaitSeconds / 3600)} lagi`}
                  </strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-text-dim">⏱️ Perkiraan Masuk Slot:</span>
                  <strong className="text-white font-mono text-[11px]">
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
                <div className={`p-2.5 rounded-xl border text-xs font-medium ${
                  isVVIP 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                    : 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                }`}>
                  ⚡ <strong>Siap-siap ya!</strong> Streamer akan segera memasukkan akunmu begitu slot live kosong.
                </div>
              )}
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10.5px] text-text-dim">
            <span>🔒 Transaksi Lunas Terverifikasi</span>
            <span className="font-bold">{isVVIP ? '💎 VVIP MEMBER' : isVIP ? '👑 VIP MEMBER' : 'STANDARD'}</span>
          </div>
        </div>

        {/* Action Button: Kembali ke Live Monitor */}
        <Link
          to="/"
          className="w-full py-2.5 rounded-2xl bg-bg-surface hover:bg-white/5 border border-border-default text-xs font-bold text-center text-text-muted hover:text-white transition-all shadow-md"
        >
          ← Buka Dashboard Live Monitor
        </Link>
      </div>
    </div>
  );
};

export default TicketPage;
