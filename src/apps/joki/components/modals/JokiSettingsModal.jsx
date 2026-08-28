import React, { useState, useEffect } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { auth, db } from '../../../../config/firebaseConfig';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { 
  Settings, 
  X, 
  Lock, 
  Gamepad2, 
  Check, 
  Radio, 
  Coffee, 
  Moon, 
  Clock, 
  Gem,
  Crown,
  User,
  DollarSign
} from 'lucide-react';
import { updateJokiSettings } from '../../services/jokiFirebase';

const JokiSettingsModal = ({ isOpen, onClose }) => {
  const { activeWorkspace, activeWorkspaceId, globalSettings, addToast } = useJoki();

  // Tab State
  const [activeTab, setActiveTab] = useState('SCHEDULE'); // 'SCHEDULE' | 'SERVICES' | 'PROFILE'

  // Schedule & Stream States
  const [streamerName, setStreamerName] = useState(activeWorkspace?.name || '');
  const [liveStartTime, setLiveStartTime] = useState(globalSettings?.liveStartTime || '09:00');
  const [liveEndTime, setLiveEndTime] = useState(globalSettings?.liveEndTime || '15:00');
  const [manualOverride, setManualOverride] = useState(globalSettings?.manualOverride || false);
  const [streamStatus, setStreamStatus] = useState(globalSettings?.streamStatus || 'OFFLINE');
  const [nextStreamSchedule, setNextStreamSchedule] = useState(globalSettings?.nextStreamSchedule || '');

  // Pricing & VVIP Settings State
  const [basicPrice, setBasicPrice] = useState(globalSettings?.priceBasic || 4000);
  const [vipPrice, setVipPrice] = useState(globalSettings?.priceVip || 6000);
  const [enableVvip, setEnableVvip] = useState(
    globalSettings?.enableVvipSlot !== undefined
      ? Boolean(globalSettings.enableVvipSlot)
      : (activeWorkspaceId === 'saviours')
  );
  const [vvipPrice, setVvipPrice] = useState(globalSettings?.priceVvip || 10000);
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
      if (globalSettings.priceBasic !== undefined) {
        setBasicPrice(globalSettings.priceBasic);
      }
      if (globalSettings.priceVip !== undefined) {
        setVipPrice(globalSettings.priceVip);
      }
      if (globalSettings.enableVvipSlot !== undefined) {
        setEnableVvip(Boolean(globalSettings.enableVvipSlot));
      }
      if (globalSettings.priceVvip !== undefined) {
        setVvipPrice(globalSettings.priceVvip);
      }
    }
  }, [globalSettings]);

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

  const handleUpdatePricingSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoadingPricing(true);
      await updateJokiSettings(activeWorkspaceId, {
        priceBasic: Math.max(500, Number(basicPrice) || 4000),
        priceVip: Math.max(500, Number(vipPrice) || 6000),
        enableVvipSlot: enableVvip,
        priceVvip: Math.max(1000, Number(vvipPrice) || 10000),
        updatedAt: Date.now()
      });
      addToast('✓ Pengaturan tarif layanan (Basic, VIP, VVIP) berhasil disimpan!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah pengaturan tarif layanan.', 'error');
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease]">
      <div 
        className="w-full max-w-xl bg-[#111318] border border-border-default rounded-3xl p-6 shadow-2xl animate-slide-in relative max-h-[90vh] flex flex-col"
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

        {/* Tab Navigation (Zero-Scroll Design) */}
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

        {activeTab === 'SCHEDULE' && (
          <form onSubmit={handleUpdateScheduleAndStatus} className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-accent-cyan" />
                  <span>Jam Live Harian Otomatis</span>
                </span>
                <span className="text-[10.5px] text-accent-cyan font-bold font-mono">WIB (Waktu Indonesia Barat)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-black text-text-dim mb-1">Jam Mulai Live</label>
                  <input
                    type="time"
                    value={liveStartTime}
                    onChange={(e) => setLiveStartTime(e.target.value)}
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono font-black outline-none focus:border-accent-cyan/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-text-dim mb-1">Jam Selesai Live</label>
                  <input
                    type="time"
                    value={liveEndTime}
                    onChange={(e) => setLiveEndTime(e.target.value)}
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono font-black outline-none focus:border-accent-cyan/50"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Radio size={14} className="text-accent-red" />
                  <span>Status Siaran Saat Ini</span>
                </span>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={manualOverride}
                    onChange={(e) => setManualOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-accent-purple focus:ring-accent-purple/30 bg-bg-surface border-border-default cursor-pointer"
                  />
                  <span className="text-xs font-bold text-text-secondary">Manual Override</span>
                </label>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!manualOverride}
                  onClick={() => setStreamStatus('LIVE')}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border ${
                    streamStatus === 'LIVE'
                      ? 'bg-accent-red/20 text-accent-red border-accent-red/50 shadow-md shadow-accent-red/15'
                      : 'bg-bg-surface text-text-muted border-border-default hover:text-white'
                  } ${!manualOverride ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="w-2 h-2 rounded-full bg-accent-red animate-ping" />
                  <span>LIVE</span>
                </button>

                <button
                  type="button"
                  disabled={!manualOverride}
                  onClick={() => setStreamStatus('BREAK')}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border ${
                    streamStatus === 'BREAK'
                      ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/50 shadow-md shadow-accent-orange/15'
                      : 'bg-bg-surface text-text-muted border-border-default hover:text-white'
                  } ${!manualOverride ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Coffee size={13} />
                  <span>BREAK</span>
                </button>

                <button
                  type="button"
                  disabled={!manualOverride}
                  onClick={() => setStreamStatus('OFFLINE')}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 border ${
                    streamStatus === 'OFFLINE'
                      ? 'bg-white/15 text-white border-white/30'
                      : 'bg-bg-surface text-text-muted border-border-default hover:text-white'
                  } ${!manualOverride ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <Moon size={13} />
                  <span>OFFLINE</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-2.5">
              <label className="block text-[10px] uppercase font-black text-text-dim">
                Pesan Pengumuman Banner Tiket (Opsional)
              </label>
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

        {activeTab === 'SERVICES' && (
          <form onSubmit={handleUpdatePricingSettings} className="space-y-4 overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
                    <Gamepad2 size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white m-0">
                      Tarif Joki Basic (Per Jam)
                    </h4>
                    <p className="text-[10.5px] text-text-muted m-0">
                      Slot antrean reguler standar (Slot 1–6)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-accent-cyan">
                  Rp {Number(basicPrice || 4000).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="relative pt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-text-dim">Rp</span>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={basicPrice}
                  onChange={(e) => setBasicPrice(e.target.value)}
                  placeholder="4000"
                  className="w-full bg-[#151821] border border-border-default rounded-xl py-2 pl-9 pr-3 text-xs text-white font-mono font-black outline-none focus:border-accent-cyan/50"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-accent-yellow/[0.06] to-bg-surface/80 border border-accent-yellow/30 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent-yellow/20 border border-accent-yellow/40 flex items-center justify-center text-accent-yellow">
                    <Crown size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white m-0 flex items-center gap-1.5">
                      <span>Tarif Joki VIP Priority (Per Jam)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-accent-yellow text-black font-black">PRIORITAS</span>
                    </h4>
                    <p className="text-[10.5px] text-text-muted m-0">
                      Slot khusus VIP yang memotong antrean reguler
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono font-black text-accent-yellow">
                  Rp {Number(vipPrice || 6000).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="relative pt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-accent-yellow">Rp</span>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={vipPrice}
                  onChange={(e) => setVipPrice(e.target.value)}
                  placeholder="5000"
                  className="w-full bg-[#151821] border border-accent-yellow/40 rounded-xl py-2 pl-9 pr-3 text-xs text-white font-mono font-black outline-none focus:border-accent-yellow"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-rose-500/[0.08] to-bg-surface/90 border border-rose-500/30 space-y-3 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                    <Gem size={15} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white m-0 flex items-center gap-1.5">
                      <span>Fitur & Slot VVIP (Super Priority)</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-black">TOP TIER</span>
                    </h4>
                    <p className="text-[10.5px] text-text-muted m-0">
                      Slot kasta tertinggi (Prioritas di atas VIP)
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  enableVvip 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' 
                    : 'bg-white/5 text-text-muted border-white/10'
                }`}>
                  {enableVvip ? '🟢 AKTIF' : '⚪ NONAKTIF'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setEnableVvip(true)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    enableVvip
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30'
                      : 'bg-bg-surface text-text-muted border-border-default hover:text-white'
                  }`}
                >
                  <Gem size={12} />
                  <span>Aktifkan VVIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnableVvip(false)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                    !enableVvip
                      ? 'bg-white/20 text-white border-white/40 shadow'
                      : 'bg-bg-surface text-text-muted border-border-default hover:text-white'
                  }`}
                >
                  <span>Nonaktifkan</span>
                </button>
              </div>

              {enableVvip && (
                <div className="pt-2 border-t border-rose-500/20">
                  <label className="block text-[10px] font-black uppercase text-rose-300 mb-1">
                    Tarif Layanan VVIP (Per Jam)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-rose-400">Rp</span>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      value={vvipPrice}
                      onChange={(e) => setVvipPrice(e.target.value)}
                      className="w-full bg-[#151821] border border-rose-500/40 rounded-xl py-2 pl-9 pr-3 text-xs text-white font-mono font-black outline-none focus:border-rose-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loadingPricing}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-purple-light hover:brightness-110 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-accent-purple/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check size={14} />
              <span>{loadingPricing ? 'Menyimpan...' : 'Simpan Semua Pengaturan Tarif'}</span>
            </button>
          </form>
        )}

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
                placeholder="Contoh: Kadal Gaming"
                className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-bold outline-none focus:border-accent-cyan/50"
              />

              <button
                type="submit"
                disabled={loadingName}
                className="w-full py-2 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 text-xs font-black transition-all cursor-pointer"
              >
                {loadingName ? 'Menyimpan...' : 'Simpan Nama Streamer'}
              </button>
            </form>

            {/* Ganti Password Admin */}
            <form onSubmit={handleUpdatePassword} className="p-4 rounded-2xl bg-bg-surface/80 border border-border-default space-y-3">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Lock size={14} className="text-accent-yellow" />
                <span>Ganti Password Login Admin</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-dim mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 6 karakter"
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono outline-none focus:border-accent-yellow/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-text-dim mb-1">Konfirmasi Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full bg-[#151821] border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono outline-none focus:border-accent-yellow/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full py-2 rounded-xl bg-accent-yellow/15 hover:bg-accent-yellow/25 text-accent-yellow border border-accent-yellow/30 text-xs font-black transition-all cursor-pointer"
              >
                {loadingPass ? 'Memproses...' : 'Ubah Password Admin'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default JokiSettingsModal;
