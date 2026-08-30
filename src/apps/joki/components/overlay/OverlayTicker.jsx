import React from 'react';
import { Flame, Users, Crown, Clock } from 'lucide-react';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatRupiah = (value) => {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
};

const getCleanSlot = (c) => {
  if (c.slot !== undefined && c.slot !== null) {
    const parsed = parseInt(String(c.slot).replace(/\D/g, ''), 10);
    if (!isNaN(parsed)) return parsed;
  }
  return 1;
};

const OverlayTicker = ({ 
  customers = [], 
  queue = [], 
  now = Date.now(), 
  theme = 'neon',
  workspaceName = 'Live Joki'
}) => {
  const activeCustomers = customers.filter(c => !c.finished);

  // Compute Top Sultan
  const customerAggregates = {};
  customers.filter(c => c.finished && !c.stopped).forEach(c => {
    const key = (c.username || c.name || '').trim();
    if (!key) return;
    const lower = key.toLowerCase();
    if (!customerAggregates[lower]) {
      customerAggregates[lower] = { username: key, totalSpent: 0, totalDuration: 0, totalOrders: 0 };
    }
    customerAggregates[lower].totalSpent += Number(c.price || 0);
    customerAggregates[lower].totalDuration += Number(c.duration || 0);
    customerAggregates[lower].totalOrders += 1;
  });
  const topSultan = Object.values(customerAggregates).sort((a, b) => b.totalSpent - a.totalSpent)[0];

  const getRemaining = (c) => {
    if (c.paused) return Number(c.remainingAtPause || 0);
    const totalSecs = (Number(c.duration) || 1) * 3600;
    const elapsedSecs = ((now - (c.startTime || now)) / 1000) + (Number(c.pausedDuration) || 0);
    return Math.max(0, totalSecs - elapsedSecs);
  };

  const getThemeBg = () => {
    switch (theme) {
      case 'gold': return 'bg-[#141008]/90 border-amber-500/40 text-amber-300';
      case 'crimson': return 'bg-[#18080c]/90 border-rose-500/40 text-rose-300';
      case 'dark': return 'bg-[#0f1115]/92 border-white/15 text-slate-200';
      case 'neon':
      default: return 'bg-[#070b14]/90 border-cyan-500/30 text-cyan-300';
    }
  };

  return (
    <div className={`w-full overflow-hidden select-none backdrop-blur-md rounded-2xl border px-3 py-2 shadow-2xl ${getThemeBg()}`}>
      <style>{`
        @keyframes tickerMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker-marquee {
          display: flex;
          width: max-content;
          animation: tickerMarquee 28s linear infinite;
        }
        .animate-ticker-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="flex items-center gap-3">
        {/* Static Badge Left */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase shrink-0 shadow-md">
          <Flame size={13} className="animate-bounce" />
          <span>{workspaceName}</span>
        </div>

        {/* Marquee Content */}
        <div className="overflow-hidden flex-1 relative mask-linear">
          <div className="animate-ticker-marquee flex items-center gap-8 text-xs font-semibold whitespace-nowrap">
            {/* Segment 1: Active Slots */}
            {activeCustomers.length > 0 ? (
              activeCustomers.map(c => {
                const rem = getRemaining(c);
                const isEnding = rem > 0 && rem <= 300;
                return (
                  <div key={`c-${c.id || c.slot}`} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                    <span className="font-black text-cyan-400">SLOT {getCleanSlot(c)}:</span>
                    <span className="text-white font-bold">{c.username || c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({c.service || 'Basic'})</span>
                    <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[11px] ${isEnding ? 'bg-rose-600 text-white animate-pulse' : 'text-emerald-400'}`}>
                      {formatTime(rem)}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-slate-400 flex items-center gap-1">
                <Clock size={12} /> Semua slot siap diorder!
              </span>
            )}

            {/* Segment 2: Waiting Queue */}
            {queue.length > 0 && (
              <div className="flex items-center gap-2 bg-purple-950/40 px-2.5 py-0.5 rounded-lg border border-purple-500/30 text-purple-300">
                <Users size={12} />
                <span className="font-bold text-white">Antrian ({queue.length}):</span>
                <span>{queue.slice(0, 3).map((q, i) => `#${i + 1} ${q.username || q.name}`).join(' • ')}</span>
              </div>
            )}

            {/* Segment 3: Top Sultan */}
            {topSultan && (
              <div className="flex items-center gap-1.5 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-500/40 text-amber-300">
                <Crown size={12} className="text-amber-400" />
                <span className="font-black">👑 Sultan Utama:</span>
                <span className="text-white font-extrabold">{topSultan.username}</span>
                <span className="text-amber-300 font-mono font-bold">({formatRupiah(topSultan.totalSpent)})</span>
              </div>
            )}

            {/* Duplication for Seamless Loop */}
            {activeCustomers.length > 0 && activeCustomers.map(c => (
              <div key={`c-dup-${c.id || c.slot}`} className="flex items-center gap-1.5 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                <span className="font-black text-cyan-400">SLOT {getCleanSlot(c)}:</span>
                <span className="text-white font-bold">{c.username || c.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">({c.service || 'Basic'})</span>
                <span className="text-emerald-400 font-mono font-bold text-[11px]">{formatTime(getRemaining(c))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayTicker;
