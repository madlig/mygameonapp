import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Clock, X, Plus, DollarSign, Check } from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const EXTEND_PRESETS = [
  { label: '+15 Menit', minutes: 15, hint: 'Free' },
  { label: '+30 Menit', minutes: 30, hint: 'Setengah Jam' },
  { label: '+45 Menit', minutes: 45, hint: '+30m tarif' },
  { label: '+1 Jam', minutes: 60, hint: '1 Jam Penuh' },
  { label: '+2 Jam', minutes: 120, hint: '2 Jam' },
  { label: '+3 Jam', minutes: 180, hint: '3 Jam' },
];

const ExtendModal = ({ customer, onClose }) => {
  const { updateJokiCustomer, addToast } = useJoki();
  const [amount, setAmount] = useState(30);
  const [unit, setUnit] = useState('minute'); // 'minute' | 'hour'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setAmount(30);
      setUnit('minute');
    }
  }, [customer]);

  if (!customer) return null;

  const isVIP = customer.service && customer.service.toUpperCase().includes('VIP');
  const pricePerHour = isVIP ? PRICE_VIP : PRICE_BASIC;
  const pricePerHalfHour = pricePerHour / 2; // Rp 2.000 (Basic) or Rp 3.000 (VIP)

  // Total additional minutes
  const totalMinutesAdded = unit === 'hour' ? Number(amount || 0) * 60 : Number(amount || 0);

  // Pricing rule requested by Riyan:
  // If added time is < 30 minutes -> Rp 0 (Bonus / Free compensation)
  // If added time >= 30 minutes -> Charged per 30 minutes block (e.g. 30m = 1 block, 45m = 1 block, 60m = 2 blocks)
  const halfHourBlocks = Math.floor(totalMinutesAdded / 30);
  const additionalCost = Math.round(halfHourBlocks * pricePerHalfHour);
  const newTotalPrice = Math.round(Number(customer.price || 0) + additionalCost);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!totalMinutesAdded || totalMinutesAdded <= 0) {
      addToast('Jumlah penambahan waktu harus lebih dari 0.', 'error');
      return;
    }

    if (customer.finished) {
      addToast('Billing customer ini sudah selesai.', 'error');
      onClose();
      return;
    }

    try {
      setLoading(true);
      const additionalSeconds = totalMinutesAdded * 60;
      const additionalHours = totalMinutesAdded / 60;
      const updates = {};

      if (customer.paused) {
        updates.remainingAtPause = (customer.remainingAtPause || 0) + additionalSeconds;
      } else {
        updates.endTime = customer.endTime + (additionalSeconds * 1000);
      }

      // Update total duration and strictly rounded price
      updates.duration = Number(((customer.duration || 0) + additionalHours).toFixed(2));
      updates.price = newTotalPrice;

      await updateJokiCustomer(customer.id, updates);
      addToast(
        `Waktu joki ${customer.username || customer.name} ditambah ${totalMinutesAdded} menit! (+Rp ${additionalCost.toLocaleString('id-ID')})`,
        'success'
      );
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
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors p-1 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple shrink-0">
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
            <div className="text-[10px] uppercase font-bold text-text-dim">Customer Slot {customer.slot}</div>
            <div className="text-xs font-bold text-text-primary">{customer.username || customer.name}</div>
          </div>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
            isVIP 
              ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
              : 'bg-accent-purple/15 text-accent-purple-light border border-accent-purple/30'
          }`}>
            {customer.service}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary mb-1.5">
              Pilihan Cepat Tambah Waktu:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {EXTEND_PRESETS.map((p) => {
                const isSelected = totalMinutesAdded === p.minutes;
                const cost = Math.round(Math.floor(p.minutes / 30) * pricePerHalfHour);

                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setAmount(p.minutes);
                      setUnit('minute');
                    }}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-accent-purple text-white border-accent-purple shadow-md shadow-accent-purple/20 scale-105'
                        : 'bg-bg-primary border-border-default text-text-muted hover:text-text-primary hover:border-border-muted'
                    }`}
                  >
                    <div className="text-xs font-black">{p.label}</div>
                    <div className={`text-[9.5px] mt-0.5 font-mono ${
                      isSelected ? 'text-accent-yellow' : cost === 0 ? 'text-accent-green' : 'text-text-dim'
                    }`}>
                      {cost === 0 ? 'Free (Rp 0)' : `+Rp ${cost.toLocaleString('id-ID')}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration Input */}
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
              Atau Input Manual
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-bg-primary border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 shadow-inner font-mono font-bold"
                placeholder="Jumlah waktu"
              />
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-24 bg-bg-primary border border-border-default rounded-xl py-2 px-2 text-xs text-text-primary outline-none focus:border-accent-purple/50 cursor-pointer font-bold"
              >
                <option value="minute">Menit</option>
                <option value="hour">Jam</option>
              </select>
            </div>
          </div>

          {/* Pricing Preview */}
          <div className="bg-bg-primary border border-border-subtle rounded-xl p-3 text-xs space-y-1 font-mono">
            <div className="flex justify-between text-text-secondary">
              <span>Tambahan Waktu:</span>
              <strong className="text-white">+{totalMinutesAdded} Menit</strong>
            </div>
            <div className="flex justify-between text-text-secondary">
              <span>Biaya Tambahan:</span>
              <strong className={additionalCost > 0 ? 'text-accent-yellow font-bold' : 'text-accent-green font-bold'}>
                {additionalCost > 0 ? `+Rp ${additionalCost.toLocaleString('id-ID')}` : 'Rp 0 (Free)'}
              </strong>
            </div>
            <div className="flex justify-between text-text-primary border-t border-border-subtle pt-1 font-bold">
              <span>Total Harga Akhir:</span>
              <span className="text-accent-yellow font-black text-sm">
                Rp {newTotalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-subtle">
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-lg shadow-accent-purple/25 cursor-pointer disabled:opacity-50"
            >
              <Check size={15} />
              <span>{loading ? 'Menyimpan...' : 'Tambah Waktu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExtendModal;
