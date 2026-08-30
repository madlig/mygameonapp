import React from 'react';
import { Users, Crown, Diamond, Clock } from 'lucide-react';

const getCleanService = (s) => {
  const norm = String(s || '').toUpperCase();
  if (norm.includes('VVIP')) return 'VVIP';
  if (norm.includes('VIP')) return 'VIP';
  return 'Basic';
};

const OverlayQueue = ({ 
  queue = [], 
  theme = 'neon',
  scale = 'normal',
  maxItems = 6,
  title = 'ANTRIAN LIVE'
}) => {
  const displayedQueue = queue.slice(0, maxItems);

  const getThemeStyles = () => {
    switch (theme) {
      case 'gold':
        return {
          cardBg: 'bg-[#18140c]/90 border-amber-500/35 shadow-amber-500/15',
          headerBg: 'from-amber-500/20 to-transparent border-amber-500/30 text-amber-300',
          badgeVvip: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeBasic: 'bg-white/10 text-slate-300 border-white/15'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#180c10]/90 border-rose-500/35 shadow-rose-500/15',
          headerBg: 'from-rose-500/20 to-transparent border-rose-500/30 text-rose-300',
          badgeVvip: 'bg-rose-600/30 text-rose-200 border-rose-500/50',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeBasic: 'bg-white/10 text-slate-300 border-white/15'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0f1115]/92 border-white/15 shadow-black/40',
          headerBg: 'from-white/10 to-transparent border-white/15 text-slate-200',
          badgeVvip: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          badgeBasic: 'bg-white/10 text-slate-300 border-white/15'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#0b101b]/90 border-cyan-500/30 shadow-cyan-500/15',
          headerBg: 'from-purple-500/20 to-transparent border-purple-500/30 text-purple-300',
          badgeVvip: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          badgeVip: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          badgeBasic: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
        };
    }
  };

  const t = getThemeStyles();

  return (
    <div className={`w-full font-sans select-none ${scale === 'compact' ? 'text-xs' : scale === 'large' ? 'text-base' : 'text-sm'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3.5 py-2 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-md`}>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-purple-400" />
          <span className="font-black tracking-wider text-xs uppercase drop-shadow">
            {title}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-white/90 border border-white/10">
          {queue.length} Menunggu
        </span>
      </div>

      {/* Queue Body */}
      <div className={`p-2.5 rounded-b-2xl border-b border-x backdrop-blur-md ${t.cardBg} space-y-1.5 shadow-2xl`}>
        {displayedQueue.length === 0 ? (
          <div className="py-6 text-center text-slate-400 font-medium text-xs">
            <Users size={20} className="mx-auto mb-1.5 opacity-40" />
            <span>Antrian kosong. Chat live untuk order joki!</span>
          </div>
        ) : (
          displayedQueue.map((item, idx) => {
            const srv = getCleanService(item.service);
            const isTop = idx === 0;

            return (
              <div 
                key={item.id || idx}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  isTop 
                    ? 'bg-purple-950/40 border-purple-500/40 shadow-sm' 
                    : 'bg-white/[0.03] border-white/10'
                }`}
              >
                {/* Left: Position & Name */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 border ${
                    isTop ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 text-slate-400 border-white/10'
                  }`}>
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-white truncate text-xs">
                        {item.username || item.name || 'Customer'}
                      </span>

                      {srv === 'VVIP' ? (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${t.badgeVvip}`}>
                          <Diamond size={9} />
                          <span>VVIP</span>
                        </span>
                      ) : srv === 'VIP' ? (
                        <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${t.badgeVip}`}>
                          <Crown size={9} />
                          <span>VIP</span>
                        </span>
                      ) : null}
                    </div>

                    {item.tiktokName && (
                      <div className="text-[9.5px] text-slate-400 font-medium truncate">
                        @{item.tiktokName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Duration */}
                <div className="text-right shrink-0">
                  <div className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-slate-300 font-mono font-bold text-[11px] flex items-center gap-1">
                    <Clock size={10} className="text-cyan-400" />
                    <span>{Number(item.duration || 1).toFixed(0)} Jam</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {queue.length > maxItems && (
          <div className="text-center pt-1 text-[10px] text-slate-400 font-mono">
            + {queue.length - maxItems} antrian lainnya
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayQueue;
