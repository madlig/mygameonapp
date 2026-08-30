import React from 'react';
import { Play, Pause, Flame, Crown, Diamond, CheckCheck, PlusCircle } from 'lucide-react';

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
  layout = 'grid',
  cols = 3,
  totalSlots = 6,
  showEmpty = true,
  title = 'BILLING AKTIF LIVE' 
}) => {
  const activeCustomers = customers.filter(c => !c.finished);

  // Theme container styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#18140c]/95 border-amber-500/40 shadow-amber-500/20',
          headerBg: 'from-amber-500/30 to-amber-950/40 border-amber-500/40 text-amber-300',
          accentText: 'text-amber-400',
          slotBadge: 'bg-gradient-to-br from-amber-400 to-amber-600 text-black border-amber-300',
          badgeVvip: 'bg-rose-500/30 text-rose-200 border-rose-400/60 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/60 font-black',
          badgeBasic: 'bg-white/15 text-slate-200 border-white/25',
          timeBox: 'bg-black/80 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]',
          emptyCard: 'bg-white/[0.02] border-dashed border-white/15 hover:border-amber-500/30 text-slate-400'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#18080c]/95 border-rose-500/40 shadow-rose-500/20',
          headerBg: 'from-rose-600/30 to-rose-950/40 border-rose-500/40 text-rose-300',
          accentText: 'text-rose-400',
          slotBadge: 'bg-gradient-to-br from-rose-500 to-rose-700 text-white border-rose-400',
          badgeVvip: 'bg-rose-500/30 text-rose-100 border-rose-400/60 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/60 font-black',
          badgeBasic: 'bg-white/15 text-slate-200 border-white/25',
          timeBox: 'bg-black/80 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]',
          emptyCard: 'bg-white/[0.02] border-dashed border-white/15 hover:border-rose-500/30 text-slate-400'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0e1015]/95 border-white/20 shadow-black/50',
          headerBg: 'from-white/15 to-transparent border-white/20 text-slate-100',
          accentText: 'text-cyan-400',
          slotBadge: 'bg-gradient-to-br from-slate-700 to-slate-900 text-white border-white/30',
          badgeVvip: 'bg-rose-500/30 text-rose-200 border-rose-400/50 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/50 font-black',
          badgeBasic: 'bg-white/15 text-slate-200 border-white/25',
          timeBox: 'bg-black/80 border-cyan-500/30 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]',
          emptyCard: 'bg-white/[0.02] border-dashed border-white/10 text-slate-500'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#070b14]/95 border-cyan-500/40 shadow-cyan-500/20',
          headerBg: 'from-cyan-500/30 to-purple-950/40 border-cyan-500/40 text-cyan-300',
          accentText: 'text-cyan-400',
          slotBadge: 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-black border-cyan-300 font-black shadow-lg shadow-cyan-500/30',
          badgeVvip: 'bg-rose-500/30 text-rose-100 border-rose-400/60 font-black shadow-rose-500/30',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/60 font-black shadow-amber-500/30',
          badgeBasic: 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40',
          timeBox: 'bg-black/80 border-cyan-400/40 text-cyan-300 shadow-[0_0_14px_rgba(6,182,212,0.4)]',
          emptyCard: 'bg-white/[0.02] border-dashed border-white/15 hover:border-cyan-500/30 text-slate-400'
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

  // Build slot slots array
  const slotMap = {};
  activeCustomers.forEach(c => {
    const s = getCleanSlot(c);
    slotMap[s] = c;
  });

  // Calculate highest slot to display
  const maxSlotNum = Math.max(totalSlots, ...activeCustomers.map(getCleanSlot));
  const slotList = [];
  
  if (showEmpty) {
    for (let i = 1; i <= maxSlotNum; i++) {
      slotList.push({ slotNum: i, customer: slotMap[i] || null });
    }
  } else {
    activeCustomers
      .sort((a, b) => getCleanSlot(a) - getCleanSlot(b))
      .forEach(c => slotList.push({ slotNum: getCleanSlot(c), customer: c }));
  }

  // Grid column classes
  const getGridColsClass = () => {
    if (layout === 'list') return 'grid-cols-1';
    if (cols === 6) return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6';
    if (cols === 4) return 'grid-cols-2 lg:grid-cols-4';
    if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'; // Default 3 cols
  };

  // Scale classes
  const getScaleClasses = () => {
    switch (scale) {
      case '2xl':
        return { text: 'text-lg', titleText: 'text-base', nameText: 'text-lg', timeText: 'text-xl', slotSize: 'w-12 h-12 text-base' };
      case 'xl':
        return { text: 'text-base', titleText: 'text-sm', nameText: 'text-base', timeText: 'text-lg', slotSize: 'w-10 h-10 text-sm' };
      case 'large':
        return { text: 'text-sm', titleText: 'text-xs', nameText: 'text-sm', timeText: 'text-base', slotSize: 'w-9 h-9 text-xs' };
      case 'compact':
        return { text: 'text-xs', titleText: 'text-[11px]', nameText: 'text-xs', timeText: 'text-xs', slotSize: 'w-7 h-7 text-[10px]' };
      case 'normal':
      default:
        return { text: 'text-sm', titleText: 'text-xs', nameText: 'text-sm', timeText: 'text-sm', slotSize: 'w-8 h-8 text-xs' };
    }
  };

  const sc = getScaleClasses();

  return (
    <div className={`w-full font-sans select-none ${sc.text}`}>
      {/* Header Widget */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-lg`}>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shadow-[0_0_10px_#34d399]" />
          <span className={`font-black tracking-wider uppercase flex items-center gap-2 drop-shadow-md text-white ${sc.titleText}`}>
            <Flame size={16} className="text-rose-400 fill-rose-400" />
            <span>{title}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black bg-white/10 px-2.5 py-0.5 rounded-full text-white border border-white/15 shadow-inner">
            {activeCustomers.length} / {maxSlotNum} Slot Terisi
          </span>
        </div>
      </div>

      {/* Slots Body Grid */}
      <div className={`p-3 rounded-b-2xl border-b border-x backdrop-blur-xl ${t.cardBg} shadow-2xl`}>
        <div className={`grid ${getGridColsClass()} gap-2.5`}>
          {slotList.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 font-bold text-sm">
              Semua slot joki sedang kosong. Siap order sekarang!
            </div>
          ) : (
            slotList.map(({ slotNum, customer }) => {
              // 1. EMPTY SLOT CARD
              if (!customer) {
                return (
                  <div 
                    key={`empty-${slotNum}`}
                    className={`rounded-2xl p-3 border transition-all duration-300 flex items-center justify-between gap-3 ${t.emptyCard}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0 bg-white/5 border border-white/10 text-slate-500 font-mono`}>
                        S{slotNum}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-xs font-extrabold text-slate-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>SLOT KOSONG</span>
                        </div>
                        <div className="text-[10px] text-slate-500 truncate font-medium">
                          Chat live untuk isi slot!
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      <PlusCircle size={11} />
                      <span>OPEN</span>
                    </div>
                  </div>
                );
              }

              // 2. ACTIVE SLOT CARD
              const rem = getRemaining(customer);
              const isFinished = rem <= 0 && !customer.paused;
              const isEnding = rem > 0 && rem <= 300 && !customer.paused;
              const srv = getCleanService(customer.service);

              return (
                <div 
                  key={customer.id || slotNum}
                  className={`relative rounded-2xl p-3 transition-all duration-300 border backdrop-blur-md shadow-md ${
                    isFinished 
                      ? 'bg-rose-950/80 border-rose-500/90 shadow-rose-900/40 ring-1 ring-rose-500/50' 
                      : isEnding 
                      ? 'bg-rose-950/60 border-rose-500 animate-pulse shadow-lg shadow-rose-600/40 ring-2 ring-rose-500' 
                      : customer.paused
                      ? 'bg-amber-950/40 border-amber-500/50'
                      : 'bg-white/[0.05] border-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Slot Box & Player Info */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`${sc.slotSize} rounded-xl flex items-center justify-center font-black shrink-0 border shadow-lg ${
                        isFinished || isEnding 
                          ? 'bg-rose-600 text-white border-rose-300' 
                          : t.slotBadge
                      }`}>
                        S{slotNum}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-black text-white truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-tight ${sc.nameText}`}>
                            {customer.username || customer.name || 'Pelanggan'}
                          </span>

                          {srv === 'VVIP' ? (
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 shadow-sm ${t.badgeVvip}`}>
                              <Diamond size={10} />
                              <span>VVIP</span>
                            </span>
                          ) : srv === 'VIP' ? (
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded-md border flex items-center gap-0.5 shadow-sm ${t.badgeVip}`}>
                              <Crown size={10} />
                              <span>VIP</span>
                            </span>
                          ) : null}
                        </div>

                        {customer.tiktokName ? (
                          <div className="text-xs text-cyan-300 font-bold truncate flex items-center gap-1 mt-0.5 drop-shadow">
                            <span>@{customer.tiktokName}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400 font-medium">
                            Paket {srv}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Large Digital Countdown Box */}
                    <div className="text-right shrink-0">
                      {isFinished ? (
                        <div className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-black text-xs border border-rose-300 flex items-center gap-1.5 shadow-lg shadow-rose-600/40">
                          <CheckCheck size={14} />
                          <span>HABIS (00:00)</span>
                        </div>
                      ) : customer.paused ? (
                        <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-200 font-black text-xs border border-amber-500/50 flex items-center gap-1.5 shadow">
                          <Pause size={12} />
                          <span className="font-mono">{formatTime(rem)}</span>
                        </div>
                      ) : (
                        <div className={`px-3 py-1.5 rounded-xl border font-mono font-black flex items-center gap-1.5 tracking-wider ${
                          isEnding
                            ? 'bg-rose-600 text-white border-rose-300 shadow-lg shadow-rose-600/60 animate-bounce'
                            : t.timeBox
                        } ${sc.timeText}`}>
                          <Play size={12} className={isEnding ? 'text-white' : 'text-emerald-400 fill-emerald-400'} />
                          <span>{formatTime(rem)}</span>
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
    </div>
  );
};

export default OverlayActiveSlots;
