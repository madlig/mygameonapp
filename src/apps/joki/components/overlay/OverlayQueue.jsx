import React from 'react';
import { Users, Crown, Diamond, Clock, Gamepad2, CheckCircle2 } from 'lucide-react';

const getCleanService = (s) => {
  const norm = String(s || '').toUpperCase();
  if (norm.includes('VVIP')) return 'VVIP';
  if (norm.includes('VIP')) return 'VIP';
  return 'Basic';
};

const OverlayQueue = ({ 
  queue = [], 
  theme = 'neon',
  title = 'ANTRIAN LIVE'
}) => {
  // Split queue into 3 distinct priority tiers
  const vvipQueue = queue.filter(q => getCleanService(q.service) === 'VVIP');
  const vipQueue = queue.filter(q => getCleanService(q.service) === 'VIP');
  const basicQueue = queue.filter(q => getCleanService(q.service) === 'Basic');

  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#15120a]/95 border-amber-500/40 shadow-amber-500/15',
          headerBg: 'from-amber-500/30 to-amber-950/40 border-amber-500/40 text-amber-300',
          sectionVvip: 'bg-rose-950/40 border-rose-500/30 text-rose-300',
          sectionVip: 'bg-amber-950/30 border-amber-500/30 text-amber-300',
          sectionBasic: 'bg-white/[0.02] border-white/10 text-slate-300'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#15070a]/95 border-rose-500/40 shadow-rose-500/15',
          headerBg: 'from-rose-600/30 to-rose-950/40 border-rose-500/40 text-rose-300',
          sectionVvip: 'bg-rose-950/50 border-rose-500/40 text-rose-200',
          sectionVip: 'bg-amber-950/30 border-amber-500/30 text-amber-300',
          sectionBasic: 'bg-white/[0.02] border-white/10 text-slate-300'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0d0f14]/95 border-white/20 shadow-black/50',
          headerBg: 'from-white/15 to-transparent border-white/20 text-slate-100',
          sectionVvip: 'bg-rose-950/30 border-rose-500/25 text-rose-300',
          sectionVip: 'bg-amber-950/25 border-amber-500/25 text-amber-300',
          sectionBasic: 'bg-white/[0.02] border-white/10 text-slate-300'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#060913]/95 border-purple-500/40 shadow-purple-500/15',
          headerBg: 'from-purple-500/30 to-cyan-950/40 border-purple-500/40 text-purple-300',
          sectionVvip: 'bg-rose-950/40 border-rose-500/35 text-rose-300',
          sectionVip: 'bg-amber-950/30 border-amber-500/35 text-amber-300',
          sectionBasic: 'bg-cyan-950/20 border-cyan-500/25 text-cyan-300'
        };
    }
  };

  const t = getThemeStyles();

  // Helper to render a specific tier queue box (Max 2 items)
  const renderTierSection = (titleLabel, icon, list, colorClasses, badgeColor) => {
    const top2 = list.slice(0, 2);
    const hasMore = list.length > 2;

    return (
      <div className={`p-2.5 rounded-xl border ${colorClasses} space-y-1.5`}>
        {/* Tier Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider">
            {icon}
            <span>{titleLabel}</span>
          </div>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${badgeColor}`}>
            {list.length} Menunggu
          </span>
        </div>

        {/* Items List (Max 2) */}
        {list.length === 0 ? (
          <div className="py-1 px-2 text-center text-slate-500 text-[11px] font-medium italic">
            (Antrian kosong • Siap masuk!)
          </div>
        ) : (
          <div className="space-y-1">
            {top2.map((item, idx) => (
              <div 
                key={item.id || idx}
                className="flex items-center justify-between p-1.5 rounded-lg bg-black/40 border border-white/10"
              >
                {/* Left: Urutan & Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-md bg-white/10 text-white font-mono font-black text-[11px] flex items-center justify-center shrink-0 border border-white/15">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-black text-white text-xs truncate drop-shadow">
                      {item.username || item.name || 'Customer'}
                    </div>
                    {item.tiktokName && (
                      <div className="text-[10px] text-cyan-300 font-bold truncate">
                        @{item.tiktokName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Duration */}
                <div className="shrink-0 text-right">
                  <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200 font-mono font-black text-[10.5px] flex items-center gap-1">
                    <Clock size={10} className="text-cyan-400" />
                    <span>{Number(item.duration || 1).toFixed(0)} Jam</span>
                  </div>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="text-right text-[10px] text-slate-400 font-mono pt-0.5">
                + {list.length - 2} antrian {titleLabel} lainnya
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full font-sans select-none text-sm">
      {/* Header */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-lg`}>
        <div className="flex items-center gap-2">
          <Users size={15} className="text-purple-400" />
          <span className="font-black tracking-wider uppercase drop-shadow-md text-white text-xs">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-mono font-black bg-white/10 px-2.5 py-0.5 rounded-full text-white border border-white/15 shadow-inner">
          Total {queue.length} Antrian
        </span>
      </div>

      {/* Queue Body Grouped by Tiers */}
      <div className={`p-2.5 rounded-b-2xl border-b border-x backdrop-blur-xl ${t.cardBg} space-y-2 shadow-2xl`}>
        {queue.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-bold text-xs space-y-1">
            <CheckCircle2 size={22} className="mx-auto text-emerald-400 opacity-80" />
            <div>Semua antrian kosong.</div>
            <div className="text-[10.5px] text-slate-500 font-normal">Chat di live sekarang untuk pesan slot!</div>
          </div>
        ) : (
          <>
            {/* 1. TIER VVIP (Only rendered if VVIP queue has items) */}
            {vvipQueue.length > 0 && renderTierSection(
              'Antrian VVIP', 
              <Diamond size={13} className="text-rose-400" />, 
              vvipQueue, 
              t.sectionVvip, 
              'bg-rose-500/20 text-rose-200 border-rose-500/30'
            )}

            {/* 2. TIER VIP */}
            {renderTierSection(
              'Antrian VIP', 
              <Crown size={13} className="text-amber-400" />, 
              vipQueue, 
              t.sectionVip, 
              'bg-amber-500/20 text-amber-200 border-amber-500/30'
            )}

            {/* 3. TIER BASIC */}
            {renderTierSection(
              'Antrian Basic', 
              <Gamepad2 size={13} className="text-cyan-400" />, 
              basicQueue, 
              t.sectionBasic, 
              'bg-cyan-500/20 text-cyan-200 border-cyan-500/30'
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OverlayQueue;
