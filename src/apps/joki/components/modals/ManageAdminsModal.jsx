import React, { useState } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { functions, httpsCallable, firebaseConfig } from '../../../../config/firebaseConfig';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../config/firebaseConfig';
import { 
  Crown, 
  X, 
  Plus, 
  Trash2, 
  Share2, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  User, 
  Lock, 
  Globe, 
  Sparkles 
} from 'lucide-react';

const ManageAdminsModal = ({ isOpen, onClose }) => {
  const { workspaces, activeWorkspaceId, changeWorkspace, addToast } = useJoki();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, '')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  };

  const handleCopyLink = (item) => {
    const url = `${window.location.origin}${window.location.pathname}?c=${item.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(item.id);
    addToast(`Link live board untuk ${item.name} berhasil disalin!`, 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateAdmin = async (e) => {
    if (e) e.preventDefault();

    if (!name.trim() || !slug.trim() || !email.trim() || !password.trim()) {
      addToast('Semua kolom formulir wajib diisi.', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Password minimal harus 6 karakter.', 'error');
      return;
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    try {
      setLoading(true);

      // Attempt 1: Try Firebase Cloud Function (asia-southeast2)
      let functionSuccess = false;
      try {
        const createAdminFn = httpsCallable(functions, 'createJokiAdminUser');
        await createAdminFn({
          name: name.trim(),
          slug: cleanSlug,
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });
        functionSuccess = true;
      } catch (fnErr) {
        console.warn('Cloud Function not deployed or unreachable, using direct Secondary Auth provisioning:', fnErr);
      }

      // Attempt 2: Direct secondary auth instance fallback (guaranteed to work in any environment)
      if (!functionSuccess) {
        const secondaryAppName = `SecondaryAuth_${Date.now()}`;
        const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
        const secondaryAuth = getAuth(secondaryApp);

        try {
          const userCred = await createUserWithEmailAndPassword(
            secondaryAuth, 
            email.trim().toLowerCase(), 
            password.trim()
          );
          await updateProfile(userCred.user, { displayName: name.trim() });
        } catch (authErr) {
          if (authErr.code !== 'auth/email-already-in-use') {
            throw authErr;
          }
        } finally {
          await deleteApp(secondaryApp);
        }

        // Save to Firestore joki_workspaces
        await setDoc(doc(db, 'joki_workspaces', cleanSlug), {
          id: cleanSlug,
          name: name.trim(),
          slug: cleanSlug,
          ownerEmail: email.trim().toLowerCase(),
          createdAt: Date.now(),
        }, { merge: true });

        // Initialize settings
        await setDoc(doc(db, 'joki_workspaces', cleanSlug, 'settings', 'global'), {
          globalPaused: false,
          globalPauseStarted: null,
          updatedAt: Date.now(),
        }, { merge: true });
      }

      addToast(`Admin & Kanal ${name} berhasil dibuat! Teman Anda sudah bisa langsung login.`, 'success');
      setName('');
      setSlug('');
      setEmail('');
      setPassword('');
    } catch (err) {
      console.error('Error creating admin:', err);
      addToast(`Gagal membuat admin: ${err.message || 'Terjadi kesalahan'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkspace = async (item) => {
    if (item.id === 'mygameon') {
      addToast('Kanal utama MyGameON tidak dapat dihapus.', 'error');
      return;
    }

    if (!window.confirm(`Hapus kanal ${item.name} (${item.id})? Data joki kanal ini akan dinonaktifkan.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'joki_workspaces', item.id));
      addToast(`Kanal ${item.name} berhasil dihapus.`, 'info');
    } catch (err) {
      console.error(err);
      addToast('Gagal menghapus kanal.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-2xl bg-bg-surface border border-border-default rounded-2xl p-6 shadow-2xl animate-slide-in relative max-h-[90vh] overflow-y-auto"
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
          <div className="w-10 h-10 rounded-xl bg-accent-yellow/15 border border-accent-yellow/30 flex items-center justify-center text-accent-yellow shrink-0">
            <Crown size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-text-primary m-0 tracking-tight flex items-center gap-2">
              <span>Kelola Admin & Kanal Streamer</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30">
                Super Admin
              </span>
            </h3>
            <p className="text-xs text-text-tertiary mt-0.5 m-0">
              Buat akun admin baru untuk teman Anda tanpa perlu membuka Firebase Console
            </p>
          </div>
        </div>

        {/* Form Tambah Admin Baru */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-4 mb-6">
          <div className="text-xs font-black uppercase text-accent-cyan tracking-wider mb-3 flex items-center gap-1.5">
            <Plus size={14} />
            <span>Daftarkan Admin & Kanal Baru</span>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Nama Kanal Streamer <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kadal Gaming"
                    value={name}
                    onChange={handleNameChange}
                    className="w-full bg-bg-surface border border-border-default rounded-lg py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-accent-purple/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Slug URL Kanal <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: kadal"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full bg-bg-surface border border-border-default rounded-lg py-2 pl-9 pr-3 text-xs text-text-primary font-mono outline-none focus:border-accent-purple/50"
                  />
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">
                  Link: <span className="text-accent-cyan font-mono">?c={slug || '...'}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Email Login Admin <span className="text-accent-red">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: kadal@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-surface border border-border-default rounded-lg py-2 px-3 text-xs text-text-primary outline-none focus:border-accent-purple/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-text-tertiary mb-1">
                  Password Akun <span className="text-accent-red">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg-surface border border-border-default rounded-lg py-2 pl-9 pr-3 text-xs text-text-primary outline-none focus:border-accent-purple/50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold text-white bg-accent-purple hover:bg-accent-purple-light active:scale-95 transition-all shadow-md shadow-accent-purple/20 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{loading ? 'Membuat Akun & Kanal...' : '＋ Daftarkan Admin & Buat Kanal'}</span>
            </button>
          </form>
        </div>

        {/* List Kanal Terdaftar */}
        <div>
          <div className="text-xs font-black uppercase text-text-tertiary tracking-wider mb-2.5">
            Daftar Kanal & Admin Aktif ({workspaces.length})
          </div>

          <div className="divide-y divide-border-subtle bg-bg-primary border border-border-subtle rounded-xl overflow-hidden">
            {workspaces.map((item, index) => {
              const isMain = item.id === 'mygameon';
              const isCurrent = activeWorkspaceId === item.id;

              return (
                <div 
                  key={item.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      isMain 
                        ? 'bg-accent-yellow/15 text-accent-yellow border border-accent-yellow/30' 
                        : 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                    }`}>
                      {isMain ? '👑' : index + 1}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-text-primary truncate">
                          {item.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-accent-green/15 text-accent-green border border-accent-green/30">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-dim flex items-center gap-2 mt-0.5">
                        <span>Email: <strong className="text-text-muted">{item.ownerEmail || '-'}</strong></span>
                        <span>·</span>
                        <span className="font-mono text-accent-cyan">?c={item.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleCopyLink(item)}
                      title="Salin link live penonton"
                      className="p-1.5 rounded-lg bg-bg-surface hover:bg-white/10 text-text-muted hover:text-text-primary border border-border-default transition-colors text-xs flex items-center gap-1"
                    >
                      {copiedId === item.id ? <Check size={12} className="text-accent-green" /> : <Share2 size={12} />}
                      <span className="text-[10.5px]">{copiedId === item.id ? 'Tersalin' : 'Link'}</span>
                    </button>

                    <button
                      onClick={() => {
                        changeWorkspace(item.id);
                        onClose();
                      }}
                      title="Buka dashboard kanal ini"
                      className="p-1.5 rounded-lg bg-accent-purple/15 text-accent-purple-light hover:bg-accent-purple/25 border border-accent-purple/30 transition-colors text-xs flex items-center gap-1"
                    >
                      <ExternalLink size={12} />
                      <span className="text-[10.5px]">Buka</span>
                    </button>

                    {!isMain && (
                      <button
                        onClick={() => handleDeleteWorkspace(item)}
                        title="Hapus kanal"
                        className="p-1.5 rounded-lg text-text-dim hover:text-accent-red hover:bg-accent-red/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminsModal;
