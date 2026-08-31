import React from 'react';
import { useJoki, matchCustomerToSlot, formatSlotLabel } from '../../contexts/JokiContext';
import { Play, Pause, Flame, CheckCheck, PlusCircle } from 'lucide-react';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const OverlayActiveSlots = ({ 
  customers = [], 
  now = Date.now(), 
  theme = 'neon',
  scale = 'normal',
  layout = 'grid',
  cols = 3,
  showEmpty = true,
  title = 'BILLING AKTIF LIVE' 
}) => {
  // Context hook if available
  let contextConfiguredSlots = null;
  let contextServices = null;
  try {
    const ctx = useJoki();
    if (ctx) {
      contextConfiguredSlots = ctx.configuredSlots;
      contextServices = ctx.services;
    }
  } catch (_err) {
    // Standalone fallback
  }

  const activeCustomers = customers.filter(c => !c.finished);

  // Theme styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#15120a]/95 border-amber-500/40 shadow-amber-500/15',
          headerBg: 'from-amber-500/30 to-amber-950/40 border-amber-500/40 text-amber-300',
          accentText: 'text-amber-400',
          slotBadgeBasic: 'bg-amber-400 text-black border-amber-300',
          slotBadgeVip: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-amber-300 shadow-md shadow-amber-400/30',
          slotBadgeVvip: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300 shadow-md shadow-rose-500/30',
          timeBox: 'bg-black/70 border-amber-500/40 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]',
          emptyCard: 'bg-black/30 border-dashed border-white/15 hover:border-amber-500/30 text-slate-400'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#15070a]/95 border-rose-500/40 shadow-rose-500/15',
          headerBg: 'from-rose-600/30 to-rose-950/40 border-rose-500/40 text-rose-300',
          accentText: 'text-rose-400',
          slotBadgeBasic: 'bg-rose-500 text-white border-rose-400',
          slotBadgeVip: 'bg-amber-400 text-black border-amber-300',
          slotBadgeVvip: 'bg-rose-600 text-white border-rose-300 shadow-md shadow-rose-600/40',
          timeBox: 'bg-black/70 border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]',
          emptyCard: 'bg-black/30 border-dashed border-white/15 hover:border-rose-500/30 text-slate-400'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0d0f14]/95 border-white/20 shadow-black/50',
          headerBg: 'from-white/15 to-transparent border-white/20 text-slate-100',
          accentText: 'text-cyan-400',
          slotBadgeBasic: 'bg-slate-700 text-white border-white/30',
          slotBadgeVip: 'bg-amber-400 text-black border-amber-300',
          slotBadgeVvip: 'bg-rose-500 text-white border-rose-300',
          timeBox: 'bg-black/70 border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.2)]',
          emptyCard: 'bg-black/30 border-dashed border-white/10 text-slate-500'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#060913]/95 border-cyan-500/40 shadow-cyan-500/15',
          headerBg: 'from-cyan-500/30 to-purple-950/40 border-cyan-500/40 text-cyan-300',
          accentText: 'text-cyan-400',
          slotBadgeBasic: 'bg-cyan-400 text-black border-cyan-300 shadow-md shadow-cyan-400/30',
          slotBadgeVip: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-black border-amber-300 shadow-md shadow-amber-400/30',
          slotBadgeVvip: 'bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-300 shadow-md shadow-rose-500/30',
          timeBox: 'bg-black/70 border-cyan-400/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]',
          emptyCard: 'bg-black/30 border-dashed border-white/15 hover:border-cyan-500/30 text-slate-400'
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

  // Build slot definitions list
  const slotDefs = (contextConfiguredSlots && contextConfiguredSlots.length > 0)
    ? contextConfiguredSlots
    : [
        { key: '1', displayLabel: 'SLOT 1 Basic', tier: 'Basic' },
        { key: '2', displayLabel: 'SLOT 2 Basic', tier: 'Basic' },
        { key: '3', displayLabel: 'SLOT 3 Basic', tier: 'Basic' },
        { key: '4', displayLabel: 'SLOT 4 Basic', tier: 'Basic' },
        { key: 'VIP 1', displayLabel: 'SLOT VIP 1', tier: 'VIP' },
        { key: 'VIP 2', displayLabel: 'SLOT VIP 2', tier: 'VIP' },
        { key: 'VVIP 1', displayLabel: 'SLOT VVIP 1', tier: 'VVIP' }
      ];

  const slotCards = [];
  slotDefs.forEach((slotDef) => {
    const customer = activeCustomers.find(c => matchCustomerToSlot(c, slotDef));
    if (customer || showEmpty) {
      slotCards.push({ slotDef, customer: customer || null });
    }
  });

  // Grid column classes
  const getGridColsClass = () => {
    if (layout === 'list') return 'grid-cols-1';
    if (cols === 6) return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6';
    if (cols === 2) return 'grid-cols-1 sm:grid-cols-2';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'; // Default 3 cols
  };

  const scaleClass = scale === '2xl' ? 'text-base' : scale === 'xl' ? 'text-sm' : scale === 'compact' ? 'text-xs' : 'text-sm';

  return (
    <div className={`w-full font-sans select-none ${scaleClass}`}>
      {/* Header Widget */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-lg`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
          <span className="font-black tracking-wider uppercase flex items-center gap-1.5 drop-shadow-md text-white text-xs">
            <Flame size={15} className="text-rose-400 fill-rose-400" />
            <span>{title}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-black bg-white/10 px-2 py-0.5 rounded-full text-white border border-white/15 shadow-inner">
            {activeCustomers.length} / {slotDefs.length} Slot Terisi
          </span>
        </div>
      </div>

      {/* Slots Body Grid */}
      <div className={`p-2.5 rounded-b-2xl border-b border-x backdrop-blur-xl ${t.cardBg} shadow-2xl`}>
        <div className={`grid ${getGridColsClass()} gap-2`}>
          {slotCards.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-400 font-bold text-xs">
              Semua slot joki sedang kosong. Siap order sekarang!
            </div>
          ) : (
            slotCards.map(({ slotDef, customer }) => {
              const isVvip = slotDef.tier === 'VVIP';
              const isVip = slotDef.tier === 'VIP';
              const badgeStyle = isVvip ? t.slotBadgeVvip : isVip ? t.slotBadgeVip : t.slotBadgeBasic;

              // 1. EMPTY SLOT CARD (Clean Structured Stacked Layout)
              if (!customer) {
                return (
                  <div 
                    key={`empty-${slotDef.key}`}
                    className={`rounded-2xl p-2.5 border transition-all duration-300 flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden ${t.emptyCard}`}
                  >
                    {/* Top Row: Slot Pill + OPEN Badge */}
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <span className={`whitespace-nowrap shrink-0 px-2 py-0.5 rounded-lg font-mono font-black text-[11px] leading-none inline-flex items-center border shadow-sm ${badgeStyle}`}>
                        {slotDef.displayLabel}
                      </span>
                      <span className="whitespace-nowrap shrink-0 ml-auto px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 leading-none">
                        <PlusCircle size={10} />
                        <span>OPEN</span>
                      </span>
                    </div>

                    {/* Bottom Content */}
                    <div className="pt-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-300 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <span className="truncate">SLOT KOSONG</span>
                      </div>
                      <div className="text-[10.5px] text-slate-400 truncate font-medium mt-0.5">
                        Chat live untuk isi slot!
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. ACTIVE SLOT CARD (Structured 2-Row Stacked Layout: Never overflows!)
              const rem = getRemaining(customer);
              const isFinished = rem <= 0 && !customer.paused;
              const isEnding = rem > 0 && rem <= 300 && !customer.paused;

              return (
                <div 
                  key={customer.id || slotDef.key}
                  className={`relative rounded-2xl p-2.5 transition-all duration-300 border backdrop-blur-md shadow-md flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden ${
                    isFinished 
                      ? 'bg-rose-950/80 border-rose-500/90 shadow-rose-900/40 ring-1 ring-rose-500/50' 
                      : isEnding 
                      ? 'bg-rose-950/60 border-rose-500 animate-pulse shadow-lg shadow-rose-600/40 ring-2 ring-rose-500' 
                      : customer.paused
                      ? 'bg-amber-950/40 border-amber-500/50'
                      : 'bg-white/[0.04] border-white/15 hover:border-white/25'
                  }`}
                >
                  {/* Row 1: Header (Slot Label on Left, Countdown on Right) */}
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`whitespace-nowrap shrink-0 px-2 py-0.5 rounded-lg font-black text-[11px] font-mono border shadow leading-none inline-flex items-center ${
                        isFinished || isEnding 
                          ? 'bg-rose-600 text-white border-rose-300' 
                          : badgeStyle
                      }`}>
                        {slotDef.displayLabel || formatSlotLabel(customer.slot, customer.service, contextServices)}
                      </span>
                    </div>

                    {/* Timer Box */}
                    <div className="shrink-0 ml-auto">
                      {isFinished ? (
                        <div className="whitespace-nowrap px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[10.5px] border border-rose-300 flex items-center gap-1 shadow leading-none">
                          <CheckCheck size={11} />
                          <span>HABIS</span>
                        </div>
                      ) : customer.paused ? (
                        <div className="whitespace-nowrap px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-200 font-black text-[10.5px] border border-amber-500/50 flex items-center gap-1 font-mono leading-none">
                          <Pause size={10} />
                          <span>{formatTime(rem)}</span>
                        </div>
                      ) : (
                        <div className={`whitespace-nowrap px-2 py-0.5 rounded-lg border font-mono font-black text-[11px] flex items-center gap-1 tracking-wider leading-none ${
                          isEnding
                            ? 'bg-rose-600 text-white border-rose-300 shadow-md shadow-rose-600/60 animate-bounce'
                            : t.timeBox
                        }`}>
                          <Play size={10} className={isEnding ? 'text-white' : 'text-emerald-400 fill-emerald-400'} />
                          <span>{formatTime(rem)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Customer Identity (Full Width Username & TikTok) */}
                  <div className="min-w-0 pt-0.5">
                    <div className="font-black text-white truncate text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] tracking-tight block w-full">
                      {customer.username || customer.name || 'Pelanggan'}
                    </div>

                    {customer.tiktokName ? (
                      <div className="text-[10.5px] text-cyan-300 font-bold truncate mt-0.5 drop-shadow flex items-center gap-1 block w-full">
                        <span>@{customer.tiktokName}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 font-medium truncate block w-full">
                        Paket {customer.service || slotDef.serviceName || 'Basic'}
                      </div>
                    )}
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
