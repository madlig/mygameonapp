import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Plus, 
  X, 
  User, 
  Lock, 
  Mail, 
  Clock, 
  Play,
  Users,
  Gem,
  Crown,
  Gamepad2,
  Check
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
    formatSlotLabel,
    matchCustomerToSlot,
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
  const [slot, setSlot] = useState('1');
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

  // Map occupied slots from active customers using configuredSlots definitions
  const occupiedSlots = {};
  customers.forEach(c => {
    if (!c.finished && c.slot) {
      const remaining = c.paused 
        ? (c.remainingAtPause || 0)
        : Math.max(0, Math.floor((c.endTime - Date.now()) / 1000));
      
      configuredSlots.forEach(sDef => {
        if (matchCustomerToSlot(c, sDef)) {
          occupiedSlots[sDef.key] = {
            username: c.username || c.name,
            remaining,
            paused: c.paused,
          };
        }
      });
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
          service: currentServiceDetails.name,
          duration: Number(calculatedHours.toFixed(2)),
          price: totalPrice,
          status: 'WAITING',
          createdAt: now,
        });

        addToast(`Customer ${username} berhasil dimasukkan ke antrean ${currentServiceDetails.name}!`, 'success');
        onClose();
        return;
      }

      // OPTION 2: LANGSUNG KE SLOT LIVE
      const chosenSlot = slot || '1';
      const durationSeconds = calculatedHours * 3600;

      const customerData = {
        username: username.trim(),
        name: username.trim(),
        tiktokName: tiktokName.trim().replace(/^@/, ''),
        passwordRoblox: passwordRoblox.trim(),
        emailRoblox: emailRoblox.trim(),
        service: currentServiceDetails.name,
        slot: chosenSlot,
        duration: Number(calculatedHours.toFixed(2)),
        price: totalPrice,
        finished: false,
        startTime: now,
        endTime: now + durationSeconds * 1000,
        paused: globalPaused,
        pausedDuration: 0,
        remainingAtPause: globalPaused ? durationSeconds : null,
        createdAt: now,
      };

      await addJokiCustomer(customerData);
      const slotLabel = formatSlotLabel ? formatSlotLabel(chosenSlot, currentServiceDetails.name) : `Slot ${chosenSlot}`;
      addToast(`Customer ${username} berhasil ditambahkan ke ${slotLabel}!`, 'success');
      onClose();
    } catch (err) {
      console.error('Save error:', err);
      addToast('Gagal menyimpan data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease]">
      <div 
        className="w-full max-w-2xl bg-[#111318] border border-border-default rounded-3xl p-6 shadow-2xl animate-slide-in relative max-h-[92vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-dim hover:text-text-primary transition-colors p-1.5 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple shrink-0">
            <Plus size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Tambah Order Joki Baru
            </h3>
            <p className="text-xs text-text-muted mt-0.5 m-0">
              Input data customer Roblox & alokasikan ke slot live atau antrean
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1">
          {/* Destination Selector: LIVE SLOT vs QUEUE */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-bg-surface border border-border-default rounded-2xl">
            <button
              type="button"
              onClick={() => setDestination('SLOT')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                destination === 'SLOT'
                  ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/25'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Play size={15} />
              <span>Mulai di Slot Live</span>
            </button>

            <button
              type="button"
              onClick={() => setDestination('QUEUE')}
              className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                destination === 'QUEUE'
                  ? 'bg-accent-cyan text-bg-primary shadow-md shadow-accent-cyan/25'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Users size={15} />
              <span>Masukkan ke Antrean</span>
            </button>
          </div>

          {/* Section 1: Customer Info */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Username with Autocomplete */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-text-dim mb-1">
                  Username Roblox <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Contoh: user_roblox123"
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 font-bold"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {showSuggestions && matchingSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1d26] border border-border-default rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-text-dim uppercase border-b border-border-subtle bg-white/[0.02]">
                      Pelanggan Pernah Order:
                    </div>
                    {matchingSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full px-3 py-2 text-left hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer border-b border-white/5 last:border-0"
                      >
                        <span className="text-xs font-bold text-white">{item.username}</span>
                        {item.tiktokName && (
                          <span className="text-[11px] text-accent-cyan font-medium">@{item.tiktokName}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* TikTok Name */}
              <div>
                <label className="block text-[11px] font-bold text-text-dim mb-1">
                  Akun TikTok (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-cyan">@</span>
                  <input
                    type="text"
                    value={tiktokName}
                    onChange={(e) => setTiktokName(e.target.value)}
                    placeholder="username_tiktok"
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 pl-8 pr-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50"
                  />
                </div>
              </div>
            </div>

            {/* Optional Credentials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-text-dim mb-1">
                  <Lock className="inline w-3 h-3 mr-1 text-accent-cyan" />
                  Password Akun Roblox (Opsional)
                </label>
                <input
                  type="text"
                  value={passwordRoblox}
                  onChange={(e) => setPasswordRoblox(e.target.value)}
                  placeholder="Password akun..."
                  className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text-dim mb-1">
                  <Mail className="inline w-3 h-3 mr-1 text-accent-purple-light" />
                  Email Akun / OTP (Opsional)
                </label>
                <input
                  type="text"
                  value={emailRoblox}
                  onChange={(e) => setEmailRoblox(e.target.value)}
                  placeholder="email_customer@gmail.com"
                  className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Service & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-border-subtle">
            {/* Service Selection */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-bold text-text-dim mb-1">
                Pilih Layanan
              </label>
              <select
                value={service}
                onChange={handleServiceChange}
                className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 cursor-pointer font-bold"
              >
                {services.filter(s => s.enabled).map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} (Rp {Number(s.price || 4000).toLocaleString('id-ID')} / Jam • {s.slotCount || 1} Slot)
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Input */}
            <div className="md:col-span-6">
              <label className="block text-[11px] font-bold text-text-dim mb-1">
                Durasi Joki
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={durationValue}
                  onChange={(e) => setDurationValue(e.target.value)}
                  className="flex-1 bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary font-bold outline-none focus:border-accent-purple/50"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  className="w-24 bg-[#151821] border border-border-default rounded-xl py-2 px-2 text-xs text-text-primary outline-none focus:border-accent-purple/50 font-bold cursor-pointer"
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
                className="py-1.5 rounded-lg text-xs font-bold bg-bg-primary hover:bg-white/5 border border-border-subtle text-text-secondary hover:text-white transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Section 3: Visual Slot Selector (Grouped by Service Tiers with Distinct Colors) */}
          {destination === 'SLOT' ? (
            <div className="pt-2 border-t border-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-text-dim uppercase tracking-wider block">
                  PILIH SLOT AFK BILLING (SESUAI LAYANAN)
                </label>
                <span className="text-[11px] text-text-dim">
                  Slot Terpilih: <strong className="text-white font-mono font-black text-xs px-2 py-0.5 rounded-md bg-accent-purple/30 border border-accent-purple/50">{formatSlotLabel ? formatSlotLabel(slot, currentServiceDetails.name) : `SLOT ${slot}`}</strong>
                </span>
              </div>

              {/* Grouped Service Cards */}
              <div className="space-y-3">
                {services.filter(s => s.enabled).map((srv) => {
                  const srvSlots = configuredSlots.filter(sDef => sDef.tier === srv.tier);
                  if (srvSlots.length === 0) return null;

                  const isSrvBasic = srv.tier === 'Basic';
                  const isSrvVip = srv.tier === 'VIP';
                  const isSrvVvip = srv.tier === 'VVIP';
                  const isCurrentService = currentServiceDetails.tier === srv.tier;

                  const themeClasses = isSrvVvip
                    ? {
                        container: 'bg-[#1b0a13]/80 border-rose-500/30',
                        badge: 'text-rose-300 bg-rose-500/15 border-rose-500/30',
                        icon: <Gem size={13} className="text-rose-400" />,
                        slotDefault: 'bg-[#280d1e] border-rose-500/30 hover:border-rose-400/80 text-rose-200',
                        slotSelected: 'bg-rose-500/30 border-rose-400 ring-2 ring-rose-400 text-white shadow-lg shadow-rose-500/30',
                        pill: 'text-rose-200'
                      }
                    : isSrvVip
                    ? {
                        container: 'bg-[#191307]/80 border-amber-500/30',
                        badge: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
                        icon: <Crown size={13} className="text-amber-400" />,
                        slotDefault: 'bg-[#261c0c] border-amber-500/30 hover:border-amber-400/80 text-amber-200',
                        slotSelected: 'bg-amber-500/30 border-amber-400 ring-2 ring-amber-400 text-white shadow-lg shadow-amber-500/30',
                        pill: 'text-amber-200'
                      }
                    : {
                        container: 'bg-[#0b1424]/80 border-cyan-500/30',
                        badge: 'text-cyan-300 bg-cyan-500/15 border-cyan-500/30',
                        icon: <Gamepad2 size={13} className="text-cyan-400" />,
                        slotDefault: 'bg-[#0f1d33] border-cyan-500/30 hover:border-cyan-400/80 text-cyan-200',
                        slotSelected: 'bg-cyan-500/30 border-cyan-400 ring-2 ring-cyan-400 text-white shadow-lg shadow-cyan-500/30',
                        pill: 'text-cyan-200'
                      };

                  return (
                    <div 
                      key={srv.id} 
                      className={`p-3 rounded-2xl border transition-all ${themeClasses.container} ${isCurrentService ? 'ring-1 ring-white/15' : 'opacity-90'}`}
                    >
                      {/* Section Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          {themeClasses.icon}
                          <span className="text-xs font-black text-white">
                            {srv.name}
                          </span>
                          <span className="text-[10px] text-text-dim font-bold">
                            (Rp {Number(srv.price || 4000).toLocaleString('id-ID')}/Jam)
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-lg border ${themeClasses.badge}`}>
                          {srvSlots.length} Slot Terbuka
                        </span>
                      </div>

                      {/* Grid of Slots for this tier */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {srvSlots.map((sDef) => {
                          const occupied = occupiedSlots[sDef.key];
                          const isSelected = slot === sDef.key;

                          return (
                            <button
                              key={sDef.key}
                              type="button"
                              onClick={() => {
                                setSlot(sDef.key);
                                setService(srv.name);
                              }}
                              className={`p-2 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[58px] ${
                                isSelected
                                  ? themeClasses.slotSelected
                                  : occupied
                                  ? 'bg-[#151821] border-accent-red/30 opacity-80'
                                  : themeClasses.slotDefault
                              }`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className={`font-mono text-xs font-black truncate ${
                                  isSelected ? 'text-white' : themeClasses.pill
                                }`}>
                                  {sDef.displayLabel}
                                </span>
                                {occupied ? (
                                  <span className="w-2 h-2 rounded-full bg-accent-red shrink-0 shadow-sm shadow-accent-red/50" />
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-accent-green shrink-0 shadow-sm shadow-accent-green/50 animate-pulse" />
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
                  ? `+ Masukkan ke Antrean ${currentServiceDetails.name}`
                  : `+ Mulai Billing ${formatSlotLabel ? formatSlotLabel(slot, currentServiceDetails.name) : 'Slot ' + slot}`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJokiModal;
