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
          cardBg: 'bg-[#18140c]/95 border-amber-500/40 shadow-amber-500/20',
          headerBg: 'from-amber-500/30 to-amber-950/40 border-amber-500/40 text-amber-300',
          badgeVvip: 'bg-rose-500/30 text-rose-200 border-rose-400/60 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/60 font-black',
          badgeBasic: 'bg-white/15 text-slate-200 border-white/25'
        };
      case 'crimson':
        return {
          cardBg: 'bg-[#18080c]/95 border-rose-500/40 shadow-rose-500/20',
          headerBg: 'from-rose-600/30 to-rose-950/40 border-rose-500/40 text-rose-300',
          badgeVvip: 'bg-rose-500/30 text-rose-100 border-rose-400/60 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/60 font-black',
          badgeBasic: 'bg-white/15 text-slate-200 border-white/25'
        };
      case 'dark':
        return {
          cardBg: 'bg-[#0e1015]/95 border-white/20 shadow-black/50',
          headerBg: 'from-white/15 to-transparent border-white/20 text-slate-100',
          badgeVvip: 'bg-rose-500/30 text-rose-200 border-rose-400/50 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/50 font-black',
          badgeBasic: 'bg-white/15 text-slate-200 border-white/25'
        };
      case 'neon':
      default:
        return {
          cardBg: 'bg-[#070b14]/95 border-purple-500/40 shadow-purple-500/20',
          headerBg: 'from-purple-500/30 to-cyan-950/40 border-purple-500/40 text-purple-300',
          badgeVvip: 'bg-rose-500/30 text-rose-100 border-rose-400/60 font-black',
          badgeVip: 'bg-amber-400/30 text-amber-200 border-amber-300/60 font-black',
          badgeBasic: 'bg-purple-500/20 text-purple-200 border-purple-400/40'
        };
    }
  };

  const t = getThemeStyles();

  const getScaleClasses = () => {
    switch (scale) {
      case '2xl':
        return { text: 'text-lg', titleText: 'text-base', nameText: 'text-lg', numSize: 'w-10 h-10 text-base' };
      case 'xl':
        return { text: 'text-base', titleText: 'text-sm', nameText: 'text-base', numSize: 'w-8 h-8 text-sm' };
      case 'large':
        return { text: 'text-sm', titleText: 'text-xs', nameText: 'text-sm', numSize: 'w-7 h-7 text-xs' };
      case 'compact':
        return { text: 'text-xs', titleText: 'text-[11px]', nameText: 'text-xs', numSize: 'w-6 h-6 text-[10px]' };
      case 'normal':
      default:
        return { text: 'text-sm', titleText: 'text-xs', nameText: 'text-sm', numSize: 'w-7 h-7 text-xs' };
    }
  };

  const sc = getScaleClasses();

  return (
    <div className={`w-full font-sans select-none ${sc.text}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-2xl border-t border-x bg-gradient-to-r ${t.headerBg} backdrop-blur-md shadow-lg`}>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-purple-400" />
          <span className={`font-black tracking-wider uppercase drop-shadow-md text-white ${sc.titleText}`}>
            {title}
          </span>
        </div>
        <span className="text-xs font-mono font-black bg-white/10 px-2.5 py-0.5 rounded-full text-white border border-white/15 shadow-inner">
          {queue.length} Menunggu
        </span>
      </div>

      {/* Queue Body */}
      <div className={`p-3 rounded-b-2xl border-b border-x backdrop-blur-xl ${t.cardBg} space-y-2 shadow-2xl`}>
        {displayedQueue.length === 0 ? (
          <div className="py-8 text-center text-slate-400 font-bold text-xs">
            <Users size={24} className="mx-auto mb-2 opacity-40 text-purple-400 animate-pulse" />
            <span>Antrian kosong. Chat di live untuk daftar sekarang!</span>
          </div>
        ) : (
          displayedQueue.map((item, idx) => {
            const srv = getCleanService(item.service);
            const isTop = idx === 0;

            return (
              <div 
                key={item.id || idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isTop 
                    ? 'bg-purple-950/60 border-purple-500/60 shadow-lg shadow-purple-900/30' 
                    : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Position & Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`${sc.numSize} rounded-lg flex items-center justify-center font-black shrink-0 border ${
                    isTop 
                      ? 'bg-purple-600 text-white border-purple-300 shadow-md shadow-purple-600/40' 
                      : 'bg-white/10 text-slate-300 border-white/15'
                  }`}>
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-black text-white truncate drop-shadow ${sc.nameText}`}>
                        {item.username || item.name || 'Customer'}
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

                    {item.tiktokName && (
                      <div className="text-xs text-cyan-300 font-bold truncate mt-0.5">
                        @{item.tiktokName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Duration */}
                <div className="text-right shrink-0">
                  <div className="px-2.5 py-1 rounded-xl bg-black/60 border border-white/15 text-slate-200 font-mono font-black text-xs flex items-center gap-1.5 shadow">
                    <Clock size={11} className="text-cyan-400" />
                    <span>{Number(item.duration || 1).toFixed(0)} Jam</span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {queue.length > maxItems && (
          <div className="text-center pt-1 text-xs text-slate-400 font-mono font-bold">
            + {queue.length - maxItems} antrian lainnya
          </div>
        )}
      </div>
    </div>
  );
};

export default OverlayQueue;
