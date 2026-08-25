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
  Calendar,
  Sparkles 
} from 'lucide-react';
import { updateJokiSettings } from '../../services/jokiFirebase';

const JokiSettingsModal = ({ isOpen, onClose }) => {
  const { activeWorkspace, activeWorkspaceId, globalSettings, addToast } = useJoki();

  const [streamerName, setStreamerName] = useState(activeWorkspace?.name || '');
  const [streamStatus, setStreamStatus] = useState(globalSettings?.streamStatus || 'OFFLINE');
  const [nextStreamSchedule, setNextStreamSchedule] = useState(globalSettings?.nextStreamSchedule || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingStream, setLoadingStream] = useState(false);
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      setStreamStatus(globalSettings.streamStatus || 'OFFLINE');
      setNextStreamSchedule(globalSettings.nextStreamSchedule || '');
    }
  }, [globalSettings]);

  if (!isOpen) return null;

  const handleUpdateStreamStatus = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoadingStream(true);
      await updateJokiSettings(activeWorkspaceId, {
        streamStatus,
        nextStreamSchedule: nextStreamSchedule.trim(),
        updatedAt: Date.now()
      });
      addToast('Status siaran & jadwal live berhasil diupdate ke seluruh tiket!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengupdate status siaran.', 'error');
    } finally {
      setLoadingStream(false);
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
              Pengaturan Streamer & Siaran
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Kanal: <strong className="text-accent-cyan font-mono">{activeWorkspace.name}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* SECTION 1: STATUS SIARAN & JADWAL LIVE STREAM */}
          <div className="bg-bg-primary/90 border border-border-default rounded-2xl p-4 shadow-inner space-y-3">
            <div className="text-xs font-black uppercase text-accent-cyan tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Radio size={14} className="text-accent-red animate-pulse" />
                <span>Status Siaran & Jadwal Tiket</span>
              </span>
              <span className="text-[10px] text-text-dim font-bold">Otomatis Muncul di Tiket</span>
            </div>

            <form onSubmit={handleUpdateStreamStatus} className="space-y-3">
              {/* Radio options for stream status */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStreamStatus('LIVE')}
                  className={`p-2.5 rounded-xl border text-xs font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    streamStatus === 'LIVE'
                      ? 'bg-accent-red/20 text-accent-red border-accent-red/50 shadow-md shadow-accent-red/10'
                      : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-accent-red" />
                  <span>🔴 Live Stream</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStreamStatus('BREAK')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    streamStatus === 'BREAK'
                      ? 'bg-accent-orange/20 text-accent-orange border-accent-orange/50 shadow-md shadow-accent-orange/10'
                      : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                  }`}
                >
                  <Coffee size={14} className="text-accent-orange" />
                  <span>☕ Break/Makan</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStreamStatus('OFFLINE')}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    streamStatus === 'OFFLINE'
                      ? 'bg-accent-purple/20 text-accent-purple-light border-accent-purple/50 shadow-md shadow-accent-purple/10'
                      : 'bg-bg-surface text-text-muted hover:text-white border-border-default'
                  }`}
                >
                  <Moon size={14} className="text-accent-purple-light" />
                  <span>😴 Off Stream</span>
                </button>
              </div>

              {/* Next Stream Schedule Input */}
              <div>
                <label className="block text-[10.5px] font-bold text-text-dim mb-1 flex items-center gap-1">
                  <Calendar size={11} className="text-accent-cyan" />
                  <span>Jadwal Live Berikutnya (Muncul di Tiket saat Off Stream):</span>
                </label>
                <input
                  type="text"
                  value={nextStreamSchedule}
                  onChange={(e) => setNextStreamSchedule(e.target.value)}
                  placeholder="Contoh: Besok Siang, Pukul 14.00 WIB"
                  className="w-full bg-bg-surface border border-border-default rounded-xl py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-cyan/50 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={loadingStream}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-black text-bg-primary bg-accent-cyan hover:bg-accent-cyan/90 active:scale-95 transition-all cursor-pointer shadow-md shadow-accent-cyan/20 disabled:opacity-50"
              >
                <Check size={14} />
                <span>{loadingStream ? 'Menyimpan...' : 'Update Status ke Tiket Penonton'}</span>
              </button>
            </form>
          </div>

          {/* SECTION 2: UBAH NAMA STREAMER */}
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
