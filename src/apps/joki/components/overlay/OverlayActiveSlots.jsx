import React from 'react';
import { Clock, Play, Pause, Flame, Crown, Diamond, CheckCheck } from 'lucide-react';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getCleanSlot = (c) => {
  if (c.slot !== undefined && c.slot !== null) {
    const parsed = parseInt(String(c.slot).replace(/\D/g, ''), 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 1;
};

const getCleanService = (s) => {
  const norm = String(s || '').toUpperCase();
  if (norm.includes('VVIP')) return 'VVIP';
  if (norm.includes('VIP')) return 'VIP';
  return 'Basic';
};

const OverlayActiveSlots = ({ 
  customers = [], 
  now = Date.now(), 
  theme = 'neon',
  scale = 'normal',
  title = 'BILLING AKTIF LIVE' 
}) => {
  const activeCustomers = customers.filter(c => !c.finished);

  // Theme container styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#18140c]/90 border-amber-500/35 shadow-amber-500/15',
          headerBg: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-300',
          accentText: 'text-amber-400',
          badgeVvip: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeBasic: 'bg-white/10 text-slate-300 border-white/15',
          timeGlow: 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#180c10]/90 border-rose-500/35 shadow-rose-500/15',
          headerBg: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-300',
          accentText: 'text-rose-400',
          badgeVvip: 'bg-rose-600/30 text-rose-200 border-rose-500/50',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeBasic: 'bg-white/10 text-slate-300 border-white/15',
          timeGlow: 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0f1115]/92 border-white/15 shadow-black/40',
          headerBg: 'from-white/10 to-transparent border-white/15 text-slate-200',
          accentText: 'text-cyan-400',
          badgeVvip: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          badgeBasic: 'bg-white/10 text-slate-300 border-white/15',
          timeGlow: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#0b101b]/90 border-cyan-500/30 shadow-cyan-500/15',
          headerBg: 'from-cyan-500/20 to-transparent border-cyan-500/30 text-cyan-300',
          accentText: 'text-cyan-400',
          badgeVvip: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20',
          badgeBasic: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
          timeGlow: 'text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]'
        };
    }
  };

  const t = getThemeStyles();

  const getRemaining = (c) => {
    if (c.paused) return Number(c.remainingAtPause || 0);
    const totalSecs = (Number(c.duration) || 1) * 3600;
    const elapsedSecs = ((now - (c.startTime || now)) / 1000) + (Number(c.pausedDuration) || 0);
    return Math.max(0, totalSecs - elapsedSecs);
  };

  const sortedActive = [...activeCustomers].sort((a, b) => getCleanSlot(a) - getCleanSlot(b));

  return (
    <div className={`w-full font-sans select-none ${scale === 'compact' ? 'text-xs' : scale === 'large' ? 'text-base' : 'text-sm'}`}>
      {/* Header Widget */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-md`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-black tracking-wider text-xs uppercase flex items-center gap-1.5 drop-shadow">
            <Flame size={14} className="text-rose-400" />
            <span>{title}</span>
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/90 border border-white/10">
          {sortedActive.length} Akun Sedang Main
        </span>
      </div>

      {/* Slots Body */}
      <div className={`p-2.5 rounded-b-2xl border-b border-x backdrop-blur-md ${t.cardBg} space-y-2 shadow-2xl`}>
        {sortedActive.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-medium text-xs">
            <Clock size={20} className="mx-auto mb-1.5 opacity-40 animate-spin" />
            <span>Semua slot sedang kosong. Siap terima order joki!</span>
          </div>
        ) : (
          sortedActive.map((customer) => {
            const rem = getRemaining(customer);
            const isFinished = rem <= 0 && !customer.paused;
            const isEnding = rem > 0 && rem <= 300 && !customer.paused;
            const srv = getCleanService(customer.service);
            const slotNum = getCleanSlot(customer);

            return (
              <div 
                key={customer.id || slotNum}
                className={`relative rounded-xl p-2.5 transition-all duration-300 border backdrop-blur-sm ${
                  isFinished 
                    ? 'bg-rose-950/70 border-rose-500/80 shadow-md shadow-rose-950/50' 
                    : isEnding 
                    ? 'bg-rose-950/40 border-rose-500 animate-pulse shadow-lg shadow-rose-600/30' 
                    : customer.paused
                    ? 'bg-amber-950/30 border-amber-500/40'
                    : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  {/* Left: Slot & Username */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border shadow-inner ${
                      isFinished 
                        ? 'bg-rose-600 text-white border-rose-400'
                        : isEnding 
                        ? 'bg-rose-600 text-white border-rose-400' 
                        : 'bg-white/10 text-white border-white/20'
                    }`}>
                      S{slotNum}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-white truncate text-xs drop-shadow">
                          {customer.username || customer.name || 'Pelanggan'}
                        </span>

                        {srv === 'VVIP' ? (
                          <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${t.badgeVvip}`}>
                            <Diamond size={10} />
                            <span>VVIP</span>
                          </span>
                        ) : srv === 'VIP' ? (
                          <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 ${t.badgeVip}`}>
                            <Crown size={10} />
                            <span>VIP</span>
                          </span>
                        ) : null}
                      </div>

                      {customer.tiktokName && (
                        <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                          <span className="text-cyan-400 font-bold">@{customer.tiktokName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Countdown Timer Badge */}
                  <div className="text-right shrink-0">
                    {isFinished ? (
                      <div className="px-2 py-1 rounded-lg bg-rose-600 text-white font-black text-xs border border-rose-400 flex items-center gap-1 shadow-md">
                        <CheckCheck size={13} />
                        <span>HABIS (00:00)</span>
                      </div>
                    ) : customer.paused ? (
                      <div className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-black text-xs border border-amber-500/40 flex items-center gap-1">
                        <Pause size={11} />
                        <span className="font-mono">{formatTime(rem)}</span>
                      </div>
                    ) : (
                      <div className={`px-2 py-0.5 rounded-lg border font-mono font-black text-xs flex items-center gap-1 ${
                        isEnding
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/50'
                          : 'bg-black/50 border-white/10 text-white'
                      }`}>
                        <Play size={10} className={isEnding ? 'text-white' : 'text-emerald-400 fill-emerald-400'} />
                        <span className={isEnding ? 'text-white' : t.timeGlow}>{formatTime(rem)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default OverlayActiveSlots;
