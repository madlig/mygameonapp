import React, { useState } from 'react';
import { ShieldCheck, Copy, Eye, EyeOff, X, User, Lock, Mail, Check } from 'lucide-react';
import { useJoki } from '../../contexts/JokiContext';

const CredentialModal = ({ customer, onClose }) => {
  const { addToast } = useJoki();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  if (!customer) return null;

  const username = customer.username || customer.name || '-';
  const password = customer.passwordRoblox || '';
  const email = customer.emailRoblox || '';
  const tiktok = customer.tiktokName ? `@${customer.tiktokName}` : '-';

  const handleToggleShowPassword = () => {
    if (!showPassword) {
      setShowPassword(true);
      setTimeout(() => setShowPassword(false), 5000);
    } else {
      setShowPassword(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    if (!text || text === '-') {
      addToast(`Data ${fieldName} belum diisi di brankas.`, 'info');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    addToast(`✓ ${fieldName} berhasil disalin ke clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-[fadeIn_0.15s_ease]">
      <div 
        className="w-full max-w-md bg-bg-surface border border-border-default rounded-3xl p-5 shadow-2xl animate-slide-in relative"
        style={{ background: '#111318' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-dim hover:text-text-primary p-1.5 rounded-xl hover:bg-white/5 cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-accent-green/15 border border-accent-green/30 flex items-center justify-center text-accent-green shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-text-primary m-0 tracking-tight">
              Brankas Login Akun Roblox
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5 m-0">
              Customer: <strong className="text-white">{username}</strong> ({tiktok})
            </p>
          </div>
        </div>

        {/* Vault Items List */}
        <div className="space-y-2.5">
          {/* 1. Username Roblox */}
          <div className="p-3 rounded-2xl bg-bg-primary border border-border-default flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <User size={15} className="text-text-dim shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-text-dim block leading-none mb-1">
                  Username Roblox
                </span>
                <span className="text-xs font-black text-white font-mono truncate block">
                  {username}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(username, 'Username')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Copy size={12} />
              <span>{copiedField === 'Username' ? 'Tersalin!' : 'Salin'}</span>
            </button>
          </div>

          {/* 2. Password Roblox */}
          <div className="p-3 rounded-2xl bg-bg-primary border border-border-default flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <Lock size={15} className="text-accent-cyan shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-text-dim block leading-none mb-1">
                  Password Roblox
                </span>
                <span className="text-xs font-mono font-bold text-accent-cyan tracking-wider truncate block">
                  {password ? (showPassword ? password : '••••••••••••') : <span className="text-text-dim font-normal italic">Belum diisi</span>}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {password && (
                <button
                  type="button"
                  onClick={handleToggleShowPassword}
                  title="Intip 5 detik"
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-dim hover:text-white border border-border-subtle transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleCopy(password, 'Password')}
                className="px-3 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <Copy size={12} />
                <span>{copiedField === 'Password' ? 'Tersalin!' : 'Salin Pass'}</span>
              </button>
            </div>
          </div>

          {/* 3. Email Akun / OTP */}
          <div className="p-3 rounded-2xl bg-bg-primary border border-border-default flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2.5 min-w-0">
              <Mail size={15} className="text-accent-purple-light shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-text-dim block leading-none mb-1">
                  Email Akun / OTP
                </span>
                <span className="text-xs font-mono text-text-secondary truncate block">
                  {email || <span className="text-text-dim italic">Tidak ada email</span>}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(email, 'Email')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-white border border-border-subtle text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Copy size={12} />
              <span>{copiedField === 'Email' ? 'Tersalin!' : 'Salin Email'}</span>
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-3.5 pt-3 border-t border-border-subtle flex items-center justify-between text-[10.5px] text-text-dim">
          <span>🔒 100% Terenkripsi & Anti-Bocor OBS</span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-accent-cyan hover:underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default CredentialModal;
