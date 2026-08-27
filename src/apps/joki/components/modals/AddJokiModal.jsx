import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Plus, 
  X, 
  User, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign,
  Sparkles
} from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;
const PRICE_VVIP = 10000;

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

const DURATION_PRESETS = [
  { label: '30m', hours: 0.5 },
  { label: '1 Jam', hours: 1 },
  { label: '2 Jam', hours: 2 },
  { label: '3 Jam', hours: 3 },
  { label: '4 Jam', hours: 4 },
  { label: '5 Jam', hours: 5 },
];

const AddJokiModal = ({ isOpen, onClose }) => {
  const { customers, addJokiCustomer, globalPaused, suggestSlot, addToast } = useJoki();
  const [username, setUsername] = useState('');
  const [tiktokName, setTiktokName] = useState('');
  const [passwordRoblox, setPasswordRoblox] = useState('');
  const [emailRoblox, setEmailRoblox] = useState('');
  const [service, setService] = useState('Basic');
  const [slot, setSlot] = useState(1);
  const [durationValue, setDurationValue] = useState(1);
  const [durationUnit, setDurationUnit] = useState('hour'); // 'minute' | 'hour'
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUsername('');
      setTiktokName('');
      setPasswordRoblox('');
      setEmailRoblox('');
      setService('Basic');
      setSlot(suggestSlot());
      setDurationValue(1);
      setDurationUnit('hour');
    }
  }, [isOpen, customers]);

  // Sync slot with service change
  const handleServiceChange = (e) => {
    const val = e.target.value;
    setService(val);
    if (val === 'VVIP') {
      setSlot('VVIP');
    } else if (val === 'VIP') {
      setSlot('VIP');
    } else {
      setSlot(suggestSlot());
    }
  };

  if (!isOpen) return null;

  const isVVIP = service === 'VVIP';
  const isVIP = !isVVIP && service === 'VIP';
  const standardSlots = [1, 2, 3, 4, 5, 6];

  // Unique repeat customer list for autocomplete
  const customerHistoryMap = {};
  customers.forEach(c => {
    const u = (c.username || c.name || '').trim();
    if (u && !customerHistoryMap[u.toLowerCase()]) {
      customerHistoryMap[u.toLowerCase()] = {
        username: u,
        tiktokName: c.tiktokName || '',
        passwordRoblox: c.passwordRoblox || '',
        emailRoblox: c.emailRoblox || ''
      };
    }
  });

  const matchingSuggestions = username.trim()
    ? Object.values(customerHistoryMap).filter(c => 
        c.username.toLowerCase().includes(username.toLowerCase().trim())
      ).slice(0, 4)
    : [];

  const handleSelectSuggestion = (item) => {
    setUsername(item.username);
    if (item.tiktokName) setTiktokName(item.tiktokName);
    if (item.passwordRoblox) setPasswordRoblox(item.passwordRoblox);
    if (item.emailRoblox) setEmailRoblox(item.emailRoblox);
    setShowSuggestions(false);
    addToast(`Data pelanggan ${item.username} otomatis terisi!`, 'info');
  };

  // Map occupied slots from active customers
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

  // Calculate duration in hours and total price (rounded integer)
  const calculatedHours = durationUnit === 'hour' 
    ? Number(durationValue || 0)
    : Number(durationValue || 0) / 60;

  const pricePerHour = isVVIP ? PRICE_VVIP : (isVIP ? PRICE_VIP : PRICE_BASIC);
  const totalPrice = Math.round(calculatedHours * pricePerHour);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      addToast('Username Roblox wajib diisi.', 'error');
      return;
    }
    if (!calculatedHours || calculatedHours <= 0) {
      addToast('Durasi harus lebih dari 0.', 'error');
      return;
    }

    try {
      setLoading(true);
      const now = Date.now();
      const durationSeconds = calculatedHours * 3600;
      const chosenSlot = isVIP ? 'VIP' : slot;

      const customer = {
        username: username.trim(),
        tiktokName: tiktokName.trim().replace(/^@/, ''),
        passwordRoblox: passwordRoblox.trim(),
        emailRoblox: emailRoblox.trim(),
        name: username.trim(),
        service,
        slot: chosenSlot,
        duration: calculatedHours,
        price: totalPrice,
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-lg bg-bg-surface border border-border-default rounded-3xl p-6 shadow-2xl animate-slide-in relative max-h-[90vh] overflow-y-auto"
        style={{ background: '#111318' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-dim hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple shrink-0">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Tambah Order Joki Baru
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Input data customer & alokasikan langsung ke slot live
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Section 1: Data Customer & Brankas */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-bg-primary/90 border border-border-default shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Roblox Username with Autocomplete */}
              <div className="relative">
                <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                  Username Roblox <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: user_roblox123"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary font-bold outline-none focus:border-accent-purple/50 shadow-inner"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && matchingSuggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden">
                    <div className="px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-wider text-accent-cyan border-b border-border-subtle flex items-center gap-1">
                      <Sparkles size={11} />
                      <span>Pelanggan Lama (Klik utk Auto-Fill)</span>
                    </div>
                    {matchingSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSuggestion(sug)}
                        className="w-full px-3 py-2 text-left text-xs text-white hover:bg-accent-purple/15 flex items-center justify-between border-b border-border-subtle last:border-0 cursor-pointer"
                      >
                        <span className="font-black">{sug.username}</span>
                        <span className="text-[11px] text-accent-cyan">
                          {sug.tiktokName ? `@${sug.tiktokName}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                  Akun TikTok (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-cyan">@</span>
                  <input
                    type="text"
                    placeholder="username_tiktok"
                    value={tiktokName}
                    onChange={(e) => setTiktokName(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-7 pr-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Brankas Fields: Password & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-border-subtle">
              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1 flex items-center gap-1">
                  <Lock size={11} className="text-accent-cyan" />
                  <span>Password Roblox (Brankas Aman)</span>
                </label>
                <input
                  type="password"
                  placeholder="Password akun..."
                  value={passwordRoblox}
                  onChange={(e) => setPasswordRoblox(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary font-mono outline-none focus:border-accent-purple/50 shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1 flex items-center gap-1">
                  <Mail size={11} className="text-accent-purple-light" />
                  <span>Email Akun / OTP (Opsional)</span>
                </label>
                <input
                  type="text"
                  placeholder="email_customer@gmail.com"
                  value={emailRoblox}
                  onChange={(e) => setEmailRoblox(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Layanan & Durasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Pilih Layanan
              </label>
              <select
                value={service}
                onChange={handleServiceChange}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 cursor-pointer font-bold shadow-inner"
              >
                <option value="Basic">Basic (Rp 4.000 / Jam)</option>
                <option value="VIP">VIP (Rp 6.000 / Jam - Priority)</option>
                <option value="VVIP">VVIP (Rp 10.000 / Jam - Super Priority)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Durasi Joki
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  required
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  className="w-full bg-bg-primary border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary font-mono font-bold outline-none focus:border-accent-purple/50 shadow-inner"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  className="w-24 bg-bg-primary border border-border-default rounded-xl py-2 px-2 text-xs text-text-primary font-bold outline-none focus:border-accent-purple/50 cursor-pointer shadow-inner"
                >
                  <option value="hour">Jam</option>
                  <option value="minute">Menit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Duration Presets */}
          <div className="grid grid-cols-6 gap-1.5">
            {DURATION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (preset.hours < 1) {
                    setDurationValue(30);
                    setDurationUnit('minute');
                  } else {
                    setDurationValue(preset.hours);
                    setDurationUnit('hour');
                  }
                }}
                className="py-1.5 rounded-lg text-xs font-bold bg-bg-primary hover:bg-white/5 border border-border-subtle text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Section 3: Visual Slot Selector */}
          <div className="pt-2 border-t border-border-subtle">
            {isVVIP ? (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3 text-center">
                <div className="text-xs font-black text-rose-300">💎 SLOT VVIP (Alokasi Super Priority)</div>
              </div>
            ) : isVIP ? (
              <div className="bg-accent-yellow/10 border border-accent-yellow/30 rounded-2xl p-3 text-center">
                <div className="text-xs font-black text-accent-yellow">👑 SLOT VIP (Alokasi Khusus)</div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10.5px] font-extrabold text-text-dim uppercase tracking-wider">
                    Pilih Slot AFK (1 - 6)
                  </label>
                  <span className="text-[10.5px] text-text-dim">
                    Slot Terpilih: <strong className="text-accent-purple-light font-mono">SLOT {slot}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {standardSlots.map((s) => {
                    const sStr = s.toString();
                    const occupied = occupiedSlots[sStr];
                    const isSelected = slot.toString() === sStr;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSlot(s)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[56px] ${
                          isSelected
                            ? 'bg-accent-purple/20 border-accent-purple ring-1 ring-accent-purple'
                            : occupied
                            ? 'bg-bg-primary border-accent-red/25'
                            : 'bg-bg-primary border-border-default hover:border-border-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-xs font-black ${
                            isSelected ? 'text-accent-purple-light' : occupied ? 'text-text-primary' : 'text-text-secondary'
                          }`}>
                            SLOT {s}
                          </span>
                          {occupied ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                          )}
                        </div>
                        {occupied ? (
                          <div className="text-[10px] font-bold text-text-muted truncate mt-0.5">
                            {occupied.username}
                          </div>
                        ) : (
                          <div className="text-[9.5px] font-bold text-accent-green mt-0.5">
                            🟢 Kosong
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Pricing Preview Banner */}
          <div className="p-3 rounded-2xl bg-bg-primary border border-border-default flex items-center justify-between shadow-inner">
            <span className="text-xs text-text-dim font-bold">Total Biaya ({formatDuration(calculatedHours)}):</span>
            <span className="text-base font-black font-mono text-accent-yellow">
              Rp {totalPrice.toLocaleString('id-ID')}
            </span>
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
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-lg shadow-accent-purple/25 cursor-pointer disabled:opacity-50"
            >
              <Plus size={15} />
              <span>{loading ? 'Menyimpan...' : 'Mulai Billing Sekarang'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJokiModal;
