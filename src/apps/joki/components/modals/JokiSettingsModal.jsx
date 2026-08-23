import React, { useState } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { auth, db } from '../../../../config/firebaseConfig';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { Settings, X, Lock, Gamepad2, Check, ShieldCheck, Sparkles } from 'lucide-react';

const JokiSettingsModal = ({ isOpen, onClose }) => {
  const { activeWorkspace, activeWorkspaceId, addToast } = useJoki();

  const [penjokiName, setPenjokiName] = useState(activeWorkspace?.name || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingName, setLoadingName] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);

  if (!isOpen) return null;

  const handleUpdateName = async (e) => {
    if (e) e.preventDefault();
    if (!penjokiName.trim()) {
      addToast('Nama penjoki tidak boleh kosong.', 'error');
      return;
    }

    try {
      setLoadingName(true);
      await updateDoc(doc(db, 'joki_workspaces', activeWorkspaceId), {
        name: penjokiName.trim()
      });
      addToast('Nama penjoki berhasil diperbarui!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal mengubah nama penjoki.', 'error');
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative max-h-[90vh] overflow-y-auto"
        style={{ background: '#111317' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors p-1"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
            <Settings size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              Pengaturan Admin Penjoki
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Kanal: <strong className="text-accent-cyan font-mono">{activeWorkspace.name}</strong>
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Section 1: Ubah Nama Penjoki */}
          <div className="bg-bg-primary border border-border-subtle rounded-xl p-4">
            <div className="text-xs font-black uppercase text-accent-purple-light tracking-wider mb-2.5 flex items-center gap-1.5">
              <Gamepad2 size={14} />
              <span>Ubah Nama Penjoki</span>
            </div>
            <form onSubmit={handleUpdateName} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Nama Penjoki / Brand Live
                </label>
                <input
                  type="text"
                  required
                  value={penjokiName}
                  onChange={(e) => setPenjokiName(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50"
                  placeholder="Contoh: Kadal Gaming"
                />
              </div>
              <button
                type="submit"
                disabled={loadingName}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check size={13} />
                <span>{loadingName ? 'Menyimpan...' : 'Simpan Nama'}</span>
              </button>
            </form>
          </div>

          {/* Section 2: Ubah Password Login */}
          <div className="bg-bg-primary border border-border-subtle rounded-xl p-4">
            <div className="text-xs font-black uppercase text-accent-yellow tracking-wider mb-2.5 flex items-center gap-1.5">
              <Lock size={14} />
              <span>Ubah Password Akun</span>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-yellow/50"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Ulangi Password Baru
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-yellow/50"
                  placeholder="Ketik ulang password baru"
                />
              </div>

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-extrabold text-bg-primary bg-accent-yellow hover:bg-accent-yellow-light active:scale-95 transition-all cursor-pointer disabled:opacity-50 mt-1"
              >
                <ShieldCheck size={13} />
                <span>{loadingPass ? 'Memperbarui...' : 'Perbarui Password'}</span>
              </button>
            </form>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border-subtle mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default JokiSettingsModal;
