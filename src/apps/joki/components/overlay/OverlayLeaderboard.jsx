import React from 'react';
import { Trophy, Crown, Sparkles } from 'lucide-react';

const formatRupiah = (value) => {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
};

const getCleanService = (s) => {
  const norm = String(s || '').toUpperCase();
  if (norm.includes('VVIP')) return 'VVIP';
  if (norm.includes('VIP')) return 'VIP';
  return 'Basic';
};

const OverlayLeaderboard = ({ 
  customers = [], 
  theme = 'neon',
  scale = 'normal',
  maxItems = 5,
  showPodium = true,
  title = 'TOP SULTAN LIVE'
}) => {
  // Aggregate finished customers
  const customerAggregates = {};
  customers.filter(c => c.finished && !c.stopped).forEach(c => {
    const rawName = (c.username || c.name || '').trim();
    if (!rawName) return;
    const normalizedKey = rawName.toLowerCase();

    if (!customerAggregates[normalizedKey]) {
      customerAggregates[normalizedKey] = {
        username: rawName,
        tiktokName: c.tiktokName || '',
        totalOrders: 0,
        totalDuration: 0,
        totalSpent: 0,
        vvipCount: 0,
        vipCount: 0,
        basicCount: 0,
        lastOrderedAt: c.finishedTime || c.createdAt || 0
      };
    }
    customerAggregates[normalizedKey].totalOrders += 1;
    customerAggregates[normalizedKey].totalDuration += Number(c.duration || 0);
    customerAggregates[normalizedKey].totalSpent += Number(c.price || 0);
    if (c.tiktokName && !customerAggregates[normalizedKey].tiktokName) {
      customerAggregates[normalizedKey].tiktokName = c.tiktokName;
    }
    const srv = getCleanService(c.service);
    if (srv === 'VVIP') customerAggregates[normalizedKey].vvipCount += 1;
    else if (srv === 'VIP') customerAggregates[normalizedKey].vipCount += 1;
    else customerAggregates[normalizedKey].basicCount += 1;

    const ts = c.finishedTime || c.createdAt || 0;
    if (ts > customerAggregates[normalizedKey].lastOrderedAt) {
      customerAggregates[normalizedKey].lastOrderedAt = ts;
    }
  });

  // Sort Formula Opsi A: Total Spent (Rp) -> Total Duration -> Total Orders
  const topSultans = Object.values(customerAggregates)
    .sort((a, b) => {
      if (b.totalSpent !== a.totalSpent) return b.totalSpent - a.totalSpent;
      if (b.totalDuration !== a.totalDuration) return b.totalDuration - a.totalDuration;
      return b.totalOrders - a.totalOrders;
    })
    .slice(0, maxItems);

  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#18140c]/95 border-amber-500/40 shadow-amber-500/20',
          headerBg: 'from-amber-500/30 to-amber-950/40 border-amber-500/40 text-amber-300',
          accentText: 'text-amber-400'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#18080c]/95 border-rose-500/40 shadow-rose-500/20',
          headerBg: 'from-rose-600/30 to-rose-950/40 border-rose-500/40 text-rose-300',
          accentText: 'text-rose-400'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0e1015]/95 border-white/20 shadow-black/50',
          headerBg: 'from-white/15 to-transparent border-white/20 text-slate-100',
          accentText: 'text-cyan-400'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#070b14]/95 border-amber-500/40 shadow-amber-500/20',
          headerBg: 'from-amber-500/30 to-cyan-950/40 border-amber-500/40 text-amber-300',
          accentText: 'text-amber-400'
        };
    }
  };

  const t = getThemeStyles();

  const getScaleClasses = () => {
    switch (scale) {
      case '2xl':
        return { text: 'text-lg', titleText: 'text-base', nameText: 'text-lg', rankSize: 'w-8 h-8 text-base' };
      case 'xl':
        return { text: 'text-base', titleText: 'text-sm', nameText: 'text-base', rankSize: 'w-7 h-7 text-sm' };
      case 'large':
        return { text: 'text-sm', titleText: 'text-xs', nameText: 'text-sm', rankSize: 'w-6 h-6 text-xs' };
      case 'compact':
        return { text: 'text-xs', titleText: 'text-[11px]', nameText: 'text-xs', rankSize: 'w-5 h-5 text-[10px]' };
      case 'normal':
      default:
        return { text: 'text-sm', titleText: 'text-xs', nameText: 'text-sm', rankSize: 'w-6 h-6 text-xs' };
    }
  };

  const sc = getScaleClasses();

  return (
    <div className={`w-full font-sans select-none ${sc.text}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-lg`}>
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-amber-400" />
          <span className={`font-black tracking-wider uppercase drop-shadow-md text-white flex items-center gap-1.5 ${sc.titleText}`}>
            <span>👑</span>
            <span>{title}</span>
          </span>
        </div>
        <span className="text-xs font-mono font-black bg-white/10 px-2.5 py-0.5 rounded-full text-white border border-white/15 shadow-inner">
          Top {topSultans.length} Sultan
        </span>
      </div>

      {/* Leaderboard Body */}
      <div className={`p-3 rounded-b-2xl border-b border-x backdrop-blur-xl ${t.cardBg} space-y-2.5 shadow-2xl`}>
        {/* Top 1 Sultan Podium Highlight Card */}
        {showPodium && topSultans[0] && (
          <div className="bg-gradient-to-b from-amber-500/25 via-amber-500/10 to-black/60 border border-amber-500/50 rounded-2xl p-3 text-center shadow-xl relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-black font-black text-[11px] uppercase flex items-center gap-1 shadow-md">
                <Crown size={12} />
                <span>SULTAN UTAMA #1</span>
              </span>
            </div>
            <div className={`font-black text-white truncate drop-shadow ${sc.nameText}`}>
              {topSultans[0].username}
            </div>
            {topSultans[0].tiktokName && (
              <div className="text-xs text-amber-300 font-bold drop-shadow">
                @{topSultans[0].tiktokName}
              </div>
            )}
            <div className="mt-2 py-1.5 px-3 rounded-xl bg-black/60 border border-amber-500/40 grid grid-cols-2 gap-2 text-xs font-mono">
              <div>
                <span className="text-[10px] text-amber-200/70 block uppercase font-bold">Total Belanja</span>
                <strong className="text-amber-300 font-black text-sm">{formatRupiah(topSultans[0].totalSpent)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-amber-200/70 block uppercase font-bold">Total Waktu</span>
                <strong className="text-white font-black text-sm">{topSultans[0].totalDuration.toFixed(1)} Jam</strong>
              </div>
            </div>
          </div>
        )}

        {/* List of Sultans */}
        {topSultans.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-bold text-xs">
            <Trophy size={24} className="mx-auto mb-2 opacity-40 text-amber-400 animate-pulse" />
            <span>Belum ada riwayat sultan streamer.</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {topSultans.map((item, idx) => {
              // Rule: Only Top 3 display exact nominal amount (Rp)
              const isTop3 = idx < 3;

              return (
                <div 
                  key={item.username}
                  className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                    idx === 0 
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-sm' 
                      : idx === 1 
                      ? 'bg-slate-400/15 border-slate-400/30'
                      : idx === 2 
                      ? 'bg-amber-700/15 border-amber-700/30'
                      : 'bg-white/[0.03] border-white/10'
                  }`}
                >
                  {/* Left: Rank & Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`${sc.rankSize} rounded-lg flex items-center justify-center font-black shrink-0 border ${
                      idx === 0 
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-400/40' 
                        : idx === 1 
                        ? 'bg-slate-300 text-black border-slate-200 shadow-md'
                        : idx === 2
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                        : 'bg-white/10 text-slate-400 border-white/15'
                    }`}>
                      {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`font-black text-white truncate drop-shadow ${sc.nameText}`}>
                          {item.username}
                        </span>
                        {idx === 0 && <Crown size={12} className="text-amber-400 shrink-0" />}
                      </div>

                      {item.tiktokName && (
                        <div className="text-xs text-amber-300/90 font-bold truncate">
                          @{item.tiktokName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Spend & Time */}
                  <div className="text-right shrink-0">
                    {isTop3 ? (
                      <div>
                        <div className="text-xs font-mono font-black text-amber-300 drop-shadow">
                          {formatRupiah(item.totalSpent)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.totalDuration.toFixed(1)} Jam • {item.totalOrders} Order
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-amber-300 text-[10px] font-black border border-white/15 inline-flex items-center gap-1 shadow-sm">
                          <Sparkles size={9} />
                          <span>Sultan Member</span>
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.totalDuration.toFixed(1)} Jam • {item.totalOrders} Order
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayLeaderboard;
