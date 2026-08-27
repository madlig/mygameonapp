import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Play, X, User, Layers, CheckCircle2, AlertCircle, Crown, Gem } from 'lucide-react';

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
  const { customers, suggestSlot, startBillingFromQueue, addToast } = useJoki();
  const [slot, setSlot] = useState(1);
  const [loading, setLoading] = useState(false);

  const cleanService = (queueItem?.service || 'Basic').toUpperCase();
  const isVVIP = cleanService === 'VVIP';
  const isVIP = !isVVIP && cleanService === 'VIP';

  useEffect(() => {
    if (queueItem) {
      if (isVVIP) {
        setSlot('VVIP');
      } else if (isVIP) {
        setSlot('VIP');
      } else {
        setSlot(suggestSlot());
      }
    }
  }, [queueItem, customers, isVVIP, isVIP]);

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
      const chosenSlot = isVVIP ? 'VVIP' : (isVIP ? 'VIP' : slot);
      await startBillingFromQueue(queueItem, chosenSlot);
      addToast(`Customer ${queueItem.username} berhasil dimasukkan ke Slot ${chosenSlot}!`, 'success');
      onClose();
    } catch (err) {
      console.error('Start billing error:', err);
      addToast('Gagal memulai billing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const standardSlots = [1, 2, 3, 4, 5, 6];

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
              Pilih slot kosong untuk memulai billing countdown
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
              {isVVIP ? '💎 VVIP' : (isVIP ? '👑 VIP' : queueItem.service)}
            </span>
            <div className="text-text-muted font-mono font-bold text-xs">{formatDuration(queueItem.duration)}</div>
          </div>
        </div>

        {/* Visual Slot Selector */}
        <form onSubmit={handleConfirm} className="space-y-4">
          {isVVIP ? (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-center">
              <div className="text-lg font-black text-rose-300 mb-1 flex items-center justify-center gap-1.5">
                <Gem size={18} className="text-rose-400" />
                <span>💎 SLOT VVIP (SUPER PRIORITY)</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                Customer layanan VVIP akan langsung dialokasikan ke Slot VVIP khusus.
              </p>
            </div>
          ) : isVIP ? (
            <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-4 text-center">
              <div className="text-lg font-black text-accent-yellow mb-1 flex items-center justify-center gap-1.5">
                <Crown size={18} className="text-accent-yellow" />
                <span>👑 SLOT VIP</span>
              </div>
              <p className="text-xs text-text-muted m-0">
                Customer layanan VIP akan langsung dialokasikan ke Slot VIP khusus.
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                  Pilih Slot Live AFK (1 - 6)
                </label>
                <span className="text-[11px] text-text-dim">
                  Slot Terpilih: <strong className="text-accent-cyan font-mono">SLOT {slot}</strong>
                </span>
              </div>

              {/* 6-Slot Visual Grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {standardSlots.map((s) => {
                  const sStr = s.toString();
                  const occupied = occupiedSlots[sStr];
                  const isSelected = slot.toString() === sStr;

                  if (occupied) {
                    return (
                      <div
                        key={s}
                        className="p-2.5 rounded-xl border border-accent-red/20 bg-accent-red/5 flex flex-col justify-between min-h-[64px] opacity-75 cursor-not-allowed"
                      >
                        <div className="flex justify-between items-center text-[11px] font-extrabold text-accent-red">
                          <span>SLOT {s}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                        </div>
                        <div>
                          <div className="text-[10px] text-white font-bold truncate">{occupied.username}</div>
                          <div className="text-[9.5px] text-text-dim font-mono">
                            {occupied.paused ? '⏸ Di-pause' : `Sisa ${formatTime(occupied.remaining)}`}
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
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between min-h-[64px] transition-all cursor-pointer ${
                        isSelected
                          ? 'border-accent-green bg-accent-green/15 shadow-md shadow-accent-green/10'
                          : 'border-border-default bg-bg-primary hover:border-accent-cyan/50 hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[11px] font-black">
                        <span className={isSelected ? 'text-accent-green' : 'text-text-secondary'}>SLOT {s}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-accent-green animate-ping' : 'bg-accent-cyan'}`} />
                      </div>
                      <div className="text-[9.5px] text-text-dim">
                        {isSelected ? '✓ Terpilih' : 'Klik untuk pilih'}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Slot Number Option */}
              <div className="flex items-center gap-2 p-2 bg-bg-primary/60 rounded-xl border border-border-subtle">
                <span className="text-[11px] text-text-tertiary shrink-0">Slot Khusus (7+):</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={slot}
                  onChange={(e) => setSlot(Number(e.target.value) || 1)}
                  className="w-20 bg-bg-surface border border-border-default rounded-lg py-1 px-2 text-xs text-text-primary font-mono text-center outline-none focus:border-accent-cyan/50"
                />
                <span className="text-[10.5px] text-text-dim">Isi nomor manual jika ada slot tambahan.</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-green hover:bg-accent-green-dark active:scale-95 transition-all shadow-lg shadow-accent-green/20 disabled:opacity-50"
            >
              <Play size={14} />
              <span>{loading ? 'Memproses...' : `✔ Mulai Billing ${isVVIP ? 'VVIP' : (isVIP ? 'VIP' : 'Slot ' + slot)}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartBillingModal;
