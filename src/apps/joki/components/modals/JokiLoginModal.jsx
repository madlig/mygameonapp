import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { useJoki } from '../../contexts/JokiContext';
import { verifyJokiAdminStatus } from '../../services/jokiFirebase';
import { Lock, Mail, Key, X, Loader2 } from 'lucide-react';

const JokiLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { login, loginWithGoogle, logout } = useAuth();
  const { workspaces } = useJoki();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const cred = await loginWithGoogle();
      const userEmail = cred?.user?.email?.toLowerCase()?.trim();

      const isAllowed = await verifyJokiAdminStatus(userEmail, workspaces);
      if (!isAllowed) {
        await logout();
        setErrorMsg(`Akses ditolak: Akun Google (${userEmail || 'Anda'}) tidak terdaftar sebagai Admin Joki.`);
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Google login error in Joki:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('Domain joki ini belum didaftarkan di Authorized Domains Firebase Console.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err.message || 'Gagal login dengan Akun Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const cred = await login(email.trim(), password);
      const userEmail = cred?.user?.email?.toLowerCase()?.trim() || email.trim().toLowerCase();

      const isAllowed = await verifyJokiAdminStatus(userEmail, workspaces);
      if (!isAllowed) {
        await logout();
        setErrorMsg(`Akses ditolak: Akun (${userEmail}) tidak memiliki izin Admin Joki.`);
        return;
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setErrorMsg(
        err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password'
          ? 'Email atau password salah.'
          : err.message || 'Gagal login sebagai admin.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div 
        className="w-full max-w-sm bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative"
        style={{ background: '#111317' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary transition-colors p-1"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/25 flex items-center justify-center text-accent-purple shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight">
              Login Admin Joki
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Masuk untuk akses kontrol penuh & omset
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-accent-red/10 border border-accent-red/25 text-accent-red text-xs leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* Tombol Login dengan Akun Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white text-gray-900 font-bold text-xs rounded-xl hover:bg-gray-100 active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 mb-3.5 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Masuk dengan Akun Google</span>
        </button>

        <div className="relative flex items-center justify-center my-3.5">
          <div className="border-t border-border-default/60 w-full"></div>
          <span className="bg-[#111317] px-2.5 text-[10px] text-text-faint uppercase font-bold tracking-wider shrink-0">
            atau dengan email
          </span>
          <div className="border-t border-border-default/60 w-full"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mygameon.store"
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-tertiary mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-primary border border-border-default rounded-xl py-2.5 pl-10 pr-3.5 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-text-tertiary hover:text-text-primary hover:bg-white/5 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-purple hover:bg-accent-purple-light transition-all shadow-lg shadow-accent-purple/20 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JokiLoginModal;
