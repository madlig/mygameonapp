import React, { useState } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  Users, 
  Plus, 
  Play, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Crown, 
  Gamepad2, 
  Clock, 
  User 
} from 'lucide-react';

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const QueueSidebar = ({ onStartFromQueue, onRequestClearQueue }) => {
  const { 
    queue, 
    addJokiQueue, 
    updateJokiQueue, 
    deleteJokiQueue, 
    isAdmin, 
    addToast 
  } = useJoki();

  const [qUsername, setQUsername] = useState('');
  const [qTiktok, setQTiktok] = useState('');
  const [qService, setQService] = useState('Basic');
  const [qDuration, setQDuration] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editTiktok, setEditTiktok] = useState('');
  const [editService, setEditService] = useState('Basic');
  const [editDuration, setEditDuration] = useState(1);

  const handleAddQueue = async (e) => {
    if (e) e.preventDefault();
    if (!qUsername.trim()) {
      addToast('Username Roblox wajib diisi.', 'error');
      return;
    }

    try {
      await addJokiQueue({
        username: qUsername.trim(),
        tiktokName: qTiktok.trim().replace(/^@/, ''),
        service: qService,
        duration: Number(qDuration) || 1,
      });

      setQUsername('');
      setQTiktok('');
      setQDuration(1);
      addToast(`Customer ${qUsername} berhasil masuk antrian!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal menambahkan ke antrian.', 'error');
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditUsername(item.username);
    setEditTiktok(item.tiktokName || '');
    setEditService(item.service);
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
      await updateJokiQueue(id, {
        username: editUsername.trim(),
        tiktokName: editTiktok.trim().replace(/^@/, ''),
        service: editService,
        duration: Number(editDuration) || 1,
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

  const vipQueue = queue.filter(q => q.service === 'VIP');
  const basicQueue = queue.filter(q => q.service !== 'VIP');

  return (
    <aside className="w-full lg:w-[340px] shrink-0 flex flex-col gap-3.5">
      <div className="bg-bg-surface/90 backdrop-blur-xl border border-border-default rounded-2xl p-4 md:p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border-default">
          <div className="flex items-center gap-2 font-extrabold text-sm text-text-primary tracking-tight">
            <Users size={17} className="text-accent-cyan" />
            <span>Daftar Antrian</span>
          </div>
          <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
            {queue.length} orang
          </span>
        </div>

        {/* Quick Add Form (Admin Only) */}
        {isAdmin && (
          <form onSubmit={handleAddQueue} className="space-y-2 mb-4 p-3 rounded-xl bg-bg-primary/90 border border-border-subtle">
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-text-tertiary">
              Tambah ke Antrian
            </div>

            <input
              type="text"
              required
              placeholder="Username Roblox"
              value={qUsername}
              onChange={(e) => setQUsername(e.target.value)}
              className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 px-2.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-cyan/50 transition-colors"
            />

            <input
              type="text"
              placeholder="Akun TikTok (opsional)"
              value={qTiktok}
              onChange={(e) => setQTiktok(e.target.value)}
              className="w-full bg-bg-surface border border-border-default rounded-lg py-1.5 px-2.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-cyan/50 transition-colors"
            />

            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={qService}
                onChange={(e) => setQService(e.target.value)}
                className="bg-bg-surface border border-border-default rounded-lg py-1.5 px-2 text-xs text-text-primary outline-none focus:border-accent-cyan/50 transition-colors cursor-pointer"
              >
                <option value="Basic" className="bg-bg-surface">Basic</option>
                <option value="VIP" className="bg-bg-surface">VIP</option>
              </select>

              <input
                type="number"
                min="0.01"
                step="0.25"
                required
                placeholder="Durasi (jam)"
                value={qDuration}
                onChange={(e) => setQDuration(e.target.value)}
                className="bg-bg-surface border border-border-default rounded-lg py-1.5 px-2 text-xs text-text-primary outline-none focus:border-accent-cyan/50 transition-colors font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-extrabold text-bg-primary bg-accent-cyan hover:brightness-110 active:scale-95 transition-all shadow-md shadow-accent-cyan/15 cursor-pointer"
            >
              <Plus size={14} />
              <span>Tambah ke Antrian</span>
            </button>
          </form>
        )}

        {isAdmin && (
          <p className="text-[11px] text-text-dim leading-relaxed mb-3.5 px-1">
            💡 <strong className="text-text-muted">Klik nama di antrian</strong> untuk mulai billing dan memasukkan customer ke slot game live.
          </p>
        )}

        {/* VIP Queue Group */}
        <div className="mb-3 bg-bg-primary/70 border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-accent-yellow/10 border-b border-border-subtle flex items-center justify-between text-xs font-extrabold text-accent-yellow">
            <span className="flex items-center gap-1.5">
              <Crown size={13} />
              <span>Antrian VIP</span>
            </span>
            <span className="text-[10px] text-text-dim font-mono">{vipQueue.length}</span>
          </div>

          <div className="divide-y divide-border-subtle">
            {vipQueue.length === 0 ? (
              <div className="p-3 text-center text-xs text-text-dim">
                Tidak ada antrian VIP.
              </div>
            ) : (
              vipQueue.map((item, index) => renderQueueRow(item, index, true))
            )}
          </div>
        </div>

        {/* Basic Queue Group */}
        <div className="mb-3 bg-bg-primary/70 border border-border-subtle rounded-xl overflow-hidden">
          <div className="px-3 py-2 bg-accent-cyan/10 border-b border-border-subtle flex items-center justify-between text-xs font-extrabold text-accent-cyan">
            <span className="flex items-center gap-1.5">
              <Gamepad2 size={13} />
              <span>Antrian Basic</span>
            </span>
            <span className="text-[10px] text-text-dim font-mono">{basicQueue.length}</span>
          </div>

          <div className="divide-y divide-border-subtle">
            {basicQueue.length === 0 ? (
              <div className="p-3 text-center text-xs text-text-dim">
                Tidak ada antrian Basic.
              </div>
            ) : (
              basicQueue.map((item, index) => renderQueueRow(item, index, false))
            )}
          </div>
        </div>

        {/* Clear All Queue (Admin Only) */}
        {isAdmin && queue.length > 0 && (
          <button
            type="button"
            onClick={onRequestClearQueue}
            className="w-full py-2 rounded-xl text-xs font-bold text-accent-red/80 hover:text-accent-red hover:bg-accent-red/10 border border-transparent hover:border-accent-red/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <Trash2 size={13} />
            <span>Kosongkan Antrian</span>
          </button>
        )}
      </div>
    </aside>
  );

  function renderQueueRow(item, index, isVIP) {
    const isEditing = editingId === item.id;

    if (isEditing) {
      return (
        <div key={item.id} className="p-2.5 space-y-2 bg-accent-purple/5">
          <input
            type="text"
            value={editUsername}
            onChange={(e) => setEditUsername(e.target.value)}
            placeholder="Username Roblox"
            className="w-full bg-bg-surface border border-border-default rounded py-1 px-2 text-xs text-text-primary"
          />
          <input
            type="text"
            value={editTiktok}
            onChange={(e) => setEditTiktok(e.target.value)}
            placeholder="Akun TikTok"
            className="w-full bg-bg-surface border border-border-default rounded py-1 px-2 text-xs text-text-primary"
          />
          <div className="flex gap-1.5">
            <select
              value={editService}
              onChange={(e) => setEditService(e.target.value)}
              className="bg-bg-surface border border-border-default rounded py-1 px-1.5 text-xs text-text-primary"
            >
              <option value="VIP">VIP</option>
              <option value="Basic">Basic</option>
            </select>
            <input
              type="number"
              min="0.01"
              step="0.25"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              className="w-20 bg-bg-surface border border-border-default rounded py-1 px-1.5 text-xs text-text-primary"
            />
            <button
              onClick={() => saveEdit(item.id)}
              className="p-1 rounded bg-accent-green text-white"
            >
              <Check size={14} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1 rounded bg-text-dim text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.id}
        onClick={() => isAdmin && onStartFromQueue(item)}
        className={`p-2.5 flex items-center justify-between gap-2 transition-all ${
          isAdmin ? 'hover:bg-white/[0.04] cursor-pointer group' : ''
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-5 h-5 rounded-full bg-bg-surface border border-border-default text-text-tertiary text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="font-extrabold text-xs text-text-primary truncate">
              {item.username}
            </div>
            <div className="text-[11px] text-text-dim flex items-center gap-1 truncate">
              {item.tiktokName && <span className="text-accent-cyan">@{item.tiktokName} ·</span>}
              <span className="font-mono">{formatDuration(item.duration)}</span>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onStartFromQueue(item)}
              title="Mulai Billing"
              className="p-1 rounded-lg bg-accent-green/15 text-accent-green hover:bg-accent-green/30 transition-colors"
            >
              <Play size={12} />
            </button>
            <button
              onClick={() => startEdit(item)}
              title="Edit"
              className="p-1 rounded-lg text-text-dim hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => handleDeleteItem(item)}
              title="Hapus"
              className="p-1 rounded-lg text-text-dim hover:text-accent-red hover:bg-accent-red/10 transition-colors"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }
};

export default QueueSidebar;
