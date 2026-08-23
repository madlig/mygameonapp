import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Clock, X } from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const ExtendModal = ({ customer, onClose }) => {
  const { updateJokiCustomer, addToast } = useJoki();
  const [amount, setAmount] = useState(15);
  const [unit, setUnit] = useState('minute');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setAmount(15);
      setUnit('minute');
    }
  }, [customer]);

  if (!customer) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const numAmount = Number(amount);

    if (!numAmount || numAmount <= 0) {
      addToast('Jumlah waktu harus lebih dari 0.', 'error');
      return;
    }

    if (customer.finished) {
      addToast('Billing customer ini sudah selesai.', 'error');
      onClose();
      return;
    }

    try {
      setLoading(true);
      const seconds = unit === 'hour' ? numAmount * 3600 : numAmount * 60;
      const updates = {};

      if (customer.paused) {
        updates.remainingAtPause = (customer.remainingAtPause || 0) + seconds;
      } else {
        updates.endTime = customer.endTime + seconds * 1000;
      }

      updates.duration = (customer.duration || 0) + seconds / 3600;

      const isVIP = customer.service && customer.service.toUpperCase().includes('VIP');
      const pricePerHour = isVIP ? PRICE_VIP : PRICE_BASIC;
      updates.price = (customer.price || 0) + pricePerHour * (seconds / 3600);

      await updateJokiCustomer(customer.id, updates);
      addToast(`Waktu joki ${customer.username || customer.name} berhasil ditambah ${numAmount} ${unit === 'hour' ? 'Jam' : 'Menit'}!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Gagal menambah waktu joki.', 'error');
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
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/25 flex items-center justify-center text-accent-purple shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              Tambah Waktu Joki
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Perpanjang durasi billing customer
            </p>
          </div>
        </div>

        {/* Customer Badge */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-bold text-text-dim">Customer</div>
            <div className="text-xs font-bold text-text-primary">{customer.username || customer.name}</div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30">
            {customer.service}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
                Jumlah
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
                Satuan
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 transition-colors cursor-pointer"
              >
                <option value="minute" className="bg-bg-surface">Menit</option>
                <option value="hour" className="bg-bg-surface">Jam</option>
              </select>
            </div>
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
              {loading ? 'Memproses...' : 'Tambah Durasi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendModal;
