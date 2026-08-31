import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { auth, db } from '../../../../config/firebaseConfig';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Settings, 
  X, 
  Gamepad2, 
  Check, 
  Clock, 
  Gem,
  Crown,
  User,
  DollarSign,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { updateJokiSettings } from '../../services/jokiFirebase';

const JokiSettingsModal = ({ isOpen, onClose }) => {
  const { activeWorkspace, activeWorkspaceId, globalSettings, services, addToast } = useJoki();

  // Tab State
  const [activeTab, setActiveTab] = useState('SCHEDULE'); // 'SCHEDULE' | 'SERVICES' | 'PROFILE'

  // Schedule & Stream States
  const [streamerName, setStreamerName] = useState(activeWorkspace?.name || '');
  const [liveStartTime, setLiveStartTime] = useState(globalSettings?.liveStartTime || '09:00');
  const [liveEndTime, setLiveEndTime] = useState(globalSettings?.liveEndTime || '15:00');
  const [manualOverride, setManualOverride] = useState(globalSettings?.manualOverride || false);
  const [streamStatus, setStreamStatus] = useState(globalSettings?.streamStatus || 'OFFLINE');
  const [nextStreamSchedule, setNextStreamSchedule] = useState(globalSettings?.nextStreamSchedule || '');

  // Editable Services List State
  const [editableServices, setEditableServices] = useState([
    { id: 'basic', name: 'Basic', tier: 'Basic', price: 4000, slots: [1, 2, 3, 4], enabled: true },
    { id: 'vip', name: 'VIP Priority', tier: 'VIP', price: 6000, slots: [5], enabled: true },
    { id: 'vvip', name: 'VVIP Super', tier: 'VVIP', price: 10000, slots: [6], enabled: true }
  ]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingStream, setLoadingStream] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      setLiveStartTime(globalSettings.liveStartTime || '09:00');
      setLiveEndTime(globalSettings.liveEndTime || '15:00');
      setManualOverride(globalSettings.manualOverride || false);
      setStreamStatus(globalSettings.streamStatus || 'OFFLINE');
      setNextStreamSchedule(globalSettings.nextStreamSchedule || '');
    }
  }, [globalSettings]);

  useEffect(() => {
    if (services && services.length > 0) {
      setEditableServices(JSON.parse(JSON.stringify(services)));
    }
  }, [services, isOpen]);

  if (!isOpen) return null;

  const handleUpdateScheduleAndStatus = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoadingStream(true);
      await updateJokiSettings(activeWorkspaceId, {
        liveStartTime: liveStartTime.trim(),
        liveEndTime: liveEndTime.trim(),
        manualOverride,
        streamStatus,
        nextStreamSchedule: nextStreamSchedule.trim(),
        updatedAt: Date.now()
      });
      addToast('Jadwal jam live & status siaran otomatis berhasil diperbarui!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengupdate jadwal siaran.', 'error');
    } finally {
      setLoadingStream(false);
    }
  };

  const handleServiceChange = (serviceId, field, value) => {
    setEditableServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const toggleSlotForService = (serviceId, slotNum) => {
    setEditableServices(prev => prev.map(s => {
      const currentSlots = s.slots || [];
      if (s.id === serviceId) {
        if (currentSlots.includes(slotNum)) {
          return { ...s, slots: currentSlots.filter(x => x !== slotNum) };
        } else {
          return { ...s, slots: [...currentSlots, slotNum].sort((a, b) => a - b) };
        }
      } else {
        // Remove from other service so each slot belongs to one service cleanly
        return { ...s, slots: currentSlots.filter(x => x !== slotNum) };
      }
    }));
  };

  const applySlotPreset = (presetType) => {
    if (presetType === '6_DEFAULT') {
      setEditableServices(prev => [
        { ...prev[0], slots: [1, 2, 3, 4], enabled: true },
        { ...prev[1], slots: [5], enabled: true },
        { ...prev[2], slots: [6], enabled: true }
      ]);
    } else if (presetType === '6_SPLIT') {
      setEditableServices(prev => [
        { ...prev[0], slots: [1, 2, 3], enabled: true },
        { ...prev[1], slots: [4, 5], enabled: true },
        { ...prev[2], slots: [6], enabled: true }
      ]);
    } else if (presetType === '4_SLOT') {
      setEditableServices(prev => [
        { ...prev[0], slots: [1, 2], enabled: true },
        { ...prev[1], slots: [3], enabled: true },
        { ...prev[2], slots: [4], enabled: true }
      ]);
    } else if (presetType === '8_MEGA') {
      setEditableServices(prev => [
        { ...prev[0], slots: [1, 2, 3, 4, 5], enabled: true },
        { ...prev[1], slots: [6, 7], enabled: true },
        { ...prev[2], slots: [8], enabled: true }
      ]);
    }
    addToast('Preset slot berhasil diterapkan!', 'info');
  };

  const handleUpdatePricingSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoadingPricing(true);
      const basicSrv = editableServices.find(s => s.tier === 'Basic') || editableServices[0];
      const vipSrv = editableServices.find(s => s.tier === 'VIP') || editableServices[1];
      const vvipSrv = editableServices.find(s => s.tier === 'VVIP') || editableServices[2];

      await updateJokiSettings(activeWorkspaceId, {
        services: editableServices,
        priceBasic: Math.max(500, Number(basicSrv?.price) || 4000),
        priceVip: Math.max(500, Number(vipSrv?.price) || 6000),
        enableVvipSlot: Boolean(vvipSrv?.enabled),
        priceVvip: Math.max(1000, Number(vvipSrv?.price) || 10000),
        updatedAt: Date.now()
      });
      addToast('✓ Pengaturan layanan, tarif, dan alokasi slot berhasil disimpan!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah pengaturan layanan.', 'error');
    } finally {
      setLoadingPricing(false);
    }
  };

  const handleUpdateName = async (e) => {
    if (e) e.preventDefault();
    if (!streamerName.trim()) {
      addToast('Nama streamer tidak boleh kosong.', 'error');
      return;
    }

    try {
      setLoadingName(true);
      await updateDoc(doc(db, 'joki_workspaces', activeWorkspaceId), {
        name: streamerName.trim()
      });
      addToast('Nama streamer berhasil diperbarui!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah nama streamer.', 'error');
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('Password baru minimal harus 6 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    try {
      setLoadingPass(true);
      const user = auth.currentUser;
      if (!user) {
        addToast('Sesi login telah berakhir. Silakan login ulang.', 'error');
        return;
      }
      await updatePassword(user, newPassword);
      addToast('Password admin berhasil diubah!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah password. Pastikan login belum terlalu lama.', 'error');
    } finally {
      setLoadingPass(false);
    }
  };

  // Preset announcements
  const announcementPresets = [
    '😴 Off Stream, Lanjut Besok Siang Jam 14:00 WIB',
    '☕ Istirahat 30 Menit, Joki Segera Dilanjutkan',
    '🍔 Makan Siang Sebentar, Standby ya!',
    '⚡ Joki Ngebut Gas Terus Sampai Malam!'
  ];

  // Calculate total configured slots across enabled services
  const allActiveSlots = Array.from(new Set(
    editableServices.filter(s => s.enabled).flatMap(s => s.slots || [])
  )).sort((a, b) => a - b);

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
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Pengaturan Streamer
            </h3>
            <p className="text-xs text-text-muted mt-0.5 m-0">
              Workspace: <strong className="text-accent-cyan">{activeWorkspace?.name || activeWorkspaceId}</strong>
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-bg-surface border border-border-default rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('SCHEDULE')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SCHEDULE'
                ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/25'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <Clock size={14} />
            <span>Jadwal & Live</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SERVICES')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'SERVICES'
                ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/25'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <DollarSign size={14} />
            <span>Layanan & Tarif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'PROFILE'
                ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/25'
                : 'text-text-secondary hover:text-white'
            }`}
          >
            <User size={14} />
            <span>Profil & Akun</span>
          </button>
        </div>

        {/* 1. TAB SCHEDULE */}
        {activeTab === 'SCHEDULE' && (
          <form onSubmit={handleUpdateScheduleAndStatus} className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Clock size={14} className="text-accent-cyan" />
                <span>Jam Rutin Live Streaming Harian (WIB)</span>
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold block mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={liveStartTime}
                    onChange={(e) => setLiveStartTime(e.target.value)}
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono font-bold outline-none focus:border-accent-purple/50"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-text-dim uppercase font-bold block mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={liveEndTime}
                    onChange={(e) => setLiveEndTime(e.target.value)}
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono font-bold outline-none focus:border-accent-purple/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <span>Pengumuman Jadwal Live Stream</span>
              </span>

              <input
                type="text"
                placeholder="Contoh: Lanjut besok siang jam 14.00 WIB ya!"
                value={nextStreamSchedule}
                onChange={(e) => setNextStreamSchedule(e.target.value)}
                className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-medium outline-none focus:border-accent-purple/50"
              />

              <div className="pt-1">
                <span className="text-[10px] text-text-dim font-bold block mb-1.5">Preset 1-Klik Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {announcementPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNextStreamSchedule(preset)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-accent-purple/20 text-text-secondary hover:text-white border border-white/10 transition-colors cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingStream}
              className="w-full py-2.5 rounded-xl bg-accent-purple hover:bg-accent-purple-light text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-accent-purple/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>{loadingStream ? 'Menyimpan...' : 'Simpan Jadwal & Status'}</span>
            </button>
          </form>
        )}

        {/* 2. TAB SERVICES & TARIFFS & SLOTS */}
        {activeTab === 'SERVICES' && (
          <form onSubmit={handleUpdatePricingSettings} className="space-y-4 overflow-y-auto pr-1">
            {/* Quick Slot Presets Bar */}
            <div className="p-3 bg-white/[0.02] border border-white/10 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-cyan-400" />
                  <span>Preset Alokasi Slot 1-Klik:</span>
                </span>
                <span className="text-[11px] font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  Total {allActiveSlots.length} Slot Buka
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: '6_DEFAULT', label: '6 Slot (4 Basic + 1 VIP + 1 VVIP)' },
                  { id: '6_SPLIT', label: '6 Slot (3 Basic + 2 VIP + 1 VVIP)' },
                  { id: '4_SLOT', label: '4 Slot (2 Basic + 1 VIP + 1 VVIP)' },
                  { id: '8_MEGA', label: '8 Slot (5 Basic + 2 VIP + 1 VVIP)' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applySlotPreset(p.id)}
                    className="p-1.5 rounded-xl bg-black/40 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-slate-300 hover:text-white transition-colors cursor-pointer text-center leading-tight truncate"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Services Editor Cards */}
            <div className="space-y-3">
              {editableServices.map((srv) => {
                const isBasic = srv.tier === 'Basic';
                const isVip = srv.tier === 'VIP';
                const isVvip = srv.tier === 'VVIP';

                const badgeTheme = isVvip 
                  ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                  : isVip
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                  : 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300';

                return (
                  <div 
                    key={srv.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      !srv.enabled 
                        ? 'bg-black/30 border-white/5 opacity-60'
                        : isVvip 
                        ? 'bg-gradient-to-b from-rose-500/[0.06] to-bg-surface/90 border-rose-500/30'
                        : isVip
                        ? 'bg-gradient-to-b from-amber-500/[0.06] to-bg-surface/90 border-amber-500/30'
                        : 'bg-bg-surface/80 border-border-default'
                    }`}
                  >
                    {/* Header Row: Tier Badge + Service Name Input + Enabled Toggle */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${badgeTheme}`}>
                          {isVvip ? <Gem size={14} /> : isVip ? <Crown size={14} /> : <Gamepad2 size={14} />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold text-text-dim uppercase block">
                            Nama Layanan ({srv.tier})
                          </label>
                          <input
                            type="text"
                            value={srv.name}
                            onChange={(e) => handleServiceChange(srv.id, 'name', e.target.value)}
                            placeholder={`Nama Layanan ${srv.tier}...`}
                            className="w-full bg-[#151821] border border-border-default rounded-lg py-1 px-2 text-xs text-white font-bold outline-none focus:border-accent-purple/50"
                          />
                        </div>
                      </div>

                      {/* Enable/Disable toggle for VIP/VVIP */}
                      {!isBasic && (
                        <div className="shrink-0 text-right">
                          <button
                            type="button"
                            onClick={() => handleServiceChange(srv.id, 'enabled', !srv.enabled)}
                            className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              srv.enabled 
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                                : 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            {srv.enabled ? '🟢 AKTIF' : '⚪ NONAKTIF'}
                          </button>
                        </div>
                      )}
                    </div>

                    {srv.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 border-t border-white/5">
                        {/* Left: Price Input (5 cols) */}
                        <div className="md:col-span-5">
                          <label className="text-[10px] font-bold text-text-dim uppercase block mb-1">
                            Tarif Joki (Rp / Jam)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-text-dim">Rp</span>
                            <input
                              type="number"
                              step="500"
                              min="500"
                              value={srv.price}
                              onChange={(e) => handleServiceChange(srv.id, 'price', e.target.value)}
                              className="w-full bg-[#151821] border border-border-default rounded-xl py-1.5 pl-8 pr-2 text-xs text-white font-mono font-black outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        {/* Right: Slot Allocation Pills (7 cols) */}
                        <div className="md:col-span-7">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-text-dim uppercase block">
                              Alokasi Slot Billing (Klik untuk pilih)
                            </label>
                            <span className="text-[10px] font-mono text-cyan-300 font-bold">
                              {(srv.slots || []).length} Slot
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(slotNum => {
                              const isSelected = (srv.slots || []).includes(slotNum);
                              return (
                                <button
                                  key={slotNum}
                                  type="button"
                                  onClick={() => toggleSlotForService(srv.id, slotNum)}
                                  className={`w-7 h-7 rounded-lg text-xs font-mono font-black transition-all cursor-pointer border ${
                                    isSelected
                                      ? isVvip
                                        ? 'bg-rose-600 text-white border-rose-400 shadow-sm shadow-rose-600/30'
                                        : isVip
                                        ? 'bg-amber-400 text-black border-amber-300 shadow-sm shadow-amber-400/30'
                                        : 'bg-cyan-500 text-black border-cyan-300 shadow-sm shadow-cyan-500/30'
                                      : 'bg-black/40 text-slate-500 border-white/10 hover:text-white'
                                  }`}
                                >
                                  {slotNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={loadingPricing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-purple-light hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-accent-purple/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>{loadingPricing ? 'Menyimpan...' : 'Simpan Semua Pengaturan Layanan & Slot'}</span>
            </button>
          </form>
        )}

        {/* 3. TAB PROFILE & ACCOUNT */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-4 overflow-y-auto pr-1">
            <form onSubmit={handleUpdateName} className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Gamepad2 size={14} className="text-accent-cyan" />
                <span>Nama Streamer / Brand Live</span>
              </span>

              <input
                type="text"
                value={streamerName}
                onChange={(e) => setStreamerName(e.target.value)}
                placeholder="Nama Streamer..."
                className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-bold outline-none focus:border-accent-purple/50"
              />

              <button
                type="submit"
                disabled={loadingName}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-black text-xs transition-all cursor-pointer"
              >
                {loadingName ? 'Menyimpan...' : 'Simpan Nama Streamer'}
              </button>
            </form>

            <form onSubmit={handleUpdatePassword} className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-accent-yellow" />
                <span>Ganti Password Admin</span>
              </span>

              <div className="space-y-2">
                <input
                  type="password"
                  placeholder="Password Baru..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono outline-none focus:border-accent-purple/50"
                />
                <input
                  type="password"
                  placeholder="Konfirmasi Password Baru..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono outline-none focus:border-accent-purple/50"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full py-2 rounded-xl bg-accent-purple hover:bg-accent-purple-light text-white font-black text-xs transition-all cursor-pointer"
              >
                {loadingPass ? 'Mengubah...' : 'Ubah Password Admin'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default JokiSettingsModal;
