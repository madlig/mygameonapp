import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Edit3, 
  X, 
  User, 
  Lock, 
  Mail, 
  DollarSign, 
  Check, 
  Undo2, 
  Copy, 
  Eye, 
  EyeOff, 
  Clock, 
  Minus, 
  Plus, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const formatTime = (seconds) => {
  seconds = Math.max(0, Math.floor(seconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}j ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const formatClock = (timestamp) => {
  if (!timestamp) return '--:--';
  return new Date(timestamp).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
};

const EditBillingModal = ({ customer, onClose }) => {
  const { 
    customers, 
    services,
    configuredSlots,
    getServiceDetails,
    updateJokiCustomer, 
    moveCustomerToQueue, 
    priceBasic, 
    addToast 
  } = useJoki();

  const [username, setUsername] = useState('');
  const [tiktokName, setTiktokName] = useState('');
  const [passwordRoblox, setPasswordRoblox] = useState('');
  const [emailRoblox, setEmailRoblox] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const [service, setService] = useState('Basic');
  const [slot, setSlot] = useState(1);
  const [price, setPrice] = useState(4000);
  const [loading, setLoading] = useState(false);
  const [showMoveConfirm, setShowMoveConfirm] = useState(false);

  // Duration Jam & Menit
  const [durHours, setDurHours] = useState(1);
  const [durMinutes, setDurMinutes] = useState(0);

  useEffect(() => {
    if (customer) {
      setUsername(customer.username || customer.name || '');
      setTiktokName(customer.tiktokName || '');
      setPasswordRoblox(customer.passwordRoblox || '');
      setEmailRoblox(customer.emailRoblox || '');
      setService(customer.service || 'Basic');
      setSlot(customer.slot || 1);
      setPrice(Math.round(customer.price || 0));

      const totalMins = Math.round(Number(customer.duration || 1) * 60);
      setDurHours(Math.floor(totalMins / 60));
      setDurMinutes(totalMins % 60);
    }
  }, [customer]);

  if (!customer) return null;

  const currentServiceDetails = getServiceDetails(service);
  const isVVIP = currentServiceDetails.tier === 'VVIP';
  const isVIP = currentServiceDetails.tier === 'VIP';
  const designatedSlots = currentServiceDetails.slots || [];
  const ratePerHour = Number(currentServiceDetails.price) || priceBasic;

  // Initial duration in hours
  const initialDurationHours = Number(customer.duration || 1);
  // Total new duration in hours
  const calculatedTotalHours = Number(durHours || 0) + (Number(durMinutes || 0) / 60);
  const deltaHours = calculatedTotalHours - initialDurationHours;
  const deltaSeconds = deltaHours * 3600;

  // Actual current remaining seconds of this customer
  const currentRemainingSeconds = customer.paused
    ? (customer.remainingAtPause !== undefined && customer.remainingAtPause !== null 
        ? customer.remainingAtPause 
        : Math.max(0, Math.floor(((customer.endTime || Date.now()) - Date.now()) / 1000)))
    : Math.max(0, Math.floor(((customer.endTime || Date.now()) - Date.now()) / 1000));

  // Adjusted new remaining seconds (preserves paused time; only changes if duration input changed)
  const newRemainingSeconds = Math.max(0, Math.round(currentRemainingSeconds + deltaSeconds));

  // New calculated End Time
  const newEndTime = customer.paused
    ? ((customer.pauseStarted || Date.now()) + (newRemainingSeconds * 1000))
    : ((customer.endTime || Date.now()) + (deltaSeconds * 1000));

  // Handle service change
  const handleServiceChange = (e) => {
    const newService = e.target.value;
    setService(newService);
    const newDetails = getServiceDetails(newService);
    const newRate = Number(newDetails.price) || priceBasic;
    setPrice(Math.round(calculatedTotalHours * newRate));
  };

  // Auto-hide password after 5 seconds
  const handleToggleShowPassword = () => {
    if (!showPassword) {
      setShowPassword(true);
      setTimeout(() => setShowPassword(false), 5000);
    } else {
      setShowPassword(false);
    }
  };

  // Clipboard copy helper
  const handleCopy = (text, fieldName) => {
    if (!text) {
      addToast(`Data ${fieldName} masih kosong.`, 'info');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(`✓ ${fieldName} berhasil disalin ke clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Quick Duration Adjustment handlers
  const handleAdjustMinutes = (deltaMinutes) => {
    const currentTotalMins = (Number(durHours) * 60) + Number(durMinutes);
    const newTotalMins = Math.max(15, currentTotalMins + deltaMinutes);
    
    const newH = Math.floor(newTotalMins / 60);
    const newM = newTotalMins % 60;
    setDurHours(newH);
    setDurMinutes(newM);

    // Auto adjust price
    const newHoursFloat = newTotalMins / 60;
    setPrice(Math.round(newHoursFloat * ratePerHour));
  };

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

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!username.trim()) {
      addToast('Username Roblox tidak boleh kosong.', 'error');
      return;
    }
    if (calculatedTotalHours <= 0) {
      addToast('Durasi joki harus lebih dari 0.', 'error');
      return;
    }

    try {
      setLoading(true);
      const chosenSlot = isVVIP ? 'VVIP' : (isVIP ? 'VIP' : slot);

      const updates = {
        username: username.trim(),
        name: username.trim(),
        tiktokName: tiktokName.trim().replace(/^@/, ''),
        passwordRoblox: passwordRoblox.trim(),
        emailRoblox: emailRoblox.trim(),
        service: service,
        slot: chosenSlot,
        duration: Number(calculatedTotalHours.toFixed(2)),
        endTime: newEndTime,
        price: Math.round(Number(price || 0)),
      };

      // If paused, update remainingAtPause as well
      if (customer.paused) {
        updates.remainingAtPause = newRemainingSeconds;
      }

      await updateJokiCustomer(customer.id, updates);
      addToast(`Data billing & durasi ${username} berhasil diperbarui!`, 'success');
      onClose();
    } catch (err) {
      console.error(err);
      addToast('Gagal memperbarui data billing.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveBackToQueue = () => {
    setShowMoveConfirm(true);
  };

  const handleConfirmMoveToQueue = async () => {
    setShowMoveConfirm(false);
    await moveCustomerToQueue(customer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-xl bg-bg-surface border border-border-default rounded-3xl p-6 shadow-2xl animate-slide-in relative max-h-[92vh] overflow-y-auto"
        style={{ background: '#111318' }}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-dim hover:text-text-primary transition-colors p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
            <Edit3 size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Edit Billing & Brankas Akun
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Koreksi durasi, password akun, harga, atau pindah slot
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* SECTION 1: BRANKAS LOGIN AKUN ROBLOX */}
          <div className="p-4 rounded-2xl bg-bg-primary/90 border border-border-default space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-accent-cyan flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-accent-green" />
                <span>Brankas Login Akun (Anti-Bocor OBS)</span>
              </span>
              <span className="text-[10.5px] text-text-dim">Klik salin untuk paste instan</span>
            </div>

            {/* Username Roblox */}
            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Username Roblox <span className="text-accent-red">*</span>
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary font-bold outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(username, 'Username')}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy size={13} />
                  <span>{copiedField === 'Username' ? 'Tersalin!' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Password Roblox */}
            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Password Roblox (Tersimpan Aman)
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordRoblox}
                    onChange={(e) => setPasswordRoblox(e.target.value)}
                    placeholder="Masukkan password akun..."
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary font-mono outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleToggleShowPassword}
                  title="Intip 5 detik"
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-dim hover:text-white border border-border-subtle transition-all cursor-pointer shrink-0"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(passwordRoblox, 'Password')}
                  className="px-3 py-2 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy size={13} />
                  <span>{copiedField === 'Password' ? 'Tersalin!' : 'Salin Pass'}</span>
                </button>
              </div>
            </div>

            {/* Email Akun / OTP */}
            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Email Akun / Email OTP (Opsional)
              </label>
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="text"
                    value={emailRoblox}
                    onChange={(e) => setEmailRoblox(e.target.value)}
                    placeholder="email_customer@gmail.com"
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(emailRoblox, 'Email')}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy size={13} />
                  <span>{copiedField === 'Email' ? 'Tersalin!' : 'Salin Email'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: PENGATURAN DURASI & KOREKSI WAKTU */}
          <div className="p-4 rounded-2xl bg-bg-primary/90 border border-border-default space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-accent-yellow flex items-center gap-1.5">
                <Clock size={14} />
                <span>Koreksi Durasi & Waktu (Kasus Cancel/Refund)</span>
              </span>
              <span className="text-[10.5px] font-mono text-accent-yellow font-bold">
                Total: {durHours} Jam {durMinutes > 0 ? `${durMinutes}m` : ''}
              </span>
            </div>

            {/* Jam & Menit Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-text-dim mb-1">Jam</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={durHours}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    setDurHours(val);
                    const newTot = val + (Number(durMinutes) / 60);
                    setPrice(Math.round(newTot * ratePerHour));
                  }}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary font-mono font-bold outline-none focus:border-accent-yellow/50"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-text-dim mb-1">Menit</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={durMinutes}
                  onChange={(e) => {
                    const val = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                    setDurMinutes(val);
                    const newTot = Number(durHours) + (val / 60);
                    setPrice(Math.round(newTot * ratePerHour));
                  }}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary font-mono font-bold outline-none focus:border-accent-yellow/50"
                />
              </div>
            </div>

            {/* Quick Adjustment Presets */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-text-dim font-bold shrink-0">Kurangi/Tambah:</span>
              <button
                type="button"
                onClick={() => handleAdjustMinutes(-60)}
                className="flex-1 py-1 rounded-lg bg-accent-red/15 hover:bg-accent-red/25 text-accent-red border border-accent-red/30 text-[11px] font-mono font-black transition-all"
              >
                -1 Jam
              </button>
              <button
                type="button"
                onClick={() => handleAdjustMinutes(-30)}
                className="flex-1 py-1 rounded-lg bg-accent-red/15 hover:bg-accent-red/25 text-accent-red border border-accent-red/30 text-[11px] font-mono font-black transition-all"
              >
                -30m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustMinutes(30)}
                className="flex-1 py-1 rounded-lg bg-accent-green/15 hover:bg-accent-green/25 text-accent-green border border-accent-green/30 text-[11px] font-mono font-black transition-all"
              >
                +30m
              </button>
              <button
                type="button"
                onClick={() => handleAdjustMinutes(60)}
                className="flex-1 py-1 rounded-lg bg-accent-green/15 hover:bg-accent-green/25 text-accent-green border border-accent-green/30 text-[11px] font-mono font-black transition-all"
              >
                +1 Jam
              </button>
            </div>

            {/* Live Preview Box */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-text-dim block">Sisa Waktu Baru:</span>
                <strong className="text-accent-green font-mono font-black">{formatTime(newRemainingSeconds)}</strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-text-dim block">Jam Beres Baru:</span>
                <strong className="text-accent-cyan font-mono font-black">{formatClock(newEndTime)}</strong>
              </div>
            </div>
          </div>

          {/* SECTION 3: LAYANAN, HARGA & TIKTOK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Layanan
              </label>
              <select
                value={service}
                onChange={handleServiceChange}
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2 px-2.5 text-xs text-text-primary outline-none focus:border-accent-cyan/50 cursor-pointer font-bold"
              >
                {services.filter(s => s.enabled || s.name === service).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} (Rp {Number(s.price || 4000).toLocaleString('id-ID')} / Jam {s.slots && s.slots.length > 0 ? `• Slot ${s.slots.join(', ')}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Total Harga (Rp)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-yellow" />
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-8 pr-2 text-xs text-accent-yellow font-mono font-black outline-none focus:border-accent-yellow/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                Akun TikTok
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-cyan">@</span>
                <input
                  type="text"
                  value={tiktokName}
                  onChange={(e) => setTiktokName(e.target.value)}
                  placeholder="username_tiktok"
                  className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-6 pr-2 text-xs text-text-primary outline-none focus:border-accent-cyan/50"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: PINDAH SLOT VISUAL */}
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10.5px] font-extrabold text-text-dim uppercase tracking-wider block">
                  Pindah Slot AFK Billing
                </label>
                {designatedSlots.length > 0 && (
                  <span className="text-[10px] text-cyan-300 font-bold block">
                    Alokasi {currentServiceDetails.name}: Slot {designatedSlots.join(', ')}
                  </span>
                )}
              </div>
              <span className="text-[10.5px] text-text-dim">
                Slot Terpilih: <strong className="text-accent-cyan font-mono">SLOT {slot}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {configuredSlots.map((s) => {
                const sStr = s.toString();
                const occupied = occupiedSlots[sStr];
                const isSelected = slot.toString() === sStr;
                const isCurrentSlot = customer.slot && customer.slot.toString() === sStr;
                const isDesignated = designatedSlots.includes(s);

                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[58px] ${
                      isSelected
                        ? 'bg-accent-cyan/20 border-accent-cyan ring-2 ring-accent-cyan/60'
                        : isCurrentSlot
                        ? 'bg-accent-purple/20 border-accent-purple/50'
                        : isDesignated
                        ? isVVIP
                          ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400'
                          : isVIP
                          ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-400'
                          : 'bg-bg-primary border-cyan-500/30 hover:border-cyan-400'
                        : occupied
                        ? 'bg-bg-primary border-accent-red/25'
                        : 'bg-bg-primary border-border-default hover:border-border-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-xs font-black ${
                        isSelected ? 'text-accent-cyan' : isCurrentSlot ? 'text-accent-purple-light' : occupied ? 'text-text-primary' : 'text-text-secondary'
                      }`}>
                        SLOT {s}
                      </span>
                      {isCurrentSlot ? (
                        <span className="text-[8.5px] font-black px-1 py-0.2 rounded bg-accent-purple/30 text-accent-purple-light">
                          Aktif
                        </span>
                      ) : occupied ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                      )}
                    </div>
                    {occupied && !isCurrentSlot ? (
                      <div className="text-[9.5px] font-bold text-text-muted truncate mt-0.5">
                        {occupied.username}
                      </div>
                    ) : !isCurrentSlot ? (
                      <div className="text-[9px] font-bold text-accent-green mt-0.5">
                        🟢 Kosong
                      </div>
                    ) : (
                      <div className="text-[9px] font-bold text-accent-purple-light mt-0.5">
                        Slot Customer
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={handleMoveBackToQueue}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-bold text-accent-yellow hover:text-accent-yellow-light bg-accent-yellow/10 hover:bg-accent-yellow/20 border border-accent-yellow/30 transition-all cursor-pointer"
            >
              <Undo2 size={13} />
              <span>Ke Antrian</span>
            </button>

            <div className="flex items-center gap-2">
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
                <Check size={14} />
                <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Custom Confirm Modal for Moving to Queue */}
      <ConfirmModal
        isOpen={showMoveConfirm}
        title={`Kembalikan ${customer.username || customer.name} ke Antrian?`}
        message={`Customer ini akan dipindahkan kembali ke daftar Antrian dengan sisa durasi saat ini. Slot ${customer.slot} akan langsung dikosongkan.`}
        detail={`• Customer: ${customer.username || customer.name}\n• Slot Saat Ini: ${customer.slot}\n• Layanan: ${customer.service || 'Basic'}`}
        confirmText="Kembalikan ke Antrian"
        cancelText="Batal"
        variant="warning"
        onConfirm={handleConfirmMoveToQueue}
        onCancel={() => setShowMoveConfirm(false)}
      />
    </div>
  );
};

export default EditBillingModal;
