import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Plus, X, User, Shield, Clock } from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const SERVICE_OPTIONS = [
  { value: 'Basic', label: 'Basic — Rp 4.000 / Jam', rate: PRICE_BASIC },
  { value: 'VIP', label: 'VIP — Rp 6.000 / Jam', rate: PRICE_VIP },
  { value: 'Basic (AFK1)', label: 'Basic Slot 1 — Rp 4.000 / Jam', rate: PRICE_BASIC },
  { value: 'Basic (AFK2)', label: 'Basic Slot 2 — Rp 4.000 / Jam', rate: PRICE_BASIC },
  { value: 'Basic (AFK3)', label: 'Basic Slot 3 — Rp 4.000 / Jam', rate: PRICE_BASIC },
  { value: 'Basic (AFK4)', label: 'Basic Slot 4 — Rp 4.000 / Jam', rate: PRICE_BASIC },
  { value: 'Basic (AFK5)', label: 'Basic Slot 5 — Rp 4.000 / Jam', rate: PRICE_BASIC },
  { value: 'Basic (AFK6)', label: 'Basic Slot 6 — Rp 4.000 / Jam', rate: PRICE_BASIC },
];

const AddJokiModal = ({ isOpen, onClose }) => {
  const { addJokiCustomer, globalPaused, addToast } = useJoki();
  const [username, setUsername] = useState('');
  const [tiktokName, setTiktokName] = useState('');
  const [service, setService] = useState('Basic');
  const [duration, setDuration] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setTiktokName('');
      setService('Basic');
      setDuration(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      addToast('Username Roblox wajib diisi.', 'error');
      return;
    }
    if (!tiktokName.trim()) {
      addToast('Nama Akun TikTok wajib diisi.', 'error');
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
      
      const selectedOption = SERVICE_OPTIONS.find(o => o.value === service);
      const pricePerHour = selectedOption ? selectedOption.rate : (service.includes('VIP') ? PRICE_VIP : PRICE_BASIC);

      const customer = {
        username: username.trim(),
        tiktokName: tiktokName.trim().replace(/^@/, ''),
        name: username.trim(),
        service,
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
      addToast(`Joki ${username} berhasil ditambahkan ke antrean!`, 'success');
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
              Tambah Customer Joki
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Input data akun Roblox & TikTok untuk billing baru
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
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
              Nama Akun TikTok <span className="text-accent-red">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-accent-cyan font-bold text-sm">@</span>
              <input
                type="text"
                required
                placeholder="Contoh: my idol plado"
                value={tiktokName}
                onChange={(e) => setTiktokName(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors"
              />
            </div>
          </div>

          {/* Service / Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Layanan / Slot Joki
            </label>
            <div className="relative">
              <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary outline-none focus:border-accent-purple/50 transition-colors cursor-pointer"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-bg-surface text-text-primary">
                    {opt.label}
                  </option>
                ))}
              </select>
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
            <p className="text-[11px] text-text-dim mt-1.5">
              💡 Contoh: <span className="text-text-muted">1</span> = 1 Jam, <span className="text-text-muted">0.5</span> = 30 Menit, <span className="text-text-muted">0.25</span> = 15 Menit.
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
              {loading ? 'Menambahkan...' : 'Tambahkan Joki'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJokiModal;
