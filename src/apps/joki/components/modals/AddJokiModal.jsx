import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Plus, 
  X, 
  User, 
  Lock, 
  Mail, 
  Clock, 
  Sparkles,
  Play,
  Users,
  Gem,
  Crown,
  Gamepad2
} from 'lucide-react';

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h} Jam ${m} Menit`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
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
  const { 
    customers, 
    services,
    configuredSlots,
    getServiceDetails,
    priceBasic,
    addJokiCustomer, 
    addJokiQueue, 
    globalPaused, 
    suggestSlot, 
    addToast 
  } = useJoki();
  const [destination, setDestination] = useState('SLOT'); // 'SLOT' | 'QUEUE'
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
      const defaultSrv = services.find(s => s.enabled)?.name || 'Basic';
      setDestination('SLOT');
      setUsername('');
      setTiktokName('');
      setPasswordRoblox('');
      setEmailRoblox('');
      setService(defaultSrv);
      setSlot(suggestSlot(defaultSrv));
      setDurationValue(1);
      setDurationUnit('hour');
    }
  }, [isOpen, customers, services]);

  // Sync slot with service change
  const handleServiceChange = (e) => {
    const val = e.target.value;
    setService(val);
    setSlot(suggestSlot(val));
  };

  if (!isOpen) return null;

  const currentServiceDetails = getServiceDetails(service);
  const isVVIP = currentServiceDetails.tier === 'VVIP';
  const isVIP = currentServiceDetails.tier === 'VIP';
  const designatedSlots = currentServiceDetails.slots || [];

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

  const pricePerHour = Number(currentServiceDetails.price) || priceBasic;
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

      // OPTION 1: MASUK ANTREAN (QUEUE)
      if (destination === 'QUEUE') {
        await addJokiQueue({
          username: username.trim(),
          tiktokName: tiktokName.trim().replace(/^@/, ''),
          passwordRoblox: passwordRoblox.trim(),
          emailRoblox: emailRoblox.trim(),
          service: currentServiceDetails.name || service,
          duration: calculatedHours,
          price: totalPrice,
          paymentStatus: 'Lunas',
          createdAt: now
        });
        addToast(`Customer ${username} (${currentServiceDetails.name}) berhasil masuk antrean!`, 'success');
        onClose();
        return;
      }

      // OPTION 2: MULAI DI SLOT LIVE
      const durationSeconds = calculatedHours * 3600;
      const chosenSlot = slot;

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
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple shrink-0">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Tambah Order Joki Baru
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Input data customer Roblox & alokasikan ke slot live atau antrean
            </p>
          </div>
        </div>

        {/* Destination Switcher: Live Slot vs Queue */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-bg-primary rounded-2xl border border-border-default mb-3.5">
          <button
            type="button"
            onClick={() => setDestination('SLOT')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              destination === 'SLOT'
                ? 'bg-accent-purple text-white shadow-md'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Play size={13} />
            <span>Mulai di Slot Live</span>
          </button>
          <button
            type="button"
            onClick={() => setDestination('QUEUE')}
            className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              destination === 'QUEUE'
                ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-md'
                : 'text-text-muted hover:text-white'
            }`}
          >
            <Users size={13} />
            <span>Masukkan ke Antrean</span>
          </button>
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
                        <span className="font-bold">{sug.username}</span>
                        <span className="text-[11px] text-accent-cyan">{sug.tiktokName ? `@${sug.tiktokName}` : ''}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TikTok Account */}
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
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-8 pr-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Brankas Credentials: Password & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-border-subtle">
              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1 flex items-center gap-1">
                  <Lock size={11} className="text-accent-cyan" />
                  <span>Password Akun Roblox (Opsional)</span>
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
                {services.filter(s => s.enabled).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} (Rp {Number(s.price || 4000).toLocaleString('id-ID')} / Jam {s.slots && s.slots.length > 0 ? `• Slot ${s.slots.join(', ')}` : ''})
                  </option>
                ))}
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

          {/* Section 3: Visual Slot Selector (Only if destination === 'SLOT') */}
          {destination === 'SLOT' ? (
            <div className="pt-2 border-t border-border-subtle space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[10.5px] font-extrabold text-text-dim uppercase tracking-wider block">
                    Pilih Slot AFK Billing
                  </label>
                  {designatedSlots.length > 0 && (
                    <span className="text-[10px] text-cyan-300 font-bold block">
                      Alokasi {currentServiceDetails.name}: Slot {designatedSlots.join(', ')}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-text-dim">
                  Slot Terpilih: <strong className="text-accent-purple-light font-mono text-xs">SLOT {slot}</strong>
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {configuredSlots.map((s) => {
                  const sStr = s.toString();
                  const occupied = occupiedSlots[sStr];
                  const isSelected = slot.toString() === sStr;
                  const isDesignated = designatedSlots.includes(s);

                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSlot(s)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[60px] ${
                        isSelected
                          ? 'bg-accent-purple/25 border-accent-purple ring-2 ring-accent-purple/60'
                          : isDesignated
                          ? isVVIP 
                            ? 'bg-rose-950/20 border-rose-500/40 hover:border-rose-500/70'
                            : isVIP
                            ? 'bg-amber-950/20 border-amber-500/40 hover:border-amber-500/70'
                            : 'bg-bg-primary border-cyan-500/30 hover:border-cyan-500/60'
                          : occupied
                          ? 'bg-bg-primary border-accent-red/25'
                          : 'bg-bg-primary border-border-default hover:border-border-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`font-mono text-xs font-black ${
                          isSelected ? 'text-accent-purple-light' : occupied ? 'text-text-primary' : 'text-text-secondary'
                        }`}>
                          SLOT {s}
                        </span>
                        {occupied ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-red shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                        )}
                      </div>

                      {occupied ? (
                        <div className="text-[9.5px] font-bold text-text-muted truncate mt-1">
                          {occupied.username}
                        </div>
                      ) : (
                        <div className="text-[9.5px] font-bold text-accent-green mt-1 flex items-center gap-1">
                          <span>🟢 Kosong</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Banner Destination Antrean */
            <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
              isVVIP
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                : isVIP
                ? 'bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow'
                : 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan'
            }`}>
              {isVVIP ? <Gem size={15} /> : isVIP ? <Crown size={15} /> : <Gamepad2 size={15} />}
              <span>
                Customer akan dimasukkan ke antrean <strong>{currentServiceDetails.name.toUpperCase()}</strong> di sidebar.
              </span>
            </div>
          )}

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
              className={`flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-black text-white transition-all shadow-lg cursor-pointer disabled:opacity-50 ${
                destination === 'QUEUE'
                  ? 'bg-accent-cyan text-bg-primary hover:bg-accent-cyan/90 shadow-accent-cyan/25'
                  : 'bg-accent-purple hover:bg-accent-purple-light shadow-accent-purple/25'
              }`}
            >
              <Plus size={15} />
              <span>
                {loading 
                  ? 'Menyimpan...' 
                  : destination === 'QUEUE'
                  ? `+ Masukkan ke Antrean ${isVVIP ? 'VVIP' : (isVIP ? 'VIP' : 'Basic')}`
                  : `Mulai Billing ${isVVIP ? 'VVIP' : (isVIP ? 'VIP' : 'Slot ' + slot)}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJokiModal;
