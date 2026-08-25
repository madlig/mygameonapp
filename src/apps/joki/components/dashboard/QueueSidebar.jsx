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
  Clock, 
  Sparkles,
  User,
  GripVertical,
  DollarSign
} from 'lucide-react';

const PRICE_BASIC = 4000;
const PRICE_VIP = 6000;

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
  const [qService, setQService] = useState('Basic');
  const [qAmount, setQAmount] = useState(1);
  const [qUnit, setQUnit] = useState('hour');
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Edit Queue Item state
  const [editingId, setEditingId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editService, setEditService] = useState('Basic');
  const [editDuration, setEditDuration] = useState(1);

  // Drag and Drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Calculate actual duration in hours and price
  const calculatedHours = qUnit === 'hour' ? Number(qAmount || 0) : Number(qAmount || 0) / 60;
  const pricePerHour = qService === 'VIP' ? PRICE_VIP : PRICE_BASIC;
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
        service: qService === 'VIP' ? 'VIP' : 'Basic',
        duration: calculatedHours,
        price: calculatedPrice,
        paymentStatus: 'Lunas',
        createdAt: Date.now()
      });

      setQUsername('');
      setQTiktok('');
      setQAmount(1);
      setQUnit('hour');
      setIsAddOpen(false);
      addToast(`Customer ${qUsername} berhasil masuk daftar antrian!`, 'success');
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
    setEditService(item.service === 'VIP' ? 'VIP' : 'Basic');
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
      const rate = editService === 'VIP' ? PRICE_VIP : PRICE_BASIC;
      await updateJokiQueue(id, {
        username: editUsername.trim(),
        tiktokName: editTiktok.trim().replace(/^@/, ''),
        service: editService === 'VIP' ? 'VIP' : 'Basic',
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

  // Drag and drop handlers within queue group
  const handleDragStart = (e, item, index, isVip) => {
    if (!isAdmin) return;
    setDraggedItem({ item, index, isVip });
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent drag image or styling if needed
  };

  const handleDragOver = (e, index, isVip) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.isVip !== isVip) return;
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e, targetIndex, isVip) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.isVip !== isVip || draggedItem.index === targetIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const currentSubQueue = isVip 
      ? queue.filter(q => q.service === 'VIP') 
      : queue.filter(q => q.service !== 'VIP');

    const otherSubQueue = isVip 
      ? queue.filter(q => q.service !== 'VIP') 
      : queue.filter(q => q.service === 'VIP');

    // Reorder the target sub-queue
    const updatedSubQueue = [...currentSubQueue];
    const [movedItem] = updatedSubQueue.splice(draggedItem.index, 1);
    updatedSubQueue.splice(targetIndex, 0, movedItem);

    // Combine full queue (VIP first, then Basic)
    const newFullQueue = isVip 
      ? [...updatedSubQueue, ...otherSubQueue] 
      : [...otherSubQueue, ...updatedSubQueue];

    setDraggedItem(null);
    setDragOverIndex(null);

    await reorderQueue(newFullQueue);
    addToast('Urutan antrian berhasil diperbarui!', 'success');
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const vipQueue = queue.filter(q => q.service === 'VIP');
  const basicQueue = queue.filter(q => q.service !== 'VIP');

  return (
    <aside className="w-full lg:w-[350px] shrink-0 flex flex-col gap-3.5">
      <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-2xl p-4 md:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-border-default">
          <div className="flex items-center gap-2 font-extrabold text-sm text-text-primary tracking-tight">
            <div className="w-6 h-6 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
              <Users size={14} />
            </div>
            <span>Daftar Antrian</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
              {queue.length} orang
            </span>

            {/* Collapsible Add Button for Admin */}
            {isAdmin && (
              <button
                onClick={() => setIsAddOpen(!isAddOpen)}
                title={isAddOpen ? 'Tutup Form Tambah' : 'Buka Form Tambah Antrian'}
                className={`p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isAddOpen
                    ? 'bg-accent-purple text-white border-accent-purple shadow-sm shadow-accent-purple/20'
                    : 'bg-bg-primary text-text-muted hover:text-text-primary border-border-default hover:border-accent-purple/40'
                }`}
              >
                <Plus size={13} />
                <span className="text-[10.5px]">{isAddOpen ? 'Tutup' : 'Tambah'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Quick Add Form (Admin Only) */}
        {isAdmin && isAddOpen && (
          <form onSubmit={handleAddQueue} className="space-y-2.5 mb-4 p-3.5 rounded-xl bg-bg-primary border border-accent-purple/30 animate-slide-in shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-accent-purple-light flex items-center gap-1">
                <Sparkles size={12} />
                <span>Input Customer Antrian</span>
              </span>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-text-dim hover:text-text-primary p-0.5"
              >
                <X size={13} />
              </button>
            </div>

            <div className="relative">
              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
              <input
                type="text"
                required
                placeholder="Username Roblox *"
                value={qUsername}
                onChange={(e) => setQUsername(e.target.value)}
                className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 pl-8 pr-2.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 font-bold"
              />
            </div>

            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-accent-cyan">@</span>
              <input
                type="text"
                placeholder="Akun TikTok (opsional)"
                value={qTiktok}
                onChange={(e) => setQTiktok(e.target.value)}
                className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 pl-7 pr-2.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50"
              />
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
                  <option value="Basic">Basic (4k/j)</option>
                  <option value="VIP">VIP (6k/j - Priority)</option>
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

            {/* Presets */}
            <div className="grid grid-cols-5 gap-1">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="py-1 rounded text-[10.5px] font-bold bg-bg-surface hover:bg-white/5 border border-border-subtle text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Estimasi Nominal & Durasi Info */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-bg-surface border border-border-default shadow-inner">
              <div className="flex items-center gap-1.5 text-text-tertiary text-[11px] font-bold">
                <DollarSign size={13} className="text-accent-yellow" />
                <span>Estimasi Biaya:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10.5px] text-text-dim font-mono font-semibold">
                  ({formatDuration(calculatedHours)})
                </span>
                <span className="font-mono font-black text-xs text-accent-yellow tracking-tight">
                  {formatRupiah(calculatedPrice)}
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loadingAdd}
              className="w-full py-2 rounded-lg text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-md shadow-accent-purple/20 cursor-pointer flex items-center justify-center gap-1.5 mt-1"
            >
              <Plus size={14} />
              <span>{loadingAdd ? 'Menyimpan...' : '＋ Simpan ke Antrian'}</span>
            </button>
          </form>
        )}

        {/* HERO SECTION: The Queue Lists */}
        <div className="space-y-4 max-h-[620px] overflow-y-auto pr-1">
          {/* 1. VIP QUEUE (Priority) */}
          {vipQueue.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <Crown size={14} className="text-accent-yellow" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-yellow">
                  Antrian VIP (Priority)
                </span>
                <span className="text-[10px] font-mono font-bold text-accent-yellow/80 ml-auto">
                  {vipQueue.length} Orang {isAdmin && '(Tarik ⠿ utk atur urutan)'}
                </span>
              </div>

              <div className="space-y-2">
                {vipQueue.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const isBeingDragged = draggedItem?.item?.id === item.id;
                  const isTargetDrop = dragOverIndex === index && draggedItem?.isVip === true;

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
                      onDragStart={(e) => handleDragStart(e, item, index, true)}
                      onDragOver={(e) => handleDragOver(e, index, true)}
                      onDrop={(e) => handleDrop(e, index, true)}
                      onDragEnd={handleDragEnd}
                      className={`group p-3 rounded-xl bg-gradient-to-r from-accent-yellow/[0.08] to-transparent border-2 transition-all shadow-md relative ${
                        isBeingDragged 
                          ? 'opacity-40 border-dashed border-accent-yellow' 
                          : isTargetDrop 
                          ? 'border-accent-cyan ring-2 ring-accent-cyan scale-[1.02]' 
                          : 'border-accent-yellow/35 hover:border-accent-yellow/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Queue Position Badge & User Info */}
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Grip Handle for Admin */}
                          {isAdmin && (
                            <div 
                              className="text-accent-yellow/40 hover:text-accent-yellow cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                              title="Tarik untuk memindahkan urutan antrian"
                            >
                              <GripVertical size={15} />
                            </div>
                          )}

                          <div className="w-8 h-8 rounded-lg bg-accent-yellow/20 border border-accent-yellow/40 flex flex-col items-center justify-center font-black text-accent-yellow shrink-0">
                            <span className="text-[9px] leading-none">VIP</span>
                            <span className="text-xs leading-none font-mono">#{index + 1}</span>
                          </div>

                          <div className="min-w-0">
                            <div className="font-black text-sm text-white tracking-tight truncate flex items-center gap-1">
                              <span>{item.username}</span>
                              <Crown size={12} className="text-accent-yellow shrink-0" />
                            </div>
                            <div className="text-[11px] text-text-muted truncate">
                              {item.tiktokName ? (
                                <span className="text-accent-cyan">@{item.tiktokName}</span>
                              ) : (
                                <span className="text-text-faint">Tamu Live</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent-yellow/15 text-accent-yellow font-mono font-black text-[11px] border border-accent-yellow/30">
                            <Clock size={10} />
                            <span>{formatDuration(item.duration)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Admin Actions Bar */}
                      {isAdmin && (
                        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-accent-yellow/20">
                          <button
                            onClick={() => onStartFromQueue(item)}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-black text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Gamepad2 size={13} />
                            <span>Masuk Slot Live</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(item)}
                              title="Edit Antrian"
                              className="p-1.5 rounded-lg bg-bg-primary hover:bg-white/10 text-text-dim hover:text-text-primary border border-border-subtle transition-colors cursor-pointer"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="Hapus Antrian"
                              className="p-1.5 rounded-lg bg-bg-primary hover:bg-accent-red/20 text-text-dim hover:text-accent-red border border-border-subtle transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. BASIC QUEUE (Standard) */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 px-1">
              <Gamepad2 size={14} className="text-accent-cyan" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-accent-cyan">
                Antrian Basic
              </span>
              <span className="text-[10px] font-mono font-bold text-accent-cyan/80 ml-auto">
                {basicQueue.length} Orang {isAdmin && '(Tarik ⠿ utk atur urutan)'}
              </span>
            </div>

            {basicQueue.length === 0 && vipQueue.length === 0 ? (
              <div className="py-8 px-4 text-center rounded-xl bg-bg-primary border border-border-subtle">
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-white/[0.03] border border-border-subtle flex items-center justify-center text-text-faint">
                  <Users size={18} />
                </div>
                <div className="text-xs font-bold text-text-muted">Antrian Masih Kosong</div>
                <p className="text-[11px] text-text-faint mt-0.5 m-0">
                  {isAdmin ? 'Klik tombol + Tambah di atas untuk memasukkan pemain.' : 'Siap menerima joki baru dari penonton live.'}
                </p>
              </div>
            ) : basicQueue.length === 0 ? (
              <div className="py-3 px-3 text-center rounded-xl bg-bg-primary/50 border border-border-subtle text-[11px] text-text-faint">
                Tidak ada antrian basic saat ini.
              </div>
            ) : (
              <div className="space-y-2">
                {basicQueue.map((item, index) => {
                  const isEditing = editingId === item.id;
                  const isBeingDragged = draggedItem?.item?.id === item.id;
                  const isTargetDrop = dragOverIndex === index && draggedItem?.isVip === false;

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
                      onDragStart={(e) => handleDragStart(e, item, index, false)}
                      onDragOver={(e) => handleDragOver(e, index, false)}
                      onDrop={(e) => handleDrop(e, index, false)}
                      onDragEnd={handleDragEnd}
                      className={`group p-3 rounded-xl bg-bg-primary hover:bg-white/[0.02] border transition-all shadow-sm relative ${
                        isBeingDragged 
                          ? 'opacity-40 border-dashed border-accent-cyan' 
                          : isTargetDrop 
                          ? 'border-accent-cyan ring-2 ring-accent-cyan scale-[1.02]' 
                          : 'border-border-default hover:border-accent-cyan/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        {/* Queue Position Badge & User Info */}
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Grip Handle for Admin */}
                          {isAdmin && (
                            <div 
                              className="text-text-faint hover:text-accent-cyan cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                              title="Tarik untuk memindahkan urutan antrian"
                            >
                              <GripVertical size={15} />
                            </div>
                          )}

                          <div className="w-7 h-7 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center font-mono font-black text-xs text-accent-cyan shrink-0">
                            #{index + 1}
                          </div>

                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-white tracking-tight truncate">
                              {item.username}
                            </div>
                            <div className="text-[11px] text-text-muted truncate">
                              {item.tiktokName ? (
                                <span className="text-accent-cyan">@{item.tiktokName}</span>
                              ) : (
                                <span className="text-text-faint">Tamu Live</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-text-secondary font-mono font-bold text-[11px] border border-border-subtle">
                            <Clock size={10} className="text-accent-cyan" />
                            <span>{formatDuration(item.duration)}</span>
                          </span>
                        </div>
                      </div>

                      {/* Admin Actions Bar */}
                      {isAdmin && (
                        <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-border-subtle">
                          <button
                            onClick={() => onStartFromQueue(item)}
                            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Gamepad2 size={13} />
                            <span>Masuk Slot Live</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEdit(item)}
                              title="Edit Antrian"
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-white/10 text-text-dim hover:text-text-primary border border-border-default transition-colors cursor-pointer"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="Hapus Antrian"
                              className="p-1.5 rounded-lg bg-bg-surface hover:bg-accent-red/20 text-text-dim hover:text-accent-red border border-border-default transition-colors cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Clear Queue Footer Button for Admin */}
        {isAdmin && queue.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border-subtle flex justify-end">
            <button
              onClick={onRequestClearQueue}
              className="text-[11px] font-bold text-accent-red/80 hover:text-accent-red hover:bg-accent-red/10 py-1 px-2.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={11} />
              <span>Kosongkan Antrian</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};

export default QueueSidebar;
