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
  });

  // Opsi A: Sultan Ranking Formula (Total Spent -> Total Duration -> Total Orders)
  const leaderboardList = Object.values(customerAggregates)
    .sort((a, b) => 
      b.totalSpent - a.totalSpent || 
      b.totalDuration - a.totalDuration || 
      b.totalOrders - a.totalOrders
    );

  const topSultans = leaderboardList.slice(0, maxItems);

  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#18140c]/90 border-amber-500/35 shadow-amber-500/15',
          headerBg: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-300',
          accentText: 'text-amber-400'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#180c10]/90 border-rose-500/35 shadow-rose-500/15',
          headerBg: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-300',
          accentText: 'text-rose-400'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0f1115]/92 border-white/15 shadow-black/40',
          headerBg: 'from-white/10 to-transparent border-white/15 text-slate-200',
          accentText: 'text-cyan-400'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#0b101b]/90 border-amber-500/30 shadow-amber-500/15',
          headerBg: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-300',
          accentText: 'text-amber-400'
        };
    }
  };

  const t = getThemeStyles();

  return (
    <div className={`w-full font-sans select-none ${scale === 'compact' ? 'text-xs' : scale === 'large' ? 'text-base' : 'text-sm'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-md`}>
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-amber-400" />
          <span className="font-black tracking-wider text-xs uppercase drop-shadow flex items-center gap-1">
            <span>👑</span>
            <span>{title}</span>
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/90 border border-white/10">
          Top {topSultans.length} Sultan
        </span>
      </div>

      {/* Leaderboard Body */}
      <div className={`p-2.5 rounded-b-2xl border-b border-x backdrop-blur-md ${t.cardBg} space-y-2 shadow-2xl`}>
        {/* Top 1 Sultan Podium Highlight Card */}
        {showPodium && topSultans[0] && (
          <div className="bg-gradient-to-b from-amber-500/20 via-amber-500/5 to-black/40 border border-amber-500/40 rounded-xl p-2.5 text-center shadow-lg relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black font-black text-[10px] uppercase flex items-center gap-1 shadow">
                <Crown size={11} />
                <span>SULTAN UTAMA #1</span>
              </span>
            </div>
            <div className="text-sm font-black text-white truncate drop-shadow">
              {topSultans[0].username}
            </div>
            {topSultans[0].tiktokName && (
              <div className="text-[10px] text-amber-300 font-bold">
                @{topSultans[0].tiktokName}
              </div>
            )}
            <div className="mt-2 py-1 px-2 rounded-lg bg-black/40 border border-amber-500/30 grid grid-cols-2 gap-1 text-[11px] font-mono">
              <div>
                <span className="text-[9px] text-amber-200/70 block">Total Belanja</span>
                <strong className="text-amber-300 font-black">{formatRupiah(topSultans[0].totalSpent)}</strong>
              </div>
              <div>
                <span className="text-[9px] text-amber-200/70 block">Total Jam</span>
                <strong className="text-white">{topSultans[0].totalDuration.toFixed(1)} Jam</strong>
              </div>
            </div>
          </div>
        )}

        {/* List of Sultans */}
        {topSultans.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-medium text-xs">
            <Trophy size={20} className="mx-auto mb-1.5 opacity-40 text-amber-400" />
            <span>Belum ada sultan tercatat di riwayat stream.</span>
          </div>
        ) : (
          <div className="space-y-1">
            {topSultans.map((item, idx) => {
              // Rule: Only Top 3 display exact nominal amount (Rp)
              const isTop3 = idx < 3;

              return (
                <div 
                  key={item.username}
                  className={`flex items-center justify-between p-1.5 rounded-lg border transition-all ${
                    idx === 0 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : idx === 1 
                      ? 'bg-slate-400/10 border-slate-400/25'
                      : idx === 2 
                      ? 'bg-amber-700/10 border-amber-700/25'
                      : 'bg-white/[0.02] border-white/5'
                  }`}
                >
                  {/* Left: Rank & Name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 border ${
                      idx === 0 
                        ? 'bg-amber-400 text-black border-amber-300 font-black' 
                        : idx === 1 
                        ? 'bg-slate-300 text-black border-slate-200 font-black'
                        : idx === 2
                        ? 'bg-amber-600 text-white border-amber-500 font-black'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-xs truncate">
                        {item.username}
                      </div>
                      {item.tiktokName && (
                        <div className="text-[9px] text-slate-400 truncate">
                          @{item.tiktokName}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Nominal (Only Top 3) or Member Badge (Rank 4+) */}
                  <div className="text-right shrink-0">
                    {isTop3 ? (
                      <div className="font-mono font-bold text-xs text-amber-300">
                        {formatRupiah(item.totalSpent)}
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/5 text-[9.5px] font-bold text-slate-400 border border-white/10">
                        <Sparkles size={9} className="text-amber-400" />
                        <span>Sultan Member</span>
                      </div>
                    )}
                    <div className="text-[9px] text-slate-400 font-mono">
                      {item.totalDuration.toFixed(1)}j • {item.totalOrders}x
                    </div>
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
