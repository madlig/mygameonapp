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
  Sparkles,
  Gem
} from 'lucide-react';
import { updateJokiSettings } from '../../services/jokiFirebase';

const JokiSettingsModal = ({ isOpen, onClose }) => {
  const { activeWorkspace, activeWorkspaceId, globalSettings, addToast } = useJoki();

  const [streamerName, setStreamerName] = useState(activeWorkspace?.name || '');
  const [liveStartTime, setLiveStartTime] = useState(globalSettings?.liveStartTime || '09:00');
  const [liveEndTime, setLiveEndTime] = useState(globalSettings?.liveEndTime || '15:00');
  const [manualOverride, setManualOverride] = useState(globalSettings?.manualOverride || false);
  const [streamStatus, setStreamStatus] = useState(globalSettings?.streamStatus || 'OFFLINE');
  const [nextStreamSchedule, setNextStreamSchedule] = useState(globalSettings?.nextStreamSchedule || '');

  // VVIP Settings State
  const [enableVvip, setEnableVvip] = useState(
    globalSettings?.enableVvipSlot !== undefined
      ? Boolean(globalSettings.enableVvipSlot)
      : (activeWorkspaceId === 'saviours')
  );
  const [vvipPrice, setVvipPrice] = useState(globalSettings?.priceVvip || 10000);
  const [loadingVvip, setLoadingVvip] = useState(false);
  
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

  const handleUpdateVvipSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoadingVvip(true);
      await updateJokiSettings(activeWorkspaceId, {
        enableVvipSlot: enableVvip,
        priceVvip: Math.max(1000, Number(vvipPrice) || 10000),
        updatedAt: Date.now()
      });
      addToast(
        enableVvip 
          ? '✓ Fitur & Slot VVIP berhasil diaktifkan!' 
          : '✓ Fitur VVIP dinonaktifkan (Dashboard kembali 2-Tier standard).', 
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah pengaturan VVIP.', 'error');
    } finally {
      setLoadingVvip(false);
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
      if (err.code === 'auth/requires-recent-login') {
        addToast('Demi keamanan, silakan logout dan login ulang sebelum mengubah password.', 'warning');
      } else {
        addToast(`Gagal mengubah password: ${err.message || 'Error'}`, 'error');
      }
    } finally {
      setLoadingPass(false);
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
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary m-0 tracking-tight">
              Pengaturan Streamer & Jadwal Live
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Kanal: <strong className="text-accent-cyan font-mono">{activeWorkspace.name}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* SECTION 1: ATUR JAM LIVE & OFFSTREAM SEMI-OTOMATIS */}
          <div className="bg-bg-primary/90 border border-border-default rounded-2xl p-4 shadow-inner space-y-3">
            <div className="text-xs font-black uppercase text-accent-cyan tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock size={14} className="text-accent-cyan" />
                <span>Atur Jam Live & Off Stream (Semi-Otomatis)</span>
              </span>
              <span className="text-[10px] text-text-dim font-bold font-mono">WIB</span>
            </div>

            <p className="text-[11.5px] text-text-muted m-0 leading-relaxed">
              Status siaran akan <strong>otomatis berubah menjadi LIVE</strong> saat jam mulai tercapai, dan <strong>otomatis OFF STREAM</strong> saat melewati jam selesai.
            </p>

            <form onSubmit={handleUpdateScheduleAndStatus} className="space-y-3 pt-1">
              {/* Jam Mulai & Jam Selesai Time Pickers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                    🟢 Jam Mulai Live:
                  </label>
                  <input
                    type="time"
                    required
                    value={liveStartTime}
                    onChange={(e) => {
                      setLiveStartTime(e.target.value);
                      setManualOverride(false);
                    }}
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono font-bold outline-none focus:border-accent-green/50"
                  />
                </div>

                <div>
                  <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                    😴 Jam Selesai (Off Stream):
                  </label>
                  <input
                    type="time"
                    required
                    value={liveEndTime}
                    onChange={(e) => {
                      setLiveEndTime(e.target.value);
                      setManualOverride(false);
                    }}
                    className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-white font-mono font-bold outline-none focus:border-accent-purple/50"
                  />
                </div>
              </div>

              {/* Mode Kontrol / Manual Override */}
              <div className="pt-2 border-t border-border-subtle">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10.5px] font-bold text-text-dim">
                    Mode Status Saat Ini:
                  </span>
                  <span className="text-[10px] font-mono text-accent-cyan font-bold">
                    {manualOverride ? 'Manual Override' : '⚡ Otomatis Mengikuti Jam'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualOverride(true);
                      setStreamStatus('LIVE');
                    }}
                    className={`p-2 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      manualOverride && streamStatus === 'LIVE'
                        ? 'bg-accent-red/20 text-accent-red border-accent-red/50 shadow-sm'
                        : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                    }`}
                  >
                    <span>🔴 Live Sekarang</span>
                    <span className="text-[9px] text-text-dim font-normal">Sedang Live</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualOverride(false);
                    }}
                    className={`p-2 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      !manualOverride
                        ? 'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/50 shadow-sm'
                        : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                    }`}
                  >
                    <span>⚡ Otomatis</span>
                    <span className="text-[9px] text-text-dim font-normal">Sesuai Jam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualOverride(true);
                      setStreamStatus('BREAK');
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      manualOverride && streamStatus === 'BREAK'
                        ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/50 shadow-sm'
                        : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                    }`}
                  >
                    <span>☕ Break</span>
                    <span className="text-[9px] text-text-dim font-normal">Istirahat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManualOverride(true);
                      setStreamStatus('OFFLINE');
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
                      manualOverride && streamStatus === 'OFFLINE'
                        ? 'bg-accent-purple/20 text-accent-purple-light border-accent-purple/50 shadow-sm'
                        : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                    }`}
                  >
                    <span>😴 Off Stream</span>
                    <span className="text-[9px] text-text-dim font-normal">Selesai Live</span>
                  </button>
                </div>
              </div>

              {/* Catatan / Pengumuman untuk Banner & Tiket */}
              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1 flex items-center justify-between">
                  <span>📢 Teks Pengumuman Banner & Tiket:</span>
                  <span className="text-[9.5px] text-accent-cyan font-bold">Muncul di Banner Dashboard & Tiket</span>
                </label>
                <input
                  type="text"
                  value={nextStreamSchedule}
                  onChange={(e) => setNextStreamSchedule(e.target.value)}
                  placeholder="Contoh: Joki dilanjut besok siang jam 14.00 WIB guys!"
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loadingStream}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-bg-primary bg-accent-cyan hover:bg-accent-cyan/90 active:scale-95 transition-all cursor-pointer shadow-md shadow-accent-cyan/20 disabled:opacity-50 mt-2"
              >
                <Check size={14} />
                <span>{loadingStream ? 'Menyimpan...' : 'Simpan Jadwal Jam Live'}</span>
              </button>
            </form>
          </div>

          {/* SECTION 2: PENGATURAN FITUR & SLOT VVIP */}
          <div className="bg-bg-primary/90 border border-rose-500/30 rounded-2xl p-4 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                <Gem size={14} />
                <span>Fitur & Slot VVIP (Super Priority)</span>
              </div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                enableVvip
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-white/5 text-text-dim border-border-default'
              }`}>
                {enableVvip ? '🟢 AKTIF' : '⚪ NONAKTIF'}
              </span>
            </div>

            <p className="text-[11px] text-text-dim m-0 leading-relaxed">
              Aktifkan jika streamer menyediakan layanan slot VVIP khusus (Super Priority). Jika dinonaktifkan, antrean dan opsi VVIP akan disembunyikan agar viewer tidak rancu.
            </p>

            <form onSubmit={handleUpdateVvipSettings} className="space-y-3 pt-1">
              {/* Toggle Button */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEnableVvip(true)}
                  className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    enableVvip
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 ring-1 ring-rose-500/40 shadow-sm'
                      : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                  }`}
                >
                  <Gem size={13} className={enableVvip ? 'text-rose-400' : 'text-text-dim'} />
                  <span>Aktifkan VVIP</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEnableVvip(false)}
                  className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !enableVvip
                      ? 'bg-white/10 text-white border-border-default ring-1 ring-white/20 shadow-sm'
                      : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                  }`}
                >
                  <span>Nonaktifkan</span>
                </button>
              </div>

              {/* Input Tarif VVIP */}
              {enableVvip && (
                <div className="animate-slide-in">
                  <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                    Tarif Layanan VVIP / Jam (Rp)
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={vvipPrice}
                    onChange={(e) => setVvipPrice(e.target.value)}
                    className="w-full bg-bg-surface border border-rose-500/30 rounded-xl py-2 px-3 text-xs text-rose-300 font-mono font-bold outline-none focus:border-rose-500 shadow-inner"
                    placeholder="10000"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loadingVvip}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                <Check size={14} />
                <span>{loadingVvip ? 'Menyimpan...' : 'Simpan Pengaturan VVIP'}</span>
              </button>
            </form>
          </div>

          {/* SECTION 3: UBAH NAMA STREAMER */}
          <div className="bg-bg-primary/90 border border-border-default rounded-2xl p-4 shadow-inner space-y-3">
            <div className="text-xs font-black uppercase text-accent-purple-light tracking-wider flex items-center gap-1.5">
              <Gamepad2 size={14} />
              <span>Nama Streamer / Brand Live</span>
            </div>
            <form onSubmit={handleUpdateName} className="space-y-3">
              <div>
                <input
                  type="text"
                  required
                  value={streamerName}
                  onChange={(e) => setStreamerName(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50 font-bold"
                  placeholder="Contoh: Kadal Gaming"
                />
              </div>
              <button
                type="submit"
                disabled={loadingName}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-accent-purple/20"
              >
                <Check size={14} />
                <span>{loadingName ? 'Menyimpan...' : 'Simpan Nama Streamer'}</span>
              </button>
            </form>
          </div>

          {/* SECTION 3: UBAH PASSWORD LOGIN */}
          <div className="bg-bg-primary/90 border border-border-default rounded-2xl p-4 shadow-inner space-y-3">
            <div className="text-xs font-black uppercase text-accent-yellow tracking-wider flex items-center gap-1.5">
              <Lock size={14} />
              <span>Ubah Password Akun Admin</span>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-2.5">
              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                  Password Baru (Min 6 Karakter)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-yellow/50 font-mono"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1">
                  Ulangi Password Baru
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-yellow/50 font-mono"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPass || !newPassword}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-accent-yellow/20 mt-1"
              >
                <Check size={14} />
                <span>{loadingPass ? 'Menyimpan...' : 'Ganti Password'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JokiSettingsModal;
