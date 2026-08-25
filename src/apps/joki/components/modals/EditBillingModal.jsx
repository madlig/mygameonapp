import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Edit3, X, User, DollarSign, Layers, Check, AlertCircle } from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
};

const EditBillingModal = ({ customer, onClose }) => {
  const { customers, updateJokiCustomer, addToast } = useJoki();

  const [username, setUsername] = useState('');
  const [tiktokName, setTiktokName] = useState('');
  const [service, setService] = useState('Basic');
  const [slot, setSlot] = useState(1);
  const [price, setPrice] = useState(4000);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setUsername(customer.username || customer.name || '');
      setTiktokName(customer.tiktokName || '');
      setService(customer.service || 'Basic');
      setSlot(customer.slot || 1);
      setPrice(Math.round(customer.price || 0));
    }
  }, [customer]);

  if (!customer) return null;

  const isVIP = service === 'VIP';
  const standardSlots = [1, 2, 3, 4, 5, 6];

  // Map occupied slots from active customers (excluding currently edited customer)
  const occupiedSlots = {};
  customers.forEach(c => {
    if (!c.finished && c.id !== customer.id && c.slot) {
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

  const handleServiceChange = (e) => {
    const val = e.target.value;
    setService(val);
    if (val === 'VIP') {
      setSlot('VIP');
    } else if (slot === 'VIP') {
      setSlot(1);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      addToast('Username Roblox tidak boleh kosong.', 'error');
      return;
    }

    try {
      setLoading(true);
      const chosenSlot = isVIP ? 'VIP' : slot;

      const updates = {
        username: username.trim(),
        name: username.trim(),
        tiktokName: tiktokName.trim().replace(/^@/, ''),
        service: service,
        slot: chosenSlot,
        price: Math.round(Number(price || 0)),
      };

      await updateJokiCustomer(customer.id, updates);
      addToast(`Data billing ${username} berhasil diperbarui!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Gagal memperbarui data billing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-lg bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative max-h-[90vh] overflow-y-auto"
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
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
            <Edit3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              Edit Data Billing Aktif
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Koreksi data akun tertukar, salah nama, atau pindah slot
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Section 1: Customer Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                Username Roblox <span className="text-accent-red">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50 shadow-inner font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                Akun TikTok
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-cyan">@</span>
                <input
                  type="text"
                  value={tiktokName}
                  onChange={(e) => setTiktokName(e.target.value)}
                  className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-8 pr-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50 shadow-inner"
                  placeholder="username_tiktok"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Layanan & Harga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                Layanan
              </label>
              <select
                value={service}
                onChange={handleServiceChange}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50 cursor-pointer shadow-inner font-bold"
              >
                <option value="Basic">Basic (Rp 4.000 / Jam)</option>
                <option value="VIP">VIP (Rp 6.000 / Jam - Priority)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                Total Harga (Rp)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-yellow" />
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-accent-yellow font-bold font-mono outline-none focus:border-accent-yellow/50 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Visual Slot Selector & Migration */}
          <div className="pt-2 border-t border-border-subtle">
            {isVIP ? (
              <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl p-3.5 text-center">
                <div className="text-sm font-black text-accent-yellow mb-0.5">👑 SLOT VIP</div>
                <p className="text-[11px] text-text-muted m-0">
                  Customer berada di Slot VIP.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider">
                    Pilih / Pindah Slot AFK (1 - 6)
                  </label>
                  <span className="text-[11px] text-text-dim">
                    Slot Terpilih: <strong className="text-accent-cyan font-mono">SLOT {slot}</strong>
                  </span>
                </div>

                {/* 6-Slot Visual Grid */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {standardSlots.map((s) => {
                    const sStr = s.toString();
                    const occupied = occupiedSlots[sStr];
                    const isSelected = slot.toString() === sStr;
                    const isCurrentCustomerSlot = customer.slot && customer.slot.toString() === sStr;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[64px] ${
                          isSelected
                            ? 'bg-accent-cyan/15 border-accent-cyan shadow-md shadow-accent-cyan/20 ring-1 ring-accent-cyan'
                            : occupied
                            ? 'bg-bg-primary/80 border-accent-red/25 hover:border-accent-red/40'
                            : 'bg-bg-primary border-border-default hover:border-border-muted hover:bg-white/[0.02]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-black ${
                            isSelected ? 'text-accent-cyan' : occupied ? 'text-text-primary' : 'text-text-secondary'
                          }`}>
                            SLOT {s}
                          </span>
                          
                          {isCurrentCustomerSlot ? (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-accent-purple/20 text-accent-purple-light border border-accent-purple/30">
                              Posisi Sekarang
                            </span>
                          ) : occupied ? (
                            <span className="w-2 h-2 rounded-full bg-accent-red animate-pulse" title="Terpakai akun lain" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-accent-green" title="Kosong" />
                          )}
                        </div>

                        {occupied ? (
                          <div className="mt-1">
                            <div className="text-[11px] font-extrabold text-white truncate">
                              {occupied.username}
                            </div>
                            <div className="text-[9.5px] font-mono text-accent-red font-bold">
                              {occupied.paused ? 'PAUSED' : formatTime(occupied.remaining)}
                            </div>
                          </div>
                        ) : !isCurrentCustomerSlot ? (
                          <div className="mt-1">
                            <span className="text-[10px] font-bold text-accent-green">
                              🟢 KOSONG
                            </span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-bg-primary bg-accent-cyan hover:bg-accent-cyan/90 active:scale-95 transition-all shadow-lg shadow-accent-cyan/25 cursor-pointer disabled:opacity-50"
            >
              <Check size={15} />
              <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBillingModal;
