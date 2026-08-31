import React from 'react';
import { useJoki, matchCustomerToSlot, formatSlotLabel } from '../../contexts/JokiContext';
import { Play, Pause, Flame, CheckCheck, PlusCircle, Crown, Gem } from 'lucide-react';

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
  theme = 'gold',
  scale = 'xl',
  layout = 'grid',
  cols = 3,
  showEmpty = true,
  title = 'BILLING AKTIF LIVE' 
}) => {
  let contextConfiguredSlots = null;
  let contextServices = null;
  try {
    const ctx = useJoki();
    if (ctx) {
      contextConfiguredSlots = ctx.configuredSlots;
      contextServices = ctx.services;
    }
  } catch (_err) {
    // fallback
  }

  const activeCustomers = customers.filter(c => !c.finished);

  // Overall Theme Container Styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#0a0804]/95 border-2 border-amber-500/50 shadow-amber-500/20',
          headerBg: 'from-amber-500/40 via-amber-900/40 to-black/70 border-amber-500/50 text-amber-300',
          accentText: 'text-amber-400',
          timeBox: 'bg-black/90 border border-amber-500/60 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#0c0306]/95 border-2 border-rose-500/50 shadow-rose-500/20',
          headerBg: 'from-rose-600/40 via-rose-950/40 to-black/70 border-rose-500/50 text-rose-300',
          accentText: 'text-rose-400',
          timeBox: 'bg-black/90 border border-rose-500/60 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.35)]'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#08090d]/95 border-2 border-white/30 shadow-black/70',
          headerBg: 'from-white/20 via-slate-900/40 to-black/70 border-white/30 text-slate-100',
          accentText: 'text-cyan-400',
          timeBox: 'bg-black/90 border border-cyan-500/50 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#03060f]/95 border-2 border-cyan-500/50 shadow-cyan-500/20',
          headerBg: 'from-cyan-500/40 via-purple-950/40 to-black/70 border-cyan-500/50 text-cyan-300',
          accentText: 'text-cyan-400',
          timeBox: 'bg-black/90 border border-cyan-400/60 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)]'
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

  // Build slot definitions list from context or fallback
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

  const scaleClass = scale === 'ultra' 
    ? 'text-base' 
    : scale === '2xl' 
    ? 'text-sm' 
    : scale === 'compact' 
    ? 'text-xs' 
    : 'text-sm';

  return (
    <div className={`w-full font-sans select-none ${scaleClass}`}>
      {/* Header Widget */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-lg`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_8px_#34d399]" />
          <span className="font-black tracking-wider uppercase flex items-center gap-1.5 drop-shadow-md text-white text-xs">
            <Flame size={15} className="text-rose-400 fill-rose-400" />
            <span>{title}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black bg-white/15 px-2.5 py-0.5 rounded-full text-white border border-white/25 shadow-inner">
            {activeCustomers.length} / {slotDefs.length} Slot Terisi
          </span>
        </div>
      </div>

      {/* Slots Body Grid */}
      <div className={`p-3 rounded-b-2xl border-b border-x backdrop-blur-xl ${t.cardBg} shadow-2xl`}>
        <div className={`grid ${getGridColsClass()} gap-2.5`}>
          {slotCards.length === 0 ? (
            <div className="col-span-full py-8 text-center text-slate-300 font-bold text-xs">
              Semua slot joki sedang kosong. Siap order sekarang!
            </div>
          ) : (
            slotCards.map(({ slotDef, customer }) => {
              const isVvip = slotDef.tier === 'VVIP';
              const isVip = slotDef.tier === 'VIP';

              // Distinct Visual Tier Badges
              const badgeStyle = isVvip
                ? 'bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white font-black border border-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                : isVip
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black border border-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                : 'bg-cyan-400 text-black font-black border border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.45)]';

              // Distinct Tier Card Containers for Empty Slots
              const emptyCardStyle = isVvip
                ? 'bg-gradient-to-b from-rose-950/30 to-black/60 border-2 border-dashed border-rose-400/80 hover:border-rose-400 shadow-[0_0_14px_rgba(244,63,94,0.25)]'
                : isVip
                ? 'bg-gradient-to-b from-amber-950/25 to-black/60 border-2 border-dashed border-amber-400/80 hover:border-amber-300 shadow-[0_0_14px_rgba(251,191,36,0.25)]'
                : 'bg-black/40 border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/50';

              // 1. EMPTY SLOT CARD
              if (!customer) {
                return (
                  <div 
                    key={`empty-${slotDef.key}`}
                    className={`rounded-2xl p-3 transition-all duration-300 flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden ${emptyCardStyle}`}
                  >
                    {/* Top Row: Slot Pill + OPEN Badge */}
                    <div className="flex items-center justify-between gap-1.5 w-full">
                      <span className={`whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-lg font-mono font-black text-xs leading-none inline-flex items-center gap-1 border shadow-sm ${badgeStyle}`}>
                        {isVvip ? <Gem size={12} className="text-rose-200" /> : isVip ? <Crown size={12} className="text-amber-900" /> : null}
                        <span>{slotDef.displayLabel}</span>
                      </span>

                      {/* Open Badge with Tier Indicator */}
                      <span className={`whitespace-nowrap shrink-0 ml-auto px-2 py-0.5 rounded-lg font-black text-[10.5px] uppercase tracking-wider flex items-center gap-1 leading-none border shadow-sm ${
                        isVvip
                          ? 'bg-rose-500/25 border-rose-400/70 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                          : isVip
                          ? 'bg-amber-500/25 border-amber-400/70 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                          : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      }`}>
                        <PlusCircle size={10} />
                        <span>{isVvip ? 'VVIP OPEN' : isVip ? 'VIP OPEN' : 'OPEN'}</span>
                      </span>
                    </div>

                    {/* Bottom Content */}
                    <div className="pt-1 min-w-0">
                      <div className={`flex items-center gap-1.5 text-xs font-black truncate ${
                        isVvip ? 'text-rose-200' : isVip ? 'text-amber-200' : 'text-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-pulse shrink-0 ${
                          isVvip ? 'bg-rose-400' : isVip ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        <span className="truncate">
                          {isVvip ? 'SLOT VVIP KOSONG' : isVip ? 'SLOT VIP KOSONG' : 'SLOT KOSONG'}
                        </span>
                      </div>
                      <div className={`text-[11px] truncate font-medium mt-0.5 ${
                        isVvip ? 'text-rose-300/80' : isVip ? 'text-amber-300/80' : 'text-slate-400'
                      }`}>
                        {isVvip ? '💎 Slot Super Priority Siap Order!' : isVip ? '👑 Slot Priority Siap Order!' : 'Chat live untuk pesan slot!'}
                      </div>
                    </div>
                  </div>
                );
              }

              // 2. ACTIVE SLOT CARD (Crisp High-DPI 2-Row Stacked Layout)
              const rem = getRemaining(customer);
              const isFinished = rem <= 0 && !customer.paused;
              const isEnding = rem > 0 && rem <= 300 && !customer.paused;

              // Distinct Tier Container for Active Slots
              const activeContainerStyle = isFinished
                ? 'bg-rose-950/90 border-rose-500 shadow-rose-900/50 ring-1 ring-rose-500'
                : isEnding
                ? 'bg-rose-950/70 border-rose-500 animate-pulse shadow-lg shadow-rose-600/50 ring-2 ring-rose-500'
                : customer.paused
                ? 'bg-amber-950/50 border-amber-500/60'
                : isVvip
                ? 'bg-gradient-to-b from-[#220610]/95 via-[#110308]/95 to-black/90 border-2 border-rose-400/90 shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-1 ring-rose-400/50'
                : isVip
                ? 'bg-gradient-to-b from-[#1f1604]/95 via-[#100b02]/95 to-black/90 border-2 border-amber-400/90 shadow-[0_0_18px_rgba(251,191,36,0.35)] ring-1 ring-amber-400/50'
                : 'bg-black/60 border-2 border-cyan-500/40 hover:border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]';

              return (
                <div 
                  key={customer.id || slotDef.key}
                  className={`relative rounded-2xl p-3 transition-all duration-300 border-2 backdrop-blur-md shadow-md flex flex-col justify-between gap-1.5 min-w-0 overflow-hidden ${activeContainerStyle}`}
                >
                  {/* Row 1: Header (Slot Label on Left, Countdown on Right) */}
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-lg font-black text-xs font-mono border shadow leading-none inline-flex items-center gap-1 ${
                        isFinished || isEnding 
                          ? 'bg-rose-600 text-white border-rose-300' 
                          : badgeStyle
                      }`}>
                        {isVvip ? <Gem size={12} className="text-white" /> : isVip ? <Crown size={12} className="text-amber-950" /> : null}
                        <span>{slotDef.displayLabel || formatSlotLabel(customer.slot, customer.service, contextServices)}</span>
                      </span>
                    </div>

                    {/* Timer Box */}
                    <div className="shrink-0 ml-auto">
                      {isFinished ? (
                        <div className="whitespace-nowrap px-2 py-0.5 rounded-lg bg-rose-600 text-white font-black text-[11px] border border-rose-300 flex items-center gap-1 shadow leading-none">
                          <CheckCheck size={11} />
                          <span>HABIS</span>
                        </div>
                      ) : customer.paused ? (
                        <div className="whitespace-nowrap px-2 py-0.5 rounded-lg bg-amber-500/25 text-amber-200 font-black text-[11px] border border-amber-500/60 flex items-center gap-1 font-mono leading-none">
                          <Pause size={10} />
                          <span>{formatTime(rem)}</span>
                        </div>
                      ) : (
                        <div className={`whitespace-nowrap px-2 py-0.5 rounded-lg border font-mono font-black text-xs flex items-center gap-1 tracking-wider leading-none ${
                          isEnding
                            ? 'bg-rose-600 text-white border-rose-300 shadow-md shadow-rose-600/60 animate-bounce'
                            : isVvip
                            ? 'bg-black/90 border border-rose-500/70 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                            : isVip
                            ? 'bg-black/90 border border-amber-500/70 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                            : t.timeBox
                        }`}>
                          <Play size={10} className={isEnding ? 'text-white' : 'text-emerald-400 fill-emerald-400'} />
                          <span>{formatTime(rem)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Customer Identity (Full Width Bold White Username & TikTok) */}
                  <div className="min-w-0 pt-1">
                    <div className="font-black text-white truncate text-sm drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.95)] tracking-tight block w-full flex items-center gap-1">
                      <span className="truncate">{customer.username || customer.name || 'Pelanggan'}</span>
                      {isVvip ? <Gem size={13} className="text-rose-400 shrink-0" /> : isVip ? <Crown size={13} className="text-amber-400 shrink-0" /> : null}
                    </div>

                    {customer.tiktokName ? (
                      <div className={`text-xs font-bold truncate mt-0.5 drop-shadow flex items-center gap-1 block w-full ${
                        isVvip ? 'text-rose-300' : isVip ? 'text-amber-300' : 'text-cyan-300'
                      }`}>
                        <span>@{customer.tiktokName}</span>
                      </div>
                    ) : (
                      <div className={`text-[11px] font-medium truncate block w-full ${
                        isVvip ? 'text-rose-300 font-bold' : isVip ? 'text-amber-300 font-bold' : 'text-slate-300'
                      }`}>
                        {isVvip ? '💎 Paket VVIP Super Priority' : isVip ? '👑 Paket VIP Priority' : `Paket ${customer.service || slotDef.serviceName || 'Basic'}`}
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
