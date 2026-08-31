import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Play, X, Gem, Crown, Gamepad2 } from 'lucide-react';

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const StartBillingModal = ({ queueItem, onClose }) => {
  const { 
    customers, 
    services,
    configuredSlots,
    getServiceDetails,
    formatSlotLabel,
    matchCustomerToSlot,
    suggestSlot, 
    startBillingFromQueue, 
    addToast 
  } = useJoki();

  const [slot, setSlot] = useState('1');
  const [loading, setLoading] = useState(false);

  const currentServiceDetails = getServiceDetails(queueItem?.service);
  const isVVIP = currentServiceDetails.tier === 'VVIP';
  const isVIP = currentServiceDetails.tier === 'VIP';

  useEffect(() => {
    if (queueItem) {
      setSlot(suggestSlot(queueItem.service));
    }
  }, [queueItem, customers]);

  if (!queueItem) return null;

  // Map active customers by slotDef key
  const occupiedSlots = {};
  customers.forEach(c => {
    if (!c.finished && c.slot) {
      const remaining = c.paused 
        ? (c.remainingAtPause || 0)
        : Math.max(0, Math.floor((c.endTime - Date.now()) / 1000));
      
      configuredSlots.forEach(sDef => {
        if (matchCustomerToSlot(c, sDef)) {
          occupiedSlots[sDef.key] = {
            username: c.username || c.name,
            remaining,
            paused: c.paused,
          };
        }
      });
    }
  });

  const handleConfirm = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      await startBillingFromQueue(queueItem, slot);
      const slotName = formatSlotLabel ? formatSlotLabel(slot, queueItem.service) : `Slot ${slot}`;
      addToast(`Customer ${queueItem.username} berhasil dimasukkan ke ${slotName}!`, 'success');
      onClose();
    } catch (err) {
      console.error('Start billing error:', err);
      addToast('Gagal memulai billing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease]">
      <div 
        className="w-full max-w-xl bg-[#111318] border border-border-default rounded-3xl p-6 shadow-2xl animate-slide-in relative max-h-[92vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-dim hover:text-text-primary transition-colors p-1.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent-green/15 border border-accent-green/30 flex items-center justify-center text-accent-green shrink-0">
            <Play size={20} className="ml-0.5" />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Alokasikan Antrian ke Slot Live
            </h3>
            <p className="text-xs text-text-muted mt-0.5 m-0">
              Pilih slot live untuk memulai countdown billing customer
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-[#151821] border border-border-default rounded-2xl p-4 mb-4 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[10px] uppercase font-bold text-text-dim">Customer Antrian</div>
            <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>{queueItem.username}</span>
              {queueItem.tiktokName && (
                <span className="text-xs font-bold text-accent-cyan">(@{queueItem.tiktokName})</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-xl text-xs mb-1 border ${
              isVVIP
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : isVIP 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
            }`}>
              {isVVIP ? <Gem size={12} /> : isVIP ? <Crown size={12} /> : <Gamepad2 size={12} />}
              <span>{currentServiceDetails.name || queueItem.service}</span>
            </span>
            <div className="text-text-muted font-mono font-bold text-xs">{formatDuration(queueItem.duration)}</div>
          </div>
        </div>

        {/* Visual Slot Selector (Grouped by Tier with Distinct Colors) */}
        <form onSubmit={handleConfirm} className="space-y-4 overflow-y-auto pr-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-text-dim uppercase tracking-wider block">
                PILIH SLOT AFK BILLING (SESUAI LAYANAN)
              </label>
              <span className="text-[11px] text-text-dim">
                Slot Terpilih: <strong className="text-white font-mono font-black text-xs px-2 py-0.5 rounded-md bg-accent-green/30 border border-accent-green/50">{formatSlotLabel ? formatSlotLabel(slot, queueItem.service) : `SLOT ${slot}`}</strong>
              </span>
            </div>

            {/* Grouped Service Cards */}
            <div className="space-y-3">
              {services.filter(s => s.enabled).map((srv) => {
                const srvSlots = configuredSlots.filter(sDef => sDef.tier === srv.tier);
                if (srvSlots.length === 0) return null;

                const isSrvVvip = srv.tier === 'VVIP';
                const isSrvVip = srv.tier === 'VIP';
                const isCurrentService = currentServiceDetails.tier === srv.tier;

                const themeClasses = isSrvVvip
                  ? {
                      container: 'bg-[#1b0a13]/80 border-rose-500/30',
                      badge: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
                      icon: <Gem size={13} className="text-rose-400" />,
                      slotDefault: 'bg-[#280d1e] border-rose-500/30 hover:border-rose-400/80 text-rose-200',
                      slotSelected: 'bg-accent-green/30 border-accent-green ring-2 ring-accent-green text-white shadow-lg shadow-accent-green/30',
                      pill: 'text-rose-200'
                    }
                  : isSrvVip
                  ? {
                      container: 'bg-[#191307]/80 border-amber-500/30',
                      badge: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
                      icon: <Crown size={13} className="text-amber-400" />,
                      slotDefault: 'bg-[#261c0c] border-amber-500/30 hover:border-amber-400/80 text-amber-200',
                      slotSelected: 'bg-accent-green/30 border-accent-green ring-2 ring-accent-green text-white shadow-lg shadow-accent-green/30',
                      pill: 'text-amber-200'
                    }
                  : {
                      container: 'bg-[#0b1424]/80 border-cyan-500/30',
                      badge: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
                      icon: <Gamepad2 size={13} className="text-cyan-400" />,
                      slotDefault: 'bg-[#0f1d33] border-cyan-500/30 hover:border-cyan-400/80 text-cyan-200',
                      slotSelected: 'bg-accent-green/30 border-accent-green ring-2 ring-accent-green text-white shadow-lg shadow-accent-green/30',
                      pill: 'text-cyan-200'
                    };

                return (
                  <div 
                    key={srv.id} 
                    className={`p-3 rounded-2xl border transition-all ${themeClasses.container} ${isCurrentService ? 'ring-1 ring-accent-green/40' : 'opacity-80'}`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {themeClasses.icon}
                        <span className="text-xs font-black text-white">
                          {srv.name}
                        </span>
                        {isCurrentService && (
                          <span className="text-[9.5px] font-bold text-accent-green bg-accent-green/15 px-1.5 py-0.2 rounded border border-accent-green/30">
                            ★ Layanan Customer
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${themeClasses.badge}`}>
                        {srvSlots.length} Slot Terbuka
                      </span>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {srvSlots.map((sDef) => {
                        const occupied = occupiedSlots[sDef.key];
                        const isSelected = slot === sDef.key;

                        if (occupied) {
                          return (
                            <div
                              key={sDef.key}
                              className="p-2 rounded-xl border border-accent-red/30 bg-[#151821] flex flex-col justify-between min-h-[58px] opacity-75 cursor-not-allowed"
                            >
                              <div className="flex justify-between items-center text-[11px] font-mono font-black text-accent-red">
                                <span className="truncate">{sDef.displayLabel}</span>
                                <span className="w-2 h-2 rounded-full bg-accent-red shrink-0" />
                              </div>
                              <div>
                                <div className="text-[9.5px] text-white font-bold truncate">{occupied.username}</div>
                                <div className="text-[9px] text-text-dim font-mono">
                                  {occupied.paused ? '⏸ Pause' : `${formatTime(occupied.remaining)}`}
                                </div>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <button
                            key={sDef.key}
                            type="button"
                            onClick={() => setSlot(sDef.key)}
                            className={`p-2 rounded-xl border text-left flex flex-col justify-between min-h-[58px] transition-all cursor-pointer ${
                              isSelected
                                ? themeClasses.slotSelected
                                : themeClasses.slotDefault
                            }`}
                          >
                            <div className="flex justify-between items-center text-[11px] font-black">
                              <span className={`font-mono text-xs font-black truncate ${isSelected ? 'text-white' : themeClasses.pill}`}>
                                {sDef.displayLabel}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-accent-green shrink-0 shadow-sm shadow-accent-green/50 animate-pulse" />
                            </div>
                            <div className="text-[9.5px] text-accent-green font-bold">
                              {isSelected ? '✓ Terpilih' : '🟢 Kosong'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-accent-green hover:bg-accent-green-dark active:scale-95 transition-all shadow-lg shadow-accent-green/25 disabled:opacity-50 cursor-pointer"
            >
              <Play size={14} />
              <span>{loading ? 'Memproses...' : `✔ Mulai ${formatSlotLabel ? formatSlotLabel(slot, queueItem.service) : 'Slot ' + slot}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartBillingModal;
