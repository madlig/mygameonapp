import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Play, X, User, Shield, Layers, Clock } from 'lucide-react';

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const StartBillingModal = ({ queueItem, onClose }) => {
  const { suggestSlot, startBillingFromQueue, addToast } = useJoki();
  const [slot, setSlot] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (queueItem) {
      if (queueItem.service === 'VIP') {
        setSlot('VIP');
      } else {
        setSlot(suggestSlot());
      }
    }
  }, [queueItem]);

  if (!queueItem) return null;

  const isVIP = queueItem.service === 'VIP';

  const handleConfirm = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      const chosenSlot = isVIP ? 'VIP' : slot;
      await startBillingFromQueue(queueItem, chosenSlot);
      addToast(`Billing untuk ${queueItem.username} berhasil dimulai di Slot ${chosenSlot}!`, 'success');
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
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative"
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
              Mulai Billing Joki?
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Alokasikan antrian ke slot game live
            </p>
          </div>
        </div>

        {/* Customer Info Card */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 mb-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Username Roblox:</span>
            <span className="font-extrabold text-text-primary text-sm">{queueItem.username}</span>
          </div>

          {queueItem.tiktokName && (
            <div className="flex justify-between items-center text-text-secondary">
              <span className="text-text-tertiary">Akun TikTok:</span>
              <span className="text-accent-cyan font-semibold">@{queueItem.tiktokName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Layanan:</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
              isVIP 
                ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
                : 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
            }`}>
              {queueItem.service}
            </span>
          </div>

          <div className="flex justify-between items-center text-text-secondary">
            <span className="text-text-tertiary">Durasi Order:</span>
            <span className="font-mono">{formatDuration(queueItem.duration)}</span>
          </div>
        </div>

        {/* Slot Selection */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Alokasi Slot Live
            </label>
            {isVIP ? (
              <div className="w-full bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl py-2.5 px-3.5 text-xs text-accent-yellow font-extrabold text-center tracking-wider">
                👑 SLOT VIP (Otomatis)
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary font-mono outline-none focus:border-accent-purple/50 transition-colors"
                  />
                </div>
                <p className="text-[11px] text-text-dim mt-1.5">
                  💡 Disarankan otomatis memakai Slot {suggestSlot()} yang sedang kosong.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-subtle">
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-green hover:bg-accent-green/90 active:scale-95 transition-all shadow-lg shadow-accent-green/20 disabled:opacity-50"
            >
              <Play size={14} />
              <span>{loading ? 'Memulai...' : '✔ Ya, Mulai Billing'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartBillingModal;
