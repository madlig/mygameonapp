import React, { useState } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { Lock, Mail, Key, X, Loader2 } from 'lucide-react';

const JokiLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Email dan kata sandi wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(email.trim(), password);
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
