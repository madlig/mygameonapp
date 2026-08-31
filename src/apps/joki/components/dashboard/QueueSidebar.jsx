import React, { useState } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Crown, 
  Gamepad2, 
  Sparkles,
  Lock, 
  Mail, 
  GripVertical, 
  Key, 
  MessageSquare,
  Gem
} from 'lucide-react';
import CredentialModal from '../modals/CredentialModal';

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const formatRupiah = (value) => {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
};

const DURATION_PRESETS = [
  { label: '30m', amount: 30, unit: 'minute' },
  { label: '1 Jam', amount: 1, unit: 'hour' },
  { label: '2 Jam', amount: 2, unit: 'hour' },
  { label: '3 Jam', amount: 3, unit: 'hour' },
  { label: '4 Jam', amount: 4, unit: 'hour' },
];

const QueueSidebar = ({ onStartFromQueue, onRequestClearQueue }) => {
  const { 
    queue, 
    customers,
    services,
    enableVvipSlot,
    priceBasic,
    priceVip,
    priceVvip,
    addJokiQueue, 
    updateJokiQueue, 
    deleteJokiQueue, 
    reorderQueue, 
    isAdmin, 
    addToast 
  } = useJoki();

  // Collapsible Add Form state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [qUsername, setQUsername] = useState('');
  const [qTiktok, setQTiktok] = useState('');
  const [qPassword, setQPassword] = useState('');
  const [qEmail, setQEmail] = useState('');
  const [qService, setQService] = useState('Basic');
  const [qAmount, setQAmount] = useState(1);
  const [qUnit, setQUnit] = useState('hour');
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit Queue Item state
  const [editingId, setEditingId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editService, setEditService] = useState('Basic');
  const [editDuration, setEditDuration] = useState(1);

  // Credential Modal target
  const [credentialCustomer, setCredentialCustomer] = useState(null);

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Autocomplete data mapping from past customers
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

  const matchingSuggestions = qUsername.trim()
    ? Object.values(customerHistoryMap).filter(c => 
        c.username.toLowerCase().includes(qUsername.toLowerCase().trim())
      ).slice(0, 4)
    : [];

  const handleSelectSuggestion = (item) => {
    setQUsername(item.username);
    if (item.tiktokName) setQTiktok(item.tiktokName);
    if (item.passwordRoblox) setQPassword(item.passwordRoblox);
    if (item.emailRoblox) setQEmail(item.emailRoblox);
    setShowSuggestions(false);
    addToast(`Data pelanggan ${item.username} otomatis terisi!`, 'info');
  };

  // Calculate total workload queue hours
  const totalQueueHours = queue.reduce((sum, q) => sum + Number(q.duration || 0), 0);

  // Calculate actual duration in hours and price
  const calculatedHours = qUnit === 'hour' ? Number(qAmount || 0) : Number(qAmount || 0) / 60;
  const getRate = (srv) => {
    const s = (srv || '').toUpperCase();
    if (s === 'VVIP') return priceVvip;
    if (s === 'VIP') return priceVip;
    return priceBasic;
  };
  const pricePerHour = getRate(qService);
  const calculatedPrice = Math.round(calculatedHours * pricePerHour);

  const handleApplyPreset = (preset) => {
    setQAmount(preset.amount);
    setQUnit(preset.unit);
  };

  const handleAddQueue = async (e) => {
    if (e) e.preventDefault();
    if (!qUsername.trim()) {
      addToast('Username Roblox wajib diisi.', 'error');
      return;
    }
    if (calculatedHours <= 0) {
      addToast('Durasi harus lebih dari 0.', 'error');
      return;
    }

    try {
      setLoadingAdd(true);
      await addJokiQueue({
        username: qUsername.trim(),
        tiktokName: qTiktok.trim().replace(/^@/, ''),
        passwordRoblox: qPassword.trim(),
        emailRoblox: qEmail.trim(),
        service: qService,
        duration: calculatedHours,
        price: calculatedPrice,
        paymentStatus: 'Lunas',
        createdAt: Date.now()
      });

      setQUsername('');
      setQTiktok('');
      setQPassword('');
      setQEmail('');
      setQAmount(1);
      setQUnit('hour');
      setIsAddOpen(false);
      addToast(`Customer ${qUsername} (${qService}) berhasil masuk antrean!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal menambahkan ke antrian.', 'error');
    } finally {
      setLoadingAdd(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditUsername(item.username);
    setEditTiktok(item.tiktokName || '');
    setEditPassword(item.passwordRoblox || '');
    setEditEmail(item.emailRoblox || '');
    setEditService(item.service || 'Basic');
    setEditDuration(item.duration);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id) => {
    if (!editUsername.trim()) {
      addToast('Username tidak boleh kosong.', 'error');
      return;
    }
    try {
      const numDur = Number(editDuration) || 1;
      const rate = getRate(editService);
      await updateJokiQueue(id, {
        username: editUsername.trim(),
        tiktokName: editTiktok.trim().replace(/^@/, ''),
        passwordRoblox: editPassword.trim(),
        emailRoblox: editEmail.trim(),
        service: editService,
        duration: numDur,
        price: Math.round(numDur * rate),
      });
      setEditingId(null);
      addToast('Data antrian diperbarui.', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah data antrian.', 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      await deleteJokiQueue(item.id);
      addToast(`Antrian ${item.username} dihapus.`, 'info');
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus antrian.', 'error');
    }
  };

  // Copy TikTok DM template with labelled ticket link
  const handleCopyDM = (item) => {
    const tId = item.ticketId || `JK-${item.id.slice(-5)}`;
    const ticketUrl = `${window.location.origin}/ticket/${tId}`;
    const user = item.username || item.name;
    const tt = item.tiktokName ? `@${item.tiktokName.replace(/^@/, '')}` : user;

    const text = `Tiket Billing ${tt}: ${ticketUrl}\n\nHalo ${tt}! Akun Roblox kamu (${user}) sudah masuk antrean joki ya. Kamu bisa pantau giliran jam mulai di link tiket ini ya! ✨🎮`;

    navigator.clipboard.writeText(text);
    addToast(`✓ Link tiket & pesan DM untuk ${user} berhasil disalin!`, 'success');
  };

  // Drag and drop handlers
  const handleDragStart = (e, item, index, queueType) => {
    if (!isAdmin) return;
    setDraggedItem({ item, index, queueType });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index, queueType) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.queueType !== queueType) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const vvipQueue = queue.filter(q => (q.service || '').toUpperCase() === 'VVIP');
  const vipQueue = queue.filter(q => (q.service || '').toUpperCase() === 'VIP');
  const basicQueue = queue.filter(q => {
    const s = (q.service || '').toUpperCase();
    return s !== 'VIP' && s !== 'VVIP';
  });

  const handleDrop = async (e, targetIndex, queueType) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.queueType !== queueType || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    let subQueue = [];
    if (queueType === 'VVIP') subQueue = [...vvipQueue];
    else if (queueType === 'VIP') subQueue = [...vipQueue];
    else subQueue = [...basicQueue];

    const [movedItem] = subQueue.splice(draggedItem.index, 1);
    subQueue.splice(targetIndex, 0, movedItem);

    let newFullQueue = [];
    if (queueType === 'VVIP') {
      newFullQueue = [...subQueue, ...vipQueue, ...basicQueue];
    } else if (queueType === 'VIP') {
      newFullQueue = [...vvipQueue, ...subQueue, ...basicQueue];
    } else {
      newFullQueue = [...vvipQueue, ...vipQueue, ...subQueue];
    }

    setDraggedItem(null);
    setDragOverIndex(null);

    await reorderQueue(newFullQueue);
    addToast('Urutan antrian berhasil diperbarui!', 'success');
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <aside className="w-full flex flex-col gap-3.5">
      <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-3xl p-4 md:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border-default">
          <div className="flex items-center gap-2 font-extrabold text-sm text-text-primary tracking-tight">
            <div className="w-6 h-6 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
              <Users size={14} />
            </div>
            <span>Daftar Antrian</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono font-bold text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded-lg">
              {queue.length} org • {totalQueueHours.toFixed(1)}j
            </span>

            {isAdmin && (
              <button
                onClick={() => setIsAddOpen(!isAddOpen)}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isAddOpen 
                    ? 'bg-accent-red/20 text-accent-red border border-accent-red/30' 
                    : 'bg-accent-purple/20 text-accent-purple-light hover:bg-accent-purple/30 border border-accent-purple/30'
                }`}
                title={isAddOpen ? 'Tutup Form' : 'Tambah Antrian Baru'}
              >
                {isAddOpen ? <X size={13} /> : <Plus size={13} />}
                <span className="text-[11px] font-extrabold">{isAddOpen ? 'Tutup' : 'Tambah'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Add Form (Admin Only) */}
        {isAdmin && isAddOpen && (
          <form 
            onSubmit={handleAddQueue}
            className="mb-4 p-3.5 bg-bg-primary/95 border border-accent-purple/30 rounded-2xl shadow-xl space-y-2.5 animate-slide-in relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-accent-purple-light flex items-center gap-1">
                <Plus size={12} />
                <span>Input Antrian Baru</span>
              </span>
              <span className="text-[10px] font-mono text-accent-yellow font-extrabold">
                {formatRupiah(calculatedPrice)}
              </span>
            </div>

            {/* Username Roblox with Autocomplete */}
            <div className="relative">
              <Gamepad2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-accent-cyan" />
              <input
                type="text"
                required
                placeholder="Username Roblox *"
                value={qUsername}
                onChange={(e) => {
                  setQUsername(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-text-primary font-bold outline-none focus:border-accent-purple/50"
              />

              {/* Autocomplete Dropdown */}
              {showSuggestions && matchingSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-bg-surface border border-border-default rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase text-accent-cyan border-b border-border-subtle flex items-center gap-1">
                    <Sparkles size={10} />
                    <span>Pelanggan Lama (Auto-Fill)</span>
                  </div>
                  {matchingSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectSuggestion(sug)}
                      className="w-full px-2.5 py-1.5 text-left text-xs text-white hover:bg-accent-purple/15 flex items-center justify-between border-b border-border-subtle last:border-0 cursor-pointer"
                    >
                      <span className="font-bold">{sug.username}</span>
                      <span className="text-[10px] text-accent-cyan">{sug.tiktokName ? `@${sug.tiktokName}` : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-cyan">@</span>
              <input
                type="text"
                placeholder="Akun TikTok (opsional)"
                value={qTiktok}
                onChange={(e) => setQTiktok(e.target.value)}
                className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 pl-7 pr-2.5 text-xs text-text-primary outline-none focus:border-accent-purple/50"
              />
            </div>

            {/* Brankas Credentials: Password & Email */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border-subtle">
              <div className="relative">
                <Lock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-accent-cyan" />
                <input
                  type="password"
                  placeholder="Pass Roblox"
                  value={qPassword}
                  onChange={(e) => setQPassword(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 pl-6 pr-2 text-xs text-text-primary font-mono outline-none focus:border-accent-purple/50"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-accent-purple-light" />
                <input
                  type="text"
                  placeholder="Email OTP"
                  value={qEmail}
                  onChange={(e) => setQEmail(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 pl-6 pr-2 text-xs text-text-primary outline-none focus:border-accent-purple/50"
                />
              </div>
            </div>

            {/* Service & Duration */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] uppercase font-bold text-text-dim mb-0.5">Layanan</label>
                <select
                  value={qService}
                  onChange={(e) => setQService(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 px-2 text-xs text-text-primary outline-none focus:border-accent-purple/50 cursor-pointer font-bold"
                >
                  {services ? services.filter(s => s.enabled).map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name} (Rp {Number(s.price || 4000).toLocaleString('id-ID')}/j)
                    </option>
                  )) : (
                    <>
                      <option value="Basic">Basic ({priceBasic ? `${priceBasic / 1000}k` : '4k'}/j)</option>
                      <option value="VIP">VIP ({priceVip ? `${priceVip / 1000}k` : '6k'}/j - Priority)</option>
                      {enableVvipSlot && (
                        <option value="VVIP">VVIP ({priceVvip ? `${priceVvip / 1000}k` : '10k'}/j - Super Priority)</option>
                      )}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[9.5px] uppercase font-bold text-text-dim mb-0.5">Durasi</label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="1"
                    required
                    value={qAmount}
                    onChange={(e) => setQAmount(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 px-2 text-xs text-text-primary font-mono font-bold outline-none focus:border-accent-purple/50"
                  />
                  <select
                    value={qUnit}
                    onChange={(e) => setQUnit(e.target.value)}
                    className="w-16 bg-bg-surface border border-border-default rounded-lg py-1.5 px-1 text-[11px] text-text-primary outline-none focus:border-accent-purple/50 cursor-pointer font-bold"
                  >
                    <option value="hour">Jam</option>
                    <option value="minute">Mnt</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="flex gap-1">
              {DURATION_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="flex-1 py-1 rounded bg-bg-surface hover:bg-white/10 text-[10px] font-mono text-text-muted hover:text-text-primary border border-border-subtle cursor-pointer transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loadingAdd}
              className="w-full py-2 rounded-xl text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-md shadow-accent-purple/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check size={13} />
              <span>{loadingAdd ? 'Menyimpan...' : `Masukan ke Antrian ${qService}`}</span>
            </button>
          </form>
        )}

        {/* 3 STRUCTURED QUEUE SECTIONS: VVIP (Top), VIP (Middle), BASIC (Bottom) */}
        <div className="space-y-4">
          
          {/* 1. VVIP QUEUE (Super Priority) - Dynamically shown if VVIP is enabled or if VVIP queue exists */}
          {(enableVvipSlot || vvipQueue.length > 0) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Gem size={14} className="text-rose-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-400">
                  Antrian VVIP (Super Priority)
                </span>
                <span className="text-[10px] font-mono font-bold text-rose-400/80 ml-auto">
                  {vvipQueue.length} Orang {isAdmin && vvipQueue.length > 1 && '(Tarik ⠿)'}
                </span>
              </div>

              {vvipQueue.length === 0 ? (
                <div className="py-2.5 px-3 rounded-xl bg-rose-500/[0.03] border border-dashed border-rose-500/25 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-rose-300/60 font-medium">Belum ada antrean VVIP</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setQService('VVIP');
                        setIsAddOpen(true);
                      }}
                      className="text-[10px] font-black text-rose-400 hover:text-white px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 cursor-pointer transition-colors"
                    >
                      + Tambah VVIP
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {vvipQueue.map((item, index) => {
                    const isEditing = editingId === item.id;
                    const isBeingDragged = draggedItem?.item?.id === item.id;
                    const isTargetDrop = dragOverIndex === index && draggedItem?.queueType === 'VVIP';

                    if (isEditing) {
                      return (
                        <div key={item.id} className="p-3 bg-bg-primary rounded-xl border border-rose-500/40 space-y-2 text-xs">
                          <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs font-bold outline-none"
                            placeholder="Roblox Username"
                          />
                          <input
                            type="text"
                            value={editTiktok}
                            onChange={(e) => setEditTiktok(e.target.value)}
                            className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs outline-none"
                            placeholder="TikTok Username"
                          />
                          <input
                            type="password"
                            value={editPassword}
                            onChange={(e) => setEditPassword(e.target.value)}
                            className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs font-mono outline-none"
                            placeholder="Password Roblox"
                          />
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              onClick={cancelEdit}
                              className="p-1 rounded bg-bg-surface text-text-dim hover:text-text-primary text-xs px-2"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => saveEdit(item.id)}
                              className="p-1 rounded bg-accent-green text-bg-primary font-bold text-xs px-2.5 flex items-center gap-1"
                            >
                              <Check size={12} /> Simpan
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={item.id}
                        draggable={isAdmin}
                        onDragStart={(e) => handleDragStart(e, item, index, 'VVIP')}
                        onDragOver={(e) => handleDragOver(e, index, 'VVIP')}
                        onDrop={(e) => handleDrop(e, index, 'VVIP')}
                        onDragEnd={handleDragEnd}
                        className={`group p-2.5 rounded-2xl bg-bg-primary hover:bg-rose-500/[0.04] border transition-all shadow-sm flex items-center justify-between gap-2 relative ${
                          isBeingDragged 
                            ? 'opacity-40 border-dashed border-rose-500' 
                            : isTargetDrop 
                            ? 'border-rose-500 ring-2 ring-rose-500 scale-[1.01]' 
                            : 'border-rose-500/30 hover:border-rose-500/60'
                        }`}
                      >
                        {/* Left: Drag Handle + Number + User Info */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {isAdmin && (
                            <div 
                              className="text-rose-400/50 hover:text-rose-400 cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                              title="Tarik untuk urutkan antrian"
                            >
                              <GripVertical size={14} />
                            </div>
                          )}

                          <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex flex-col items-center justify-center font-black text-rose-300 shrink-0">
                            <span className="text-[7.5px] leading-none">VVIP</span>
                            <span className="text-[11px] leading-none font-mono text-white">#{index + 1}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="font-black text-xs text-white tracking-tight truncate flex items-center gap-1.5">
                              <span className="truncate">{item.username}</span>
                              <Gem size={11} className="text-rose-400 shrink-0" />
                              {index === 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500 text-white animate-pulse shadow-sm shrink-0">
                                  ⚡ UP NEXT
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-text-dim truncate flex items-center gap-1.5">
                              {item.tiktokName ? (
                                <span className="text-rose-300 truncate">@{item.tiktokName}</span>
                              ) : (
                                <span className="text-text-faint">Tamu</span>
                              )}
                              <span>•</span>
                              <span className="font-mono font-bold text-rose-200/80">{formatDuration(item.duration)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions in 1 Compact Row */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => onStartFromQueue(item)}
                              title="Pilih Slot & Mulai Mainkan"
                              className="py-1 px-2 rounded-lg text-xs font-black text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <Gem size={11} />
                              <span>Slot</span>
                            </button>

                            <button
                              onClick={() => setCredentialCustomer(item)}
                              title="Buka Brankas Akun (Password/Email)"
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-green/20 text-accent-green border border-border-subtle transition-colors cursor-pointer"
                            >
                              <Key size={11} />
                            </button>
                            <button
                              onClick={() => handleCopyDM(item)}
                              title="Salin Pesan DM TikTok"
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-cyan/20 text-accent-cyan border border-border-subtle transition-colors cursor-pointer"
                            >
                              <MessageSquare size={11} />
                            </button>
                            <button
                              onClick={() => startEdit(item)}
                              title="Edit"
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-white/10 text-text-dim hover:text-white border border-border-subtle transition-colors cursor-pointer"
                            >
                              <Pencil size={11} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="Hapus"
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-red/20 text-text-dim hover:text-accent-red border border-border-subtle transition-colors cursor-pointer"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. VIP QUEUE (Priority) */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Crown size={14} className="text-accent-yellow" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-yellow">
                Antrian VIP (Priority)
              </span>
              <span className="text-[10px] font-mono font-bold text-accent-yellow/80 ml-auto">
                {vipQueue.length} Orang {isAdmin && vipQueue.length > 1 && '(Tarik ⠿)'}
              </span>
            </div>

            {vipQueue.length === 0 ? (
              <div className="py-2.5 px-3 rounded-xl bg-accent-yellow/[0.03] border border-dashed border-accent-yellow/25 flex items-center justify-between text-xs">
                <span className="text-[11px] text-accent-yellow/60 font-medium">Belum ada antrean VIP</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setQService('VIP');
                      setIsAddOpen(true);
                    }}
                    className="text-[10px] font-black text-accent-yellow hover:text-accent-yellow-light px-2 py-0.5 rounded bg-accent-yellow/15 border border-accent-yellow/30 cursor-pointer transition-colors"
                  >
                    + Tambah VIP
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {vipQueue.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const isBeingDragged = draggedItem?.item?.id === item.id;
                  const isTargetDrop = dragOverIndex === index && draggedItem?.queueType === 'VIP';

                  if (isEditing) {
                    return (
                      <div key={item.id} className="p-3 bg-bg-primary rounded-xl border border-accent-yellow/40 space-y-2 text-xs">
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs font-bold outline-none"
                          placeholder="Roblox Username"
                        />
                        <input
                          type="text"
                          value={editTiktok}
                          onChange={(e) => setEditTiktok(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs outline-none"
                          placeholder="TikTok Username"
                        />
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs font-mono outline-none"
                          placeholder="Password Roblox"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-bg-surface text-text-dim hover:text-text-primary text-xs px-2"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-1 rounded bg-accent-green text-bg-primary font-bold text-xs px-2.5 flex items-center gap-1"
                          >
                            <Check size={12} /> Simpan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={item.id}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, item, index, 'VIP')}
                      onDragOver={(e) => handleDragOver(e, index, 'VIP')}
                      onDrop={(e) => handleDrop(e, index, 'VIP')}
                      onDragEnd={handleDragEnd}
                      className={`group p-2.5 rounded-2xl bg-gradient-to-r from-accent-yellow/[0.08] to-transparent border transition-all shadow-sm flex items-center justify-between gap-2 relative ${
                        isBeingDragged 
                          ? 'opacity-40 border-dashed border-accent-yellow' 
                          : isTargetDrop 
                          ? 'border-accent-cyan ring-2 ring-accent-cyan scale-[1.01]' 
                          : 'border-accent-yellow/35 hover:border-accent-yellow/60'
                      }`}
                    >
                      {/* Left: Drag Handle + Number + User Info */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isAdmin && (
                          <div 
                            className="text-accent-yellow/40 hover:text-accent-yellow cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                            title="Tarik untuk urutkan antrian"
                          >
                            <GripVertical size={14} />
                          </div>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-accent-yellow/20 border border-accent-yellow/40 flex flex-col items-center justify-center font-black text-accent-yellow shrink-0">
                          <span className="text-[8px] leading-none">VIP</span>
                          <span className="text-[11px] leading-none font-mono">#{index + 1}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-black text-xs text-white tracking-tight truncate flex items-center gap-1.5">
                            <span className="truncate">{item.username}</span>
                            <Crown size={11} className="text-accent-yellow shrink-0" />
                            {index === 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-accent-yellow text-black animate-pulse shadow-sm shrink-0">
                                ⚡ UP NEXT
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-text-dim truncate flex items-center gap-1.5">
                            {item.tiktokName ? (
                              <span className="text-accent-cyan truncate">@{item.tiktokName}</span>
                            ) : (
                              <span className="text-text-faint">Tamu</span>
                            )}
                            <span>•</span>
                            <span className="font-mono font-bold text-accent-yellow/90">{formatDuration(item.duration)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions in 1 Compact Row */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onStartFromQueue(item)}
                            title="Pilih Slot VIP & Mulai Mainkan"
                            className="py-1 px-2 rounded-lg text-xs font-black text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Gamepad2 size={11} />
                            <span>Slot</span>
                          </button>

                          <button
                            onClick={() => setCredentialCustomer(item)}
                            title="Buka Brankas Akun (Password/Email)"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-green/20 text-accent-green border border-border-subtle transition-colors cursor-pointer"
                          >
                            <Key size={11} />
                          </button>
                          <button
                            onClick={() => handleCopyDM(item)}
                            title="Salin Pesan DM TikTok"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-cyan/20 text-accent-cyan border border-border-subtle transition-colors cursor-pointer"
                          >
                            <MessageSquare size={11} />
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            title="Edit"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-white/10 text-text-dim hover:text-white border border-border-subtle transition-colors cursor-pointer"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="Hapus"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-red/20 text-text-dim hover:text-accent-red border border-border-subtle transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. BASIC QUEUE (Standard) */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Gamepad2 size={14} className="text-accent-cyan" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-cyan">
                Antrian Basic
              </span>
              <span className="text-[10px] font-mono font-bold text-accent-cyan/80 ml-auto">
                {basicQueue.length} Orang {isAdmin && basicQueue.length > 1 && '(Tarik ⠿)'}
              </span>
            </div>

            {basicQueue.length === 0 ? (
              <div className="py-2.5 px-3 rounded-xl bg-accent-cyan/[0.03] border border-dashed border-accent-cyan/25 flex items-center justify-between text-xs">
                <span className="text-[11px] text-text-dim font-medium">Belum ada antrean basic</span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setQService('Basic');
                      setIsAddOpen(true);
                    }}
                    className="text-[10px] font-black text-accent-cyan hover:text-white px-2 py-0.5 rounded bg-accent-cyan/15 border border-accent-cyan/30 cursor-pointer transition-colors"
                  >
                    + Tambah Basic
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {basicQueue.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const isBeingDragged = draggedItem?.item?.id === item.id;
                  const isTargetDrop = dragOverIndex === index && draggedItem?.queueType === 'BASIC';

                  if (isEditing) {
                    return (
                      <div key={item.id} className="p-3 bg-bg-primary rounded-xl border border-accent-cyan/40 space-y-2 text-xs">
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs font-bold outline-none"
                          placeholder="Roblox Username"
                        />
                        <input
                          type="text"
                          value={editTiktok}
                          onChange={(e) => setEditTiktok(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs outline-none"
                          placeholder="TikTok Username"
                        />
                        <input
                          type="password"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="w-full bg-bg-surface border border-border-default rounded px-2 py-1 text-text-primary text-xs font-mono outline-none"
                          placeholder="Password Roblox"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-bg-surface text-text-dim hover:text-text-primary text-xs px-2"
                          >
                            Batal
                          </button>
                          <button
                            onClick={() => saveEdit(item.id)}
                            className="p-1 rounded bg-accent-green text-bg-primary font-bold text-xs px-2.5 flex items-center gap-1"
                          >
                            <Check size={12} /> Simpan
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={item.id}
                      draggable={isAdmin}
                      onDragStart={(e) => handleDragStart(e, item, index, 'BASIC')}
                      onDragOver={(e) => handleDragOver(e, index, 'BASIC')}
                      onDrop={(e) => handleDrop(e, index, 'BASIC')}
                      onDragEnd={handleDragEnd}
                      className={`group p-2.5 rounded-2xl bg-bg-primary hover:bg-white/[0.04] border transition-all shadow-sm flex items-center justify-between gap-2 relative ${
                        isBeingDragged 
                          ? 'opacity-40 border-dashed border-accent-cyan' 
                          : isTargetDrop 
                          ? 'border-accent-purple ring-2 ring-accent-purple scale-[1.01]' 
                          : 'border-border-default hover:border-border-muted'
                      }`}
                    >
                      {/* Left: Drag Handle + Number + User Info */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {isAdmin && (
                          <div 
                            className="text-text-faint hover:text-accent-cyan cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                            title="Tarik untuk urutkan antrian"
                          >
                            <GripVertical size={14} />
                          </div>
                        )}

                        <div className="w-7 h-7 rounded-lg bg-white/5 border border-border-subtle flex flex-col items-center justify-center font-black text-text-tertiary shrink-0">
                          <span className="text-[7.5px] leading-none">REG</span>
                          <span className="text-[11px] leading-none font-mono text-white">#{index + 1}</span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-black text-xs text-white tracking-tight truncate flex items-center gap-1.5">
                            <span className="truncate">{item.username}</span>
                            {index === 0 && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-accent-cyan text-black animate-pulse shadow-sm shrink-0">
                                ⚡ UP NEXT
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-text-dim truncate flex items-center gap-1.5">
                            {item.tiktokName ? (
                              <span className="text-accent-cyan truncate">@{item.tiktokName}</span>
                            ) : (
                              <span className="text-text-faint">Tamu</span>
                            )}
                            <span>•</span>
                            <span className="font-mono font-bold text-text-muted">{formatDuration(item.duration)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions in 1 Compact Row */}
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => onStartFromQueue(item)}
                            title="Pilih Slot & Mulai Mainkan"
                            className="py-1 px-2 rounded-lg text-xs font-black text-white bg-accent-green/25 hover:bg-accent-green/35 text-accent-green border border-accent-green/40 active:scale-95 transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Gamepad2 size={11} />
                            <span>Slot</span>
                          </button>

                          <button
                            onClick={() => setCredentialCustomer(item)}
                            title="Buka Brankas Akun (Password/Email)"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-green/20 text-accent-green border border-border-subtle transition-colors cursor-pointer"
                          >
                            <Key size={11} />
                          </button>
                          <button
                            onClick={() => handleCopyDM(item)}
                            title="Salin Pesan DM TikTok"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-cyan/20 text-accent-cyan border border-border-subtle transition-colors cursor-pointer"
                          >
                            <MessageSquare size={11} />
                          </button>
                          <button
                            onClick={() => startEdit(item)}
                            title="Edit"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-white/10 text-text-dim hover:text-white border border-border-subtle transition-colors cursor-pointer"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="Hapus"
                            className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-red/20 text-text-dim hover:text-accent-red border border-border-subtle transition-colors cursor-pointer"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clear All Queue (Admin Only) */}
        {isAdmin && queue.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border-subtle">
            <button
              onClick={onRequestClearQueue}
              className="w-full py-2 rounded-xl text-xs font-bold text-accent-red hover:bg-accent-red/10 border border-accent-red/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Kosongkan Semua Antrian</span>
            </button>
          </div>
        )}
      </div>

      {/* Credential Modal for Queue Item */}
      <CredentialModal
        customer={credentialCustomer}
        onClose={() => setCredentialCustomer(null)}
      />
    </aside>
  );
};

export default QueueSidebar;
