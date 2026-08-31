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
    configuredSlots,
    getServiceDetails,
    suggestSlot, 
    startBillingFromQueue, 
    addToast 
  } = useJoki();

  const [slot, setSlot] = useState(1);
  const [loading, setLoading] = useState(false);

  const currentServiceDetails = getServiceDetails(queueItem?.service);
  const isVVIP = currentServiceDetails.tier === 'VVIP';
  const isVIP = currentServiceDetails.tier === 'VIP';
  const designatedSlots = currentServiceDetails.slots || [];

  useEffect(() => {
    if (queueItem) {
      setSlot(suggestSlot(queueItem.service));
    }
  }, [queueItem, customers]);

  if (!queueItem) return null;

  // Map active customers by slot
  const occupiedSlots = {};
  customers.forEach(c => {
    if (!c.finished && c.slot) {
      const remaining = c.paused 
        ? (c.remainingAtPause || 0)
        : Math.max(0, Math.floor((c.endTime - Date.now()) / 1000));
      
      occupiedSlots[c.slot.toString()] = {
        username: c.username || c.name,
        remaining,
        paused: c.paused,
      };
    }
  });

  const handleConfirm = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      await startBillingFromQueue(queueItem, slot);
      addToast(`Customer ${queueItem.username} berhasil dimasukkan ke Slot ${slot}!`, 'success');
      onClose();
    } catch (err) {
      console.error('Start billing error:', err);
      addToast('Gagal memulai billing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative"
        style={{ background: '#111317' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 border border-accent-green/25 flex items-center justify-center text-accent-green shrink-0">
            <Play size={20} className="ml-0.5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              Alokasikan Antrian ke Slot Live
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Pilih slot live untuk memulai billing countdown
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-3.5 mb-4 flex items-center justify-between gap-3 text-xs">
          <div>
            <div className="text-[10.5px] uppercase font-bold text-text-dim">Customer Antrian</div>
            <div className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>{queueItem.username}</span>
              {queueItem.tiktokName && (
                <span className="text-xs font-semibold text-accent-cyan">(@{queueItem.tiktokName})</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className={`inline-block font-bold px-2 py-0.5 rounded-full text-[10px] mb-1 ${
              isVVIP
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : isVIP 
                ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
                : 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
            }`}>
              {isVVIP ? <Gem size={10} className="inline mr-1" /> : isVIP ? <Crown size={10} className="inline mr-1" /> : <Gamepad2 size={10} className="inline mr-1" />}
              {currentServiceDetails.name || queueItem.service}
            </span>
            <div className="text-text-muted font-mono font-bold text-xs">{formatDuration(queueItem.duration)}</div>
          </div>
        </div>

        {/* Visual Slot Selector */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block">
                  Pilih Slot Live AFK
                </label>
                {designatedSlots.length > 0 && (
                  <span className="text-[10px] text-cyan-300 font-bold block">
                    Alokasi {currentServiceDetails.name}: Slot {designatedSlots.join(', ')}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-text-dim">
                Slot Terpilih: <strong className="text-accent-green font-mono text-xs">SLOT {slot}</strong>
              </span>
            </div>

            {/* Visual Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
              {configuredSlots.map((s) => {
                const sStr = s.toString();
                const occupied = occupiedSlots[sStr];
                const isSelected = slot.toString() === sStr;
                const isDesignated = designatedSlots.includes(s);

                if (occupied) {
                  return (
                    <div
                      key={s}
                      className="p-2 rounded-xl border border-accent-red/20 bg-accent-red/5 flex flex-col justify-between min-h-[58px] opacity-75 cursor-not-allowed"
                    >
                      <div className="flex justify-between items-center text-[11px] font-extrabold text-accent-red">
                        <span>SLOT {s}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                      </div>
                      <div>
                        <div className="text-[10px] text-white font-bold truncate">{occupied.username}</div>
                        <div className="text-[9px] text-text-dim font-mono">
                          {occupied.paused ? '⏸ Pause' : `${formatTime(occupied.remaining)}`}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`p-2 rounded-xl border text-left flex flex-col justify-between min-h-[58px] transition-all cursor-pointer ${
                      isSelected
                        ? 'border-accent-green bg-accent-green/20 ring-2 ring-accent-green/60 shadow-md shadow-accent-green/10'
                        : isDesignated
                        ? isVVIP
                          ? 'border-rose-500/40 bg-rose-950/20 hover:border-rose-400'
                          : isVIP
                          ? 'border-amber-500/40 bg-amber-950/20 hover:border-amber-400'
                          : 'border-cyan-500/30 bg-bg-primary hover:border-cyan-400'
                        : 'border-border-default bg-bg-primary hover:border-accent-cyan/50 hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex justify-between items-center text-[11px] font-black">
                      <span className={isSelected ? 'text-accent-green' : 'text-text-secondary'}>SLOT {s}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-accent-green animate-ping' : 'bg-accent-green'}`} />
                    </div>
                    <div className="text-[9px] text-emerald-400 font-bold">
                      {isSelected ? '✓ Terpilih' : '🟢 Kosong'}
                    </div>
                  </button>
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-green hover:bg-accent-green-dark active:scale-95 transition-all shadow-lg shadow-accent-green/20 disabled:opacity-50 cursor-pointer"
            >
              <Play size={14} />
              <span>{loading ? 'Memproses...' : `✔ Mulai Billing Slot ${slot}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartBillingModal;
