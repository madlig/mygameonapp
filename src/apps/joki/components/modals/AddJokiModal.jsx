import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Plus, X, User, Shield, Layers, Clock } from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const AddJokiModal = ({ isOpen, onClose }) => {
  const { addJokiCustomer, globalPaused, suggestSlot, addToast } = useJoki();
  const [username, setUsername] = useState('');
  const [tiktokName, setTiktokName] = useState('');
  const [service, setService] = useState('Basic');
  const [slot, setSlot] = useState(1);
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setTiktokName('');
      setService('Basic');
      setSlot(suggestSlot());
      setDuration(1);
    }
  }, [isOpen]);

  // Sync slot with service change
  const handleServiceChange = (e) => {
    const val = e.target.value;
    setService(val);
    if (val === 'VIP') {
      setSlot('VIP');
    } else {
      setSlot(suggestSlot());
    }
  };

  if (!isOpen) return null;

  const isVIP = service === 'VIP';

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      addToast('Username Roblox wajib diisi.', 'error');
      return;
    }
    if (!duration || Number(duration) <= 0) {
      addToast('Durasi harus lebih dari 0.', 'error');
      return;
    }

    try {
      setLoading(true);
      const now = Date.now();
      const numDuration = Number(duration);
      const durationSeconds = numDuration * 3600;
      const pricePerHour = isVIP ? PRICE_VIP : PRICE_BASIC;
      const chosenSlot = isVIP ? 'VIP' : slot;

      const customer = {
        username: username.trim(),
        tiktokName: tiktokName.trim().replace(/^@/, ''),
        name: username.trim(),
        service,
        slot: chosenSlot,
        duration: numDuration,
        price: numDuration * pricePerHour,
        paymentStatus: 'Lunas',
        startTime: now,
        endTime: now + (durationSeconds * 1000),
        paused: false,
        pauseStarted: null,
        remainingAtPause: null,
        totalPausedSeconds: 0,
        finished: false,
        stopped: false,
        stopTime: null,
        finishedTime: null
      };

      if (globalPaused) {
        customer.paused = true;
        customer.pauseStarted = now;
        customer.remainingAtPause = durationSeconds;
      }

      await addJokiCustomer(customer);
      addToast(`Joki ${username} berhasil ditambahkan di Slot ${chosenSlot}!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Gagal menambahkan data joki.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative"
        style={{ background: '#111317' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/25 flex items-center justify-center text-accent-purple shrink-0">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              Tambah Billing Joki Langsung
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Mulai billing langsung ke slot game live
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          {/* Roblox Username */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Username Roblox <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Ozann11223344"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors"
              />
            </div>
          </div>

          {/* TikTok Account Name */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Nama Akun TikTok (Opsional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-cyan font-bold text-sm">@</span>
              <input
                type="text"
                placeholder="Contoh: my idol plado"
                value={tiktokName}
                onChange={(e) => setTiktokName(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors"
              />
            </div>
          </div>

          {/* Service & Slot Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
                Layanan Joki
              </label>
              <select
                value={service}
                onChange={handleServiceChange}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 transition-colors cursor-pointer"
              >
                <option value="Basic">Basic — Rp 4k/j</option>
                <option value="VIP">VIP — Rp 6k/j</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
                Nomor Slot
              </label>
              {isVIP ? (
                <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl py-2 px-3 text-xs text-accent-yellow font-extrabold text-center">
                  VIP (Otomatis)
                </div>
              ) : (
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-8 pr-2.5 text-xs text-text-primary font-mono outline-none focus:border-accent-purple/50 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Durasi (Jam)
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors font-mono"
              />
            </div>
            <p className="text-[11px] text-text-dim mt-1">
              💡 Contoh: <span className="text-text-muted">1</span> = 1 Jam, <span className="text-text-muted">0.5</span> = 30 Menit.
            </p>
          </div>

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
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-lg shadow-accent-purple/20 disabled:opacity-50"
            >
              {loading ? 'Menambahkan...' : 'Tambahkan ke Billing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJokiModal;
