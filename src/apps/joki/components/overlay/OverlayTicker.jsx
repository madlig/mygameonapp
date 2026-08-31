import React from 'react';
import { useJoki, formatSlotLabel } from '../../contexts/JokiContext';
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
      case 'gold': return 'bg-[#141008]/95 border-amber-500/50 text-amber-300 shadow-amber-500/20';
      case 'crimson': return 'bg-[#18080c]/95 border-rose-500/50 text-rose-300 shadow-rose-500/20';
      case 'dark': return 'bg-[#0f1115]/95 border-white/25 text-slate-200 shadow-black/70';
      case 'neon':
      default: return 'bg-[#070b14]/95 border-cyan-500/40 text-cyan-300 shadow-cyan-500/20';
    }
  };

  return (
    <div className={`w-full overflow-hidden select-none backdrop-blur-md rounded-2xl border-2 px-3 py-2 shadow-2xl ${getThemeBg()}`}>
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
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-black text-xs uppercase shrink-0 shadow-md shadow-rose-600/30">
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
                  <div key={`c-${c.id || c.slot}`} className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-white/15">
                    <span className="font-black text-cyan-300 font-mono">{formatSlotLabel(c.slot, c.service)}:</span>
                    <span className="text-white font-black">{c.username || c.name}</span>
                    <span className={`font-mono font-black px-2 py-0.5 rounded-lg text-xs ${isEnding ? 'bg-rose-600 text-white animate-pulse' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'}`}>
                      {formatTime(rem)}
                    </span>
                  </div>
                );
              })
            ) : (
              <span className="text-slate-300 flex items-center gap-1 font-bold">
                <Clock size={12} className="text-cyan-400" /> Semua slot siap diorder!
              </span>
            )}

            {/* Segment 2: Waiting Queue */}
            {queue.length > 0 && (
              <div className="flex items-center gap-2 bg-purple-950/60 px-3 py-1 rounded-xl border border-purple-500/40 text-purple-200">
                <Users size={12} className="text-purple-400" />
                <span className="font-black text-white">Antrian ({queue.length}):</span>
                <span className="font-bold">{queue.slice(0, 3).map((q, i) => `#${i + 1} ${q.username || q.name}`).join(' • ')}</span>
              </div>
            )}

            {/* Segment 3: Top Sultan */}
            {topSultan && (
              <div className="flex items-center gap-1.5 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-500/50 text-amber-300">
                <Crown size={12} className="text-amber-400" />
                <span className="font-black">👑 Sultan Utama:</span>
                <span className="text-white font-black">{topSultan.username}</span>
                <span className="text-amber-300 font-mono font-black">({formatRupiah(topSultan.totalSpent)})</span>
              </div>
            )}

            {/* Duplication for Seamless Loop */}
            {activeCustomers.length > 0 && activeCustomers.map(c => (
              <div key={`c-dup-${c.id || c.slot}`} className="flex items-center gap-1.5 bg-black/60 px-3 py-1 rounded-xl border border-white/15">
                <span className="font-black text-cyan-300 font-mono">{formatSlotLabel(c.slot, c.service)}:</span>
                <span className="text-white font-black">{c.username || c.name}</span>
                <span className="text-emerald-300 font-mono font-black text-xs">{formatTime(getRemaining(c))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverlayTicker;
