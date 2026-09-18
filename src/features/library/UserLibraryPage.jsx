// src/features/library/UserLibraryPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Gamepad2, HardDrive, ShoppingBag, CheckCircle2, 
  ExternalLink, ArrowLeft, LogOut, Loader2, Sparkles, 
  FolderDown, ShieldCheck, AlertCircle, HelpCircle, ArrowRight, UserCheck,
  Disc, Key, Copy, Check, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db, collection, query, where, onSnapshot } from '../../config/firebaseConfig';
import LandingNavbar from '../landing/components/LandingNavbar';
import Seo from '../../components/common/Seo';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../config/integrations';

const GoogleIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24">
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
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const UserLibraryPage = () => {
  const { currentUser, userProfile, loginWithGoogle, logout, updateUserProfile, loading } = useAuth();
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [shopeeInput, setShopeeInput] = useState('');
  const [isEditingShopee, setIsEditingShopee] = useState(false);
  const [isSavingShopee, setIsSavingShopee] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handle Google Sign-in
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Login error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setLoginError(
          'Login Google belum diaktifkan di Firebase Console. Kamu tetap bisa masuk atau daftar akun dengan Email & Password.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setLoginError('Domain ini belum didaftarkan di Authorized Domains Firebase Console.');
      } else if (code !== 'auth/popup-closed-by-user') {
        setLoginError('Gagal menghubungkan akun Google. Silakan coba lagi atau gunakan login email.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle saving Shopee username
  const handleSaveShopee = async (e) => {
    e.preventDefault();
    if (!shopeeInput.trim()) return;

    setIsSavingShopee(true);
    const cleanUsername = shopeeInput.trim().replace(/^@/, '');
    const success = await updateUserProfile({ shopeeUsername: cleanUsername });
    setIsSavingShopee(false);

    if (success) {
      setSaveSuccess(true);
      setIsEditingShopee(false);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  // Real-time Claims tracking from Firestore
  const [claims, setClaims] = useState([]);
  const [copiedInvoice, setCopiedInvoice] = useState('');

  useEffect(() => {
    if (!currentUser?.email) {
      setClaims([]);
      return;
    }

    const q = query(
      collection(db, 'claims'),
      where('email', '==', currentUser.email.toLowerCase())
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setClaims(list);
      },
      (err) => {
        console.warn('Claims fetch notice:', err);
      }
    );

    return () => unsub();
  }, [currentUser]);

  const copyKey = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedInvoice(key);
      setTimeout(() => setCopiedInvoice(''), 2500);
    } catch {
      // ignore
    }
  };

  const ownedGames = userProfile?.ownedGames || [];
  const shopeeUsername = userProfile?.shopeeUsername || '';

  const waHelpUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya butuh bantuan terkait koleksi game saya di akun: ${currentUser?.email || ''}.`,
  });

  return (
    <div className="min-h-screen bg-[#030406] text-slate-100 selection:bg-amber-400 selection:text-black font-sans antialiased flex flex-col justify-between">
      <Seo
        title="Koleksi Game Saya — MyGameON"
        description="Akses brankas koleksi game PC yang sudah kamu beli. Unduh langsung dari Google Drive kecepatan maksimal tanpa iklan."
      />

      {/* 1. Global Navigation */}
      <LandingNavbar />

      {/* 2. Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Loading Spinner */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 size={36} className="animate-spin text-amber-400" />
            <span className="text-xs">Menyiapkan koleksi game kamu...</span>
          </div>
        ) : !currentUser ? (
          
          /* ── STATE A: BELUM LOGIN ────────────────────────────── */
          <div className="max-w-xl mx-auto my-6 p-6 sm:p-10 rounded-3xl bg-[#090C12] border border-white/10 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-400/5">
              <Gamepad2 size={32} />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
              Brankas Game Kamu di MyGameON
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto mb-8">
              Masuk dengan akun Google (Gmail) yang kamu gunakan saat memesan game untuk mengakses folder Google Drive langsung, update patch, dan status garansi purnajual.
            </p>

            {/* Error banner */}
            {loginError && (
              <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-300 max-w-md mx-auto text-left leading-relaxed">
                <p className="font-bold text-rose-400 mb-1">⚠️ Kendala Autentikasi Google</p>
                <p>{loginError}</p>
                <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex gap-2">
                  <Link
                    to="/login"
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-[11px] font-bold text-white transition-colors"
                  >
                    Masuk dengan Email
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-200 transition-colors"
                  >
                    Daftar Akun Baru
                  </Link>
                </div>
              </div>
            )}

            {/* Google Sign-In Button */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm transition-all shadow-xl hover:shadow-white/10 active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <Loader2 size={18} className="animate-spin text-slate-900" />
                ) : (
                  <GoogleIcon className="w-5 h-5" />
                )}
                <span>{isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}</span>
              </button>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs transition-colors"
              >
                <span>Masuk / Daftar Email</span>
              </Link>
            </div>

            {/* Feature Guarantees */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-8 mt-8 border-t border-white/5 text-[11px] text-slate-400">
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Direct Cloud GDrive</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Akses Cloud Drive 1 Tahun</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Bebas Iklan & Shortlink</span>
              </div>
            </div>
          </div>

        ) : (

          /* ── STATE B: SUDAH LOGIN ─────────────────────────────── */
          <div className="space-y-6">
            
            {/* User Header Profile Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#0B0F17] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-4">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Gamer'}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-400/40 shadow-md"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 font-black text-lg">
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-white">
                      {currentUser.displayName || 'Gamer MyGameON'}
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wider">
                      Member Terverifikasi
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {/* Top User Actions */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <Link
                  to="/katalog"
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <Gamepad2 size={14} className="text-amber-400" />
                  <span>Katalog Game</span>
                </Link>

                <button
                  onClick={logout}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-xs font-bold text-rose-400 transition-colors flex items-center gap-1.5"
                  title="Keluar dari akun"
                >
                  <LogOut size={14} />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            {/* ── BANNER SINKRONISASI USERNAME SHOPEE ── */}
            {!shopeeUsername || isEditingShopee ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0E131F] via-[#121828] to-[#0E131F] border border-amber-400/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-shopee-orange/15 border border-shopee-orange/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5 sm:mt-0">
                    <ShoppingBag size={20} className="text-shopee-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        Hubungkan Akun Shopee Kamu
                      </h4>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wider">
                        Sinkronisasi Data
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                      Lengkapi username Shopee agar seluruh riwayat pesanan Shopee dan klaim garansi cloud kamu tersinkron otomatis ke akun Gmail ini.
                    </p>
                  </div>
                </div>

                {/* Form Input Username Shopee */}
                <form onSubmit={handleSaveShopee} className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <input
                    type="text"
                    placeholder="Username Shopee kamu..."
                    value={shopeeInput}
                    onChange={(e) => setShopeeInput(e.target.value)}
                    required
                    className="bg-[#07090E] border border-white/15 focus:border-amber-400 text-xs text-white px-3 py-2.5 rounded-xl outline-none w-full md:w-52 transition-all font-medium"
                  />
                  <button
                    type="submit"
                    disabled={isSavingShopee || !shopeeInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shrink-0 transition-all shadow-md shadow-amber-400/20 disabled:opacity-50"
                  >
                    {isSavingShopee ? 'Menyimpan...' : 'Simpan'}
                  </button>
                  {isEditingShopee && (
                    <button
                      type="button"
                      onClick={() => setIsEditingShopee(false)}
                      className="px-2.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold"
                    >
                      Batal
                    </button>
                  )}
                </form>
              </div>
            ) : (
              /* Verified Shopee Badge Banner */
              <div className="px-4 py-3 rounded-2xl bg-[#090D14] border border-white/10 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2.5 text-slate-300">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <UserCheck size={14} />
                  </div>
                  <span>
                    Akun Shopee Terhubung:{' '}
                    <strong className="text-white font-mono bg-white/5 px-2 py-0.5 rounded border border-white/5">
                      @{shopeeUsername}
                    </strong>
                  </span>
                  {saveSuccess && (
                    <span className="text-emerald-400 font-bold ml-2">✓ Berhasil diperbarui!</span>
                  )}
                </div>

                <button
                  onClick={() => {
                    setShopeeInput(shopeeUsername);
                    setIsEditingShopee(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 text-[11px] font-bold underline"
                >
                  Ubah Username Shopee
                </button>
              </div>
            )}

            {/* ── RIWAYAT KLAIM PESANAN SHOPEE (JIKA ADA KLAIM) ── */}
            {claims.length > 0 && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#080B11] border border-white/10 space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={16} className="text-shopee-orange" />
                    <h4 className="text-xs sm:text-sm font-bold text-white">
                      Status Klaim Pesanan Shopee ({claims.length})
                    </h4>
                  </div>
                  <Link
                    to="/claim"
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                  >
                    <span>+ Klaim Baru</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {claims.map((claim) => {
                    const isSims = claim.orderType === 'sims4';
                    const isProcessed = claim.status === 'processed' || claim.status === 'active';
                    const isCopied = copiedInvoice === claim.invoice;

                    return (
                      <div
                        key={claim.id}
                        className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-between gap-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isSims ? 'bg-amber-400/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                              {isSims ? <Disc size={16} /> : <Gamepad2 size={16} />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate" title={claim.gameTitle}>
                                {claim.gameTitle}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                No. Pesanan: {claim.invoice}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                            isProcessed 
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                          }`}>
                            {isProcessed ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            <span>{isProcessed ? 'Klaim Aktif' : 'Menunggu Konfirmasi'}</span>
                          </span>
                        </div>

                        {/* Card bottom actions */}
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                          {isSims ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-400">Key:</span>
                              <button
                                type="button"
                                onClick={() => copyKey(claim.invoice)}
                                className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-amber-300 font-mono text-[11px] font-bold flex items-center gap-1 transition-colors"
                                title="Klik untuk salin License Key"
                              >
                                {isCopied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                <span>{isCopied ? 'Tersalin' : 'Salin Key'}</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              {isProcessed ? 'Akses folder Drive aktif' : 'Sedang diverifikasi admin'}
                            </span>
                          )}

                          <a
                            href={buildWhatsAppUrl({
                              text: `Halo Admin MyGameON, mau tanya status klaim Shopee No: ${claim.invoice} (${claim.gameTitle}).`,
                            })}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-400 hover:text-white transition-colors text-[10px] flex items-center gap-1"
                          >
                            <WhatsAppIcon className="w-3 h-3 fill-emerald-400" />
                            <span>Tanya Admin</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── LIST KOLEKSI GAME USER ── */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                    <HardDrive size={18} className="text-emerald-400" />
                    <span>Daftar Game Milikmu ({ownedGames.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Klik tombol untuk langsung membuka folder Google Drive dan download tanpa iklan.
                  </p>
                </div>

                <Link
                  to="/claim"
                  className="px-3.5 py-2 rounded-xl bg-shopee-orange/10 hover:bg-shopee-orange/20 border border-shopee-orange/30 text-orange-400 text-xs font-extrabold flex items-center gap-1.5 transition-colors"
                >
                  <ShoppingBag size={14} />
                  <span>Klaim Pesanan Shopee</span>
                </Link>
              </div>

              {ownedGames.length > 0 ? (
                /* Grid Games */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {ownedGames.map((game, idx) => {
                    const folderUrl = game.folderId 
                      ? `https://drive.google.com/drive/folders/${game.folderId}` 
                      : (game.gdriveUrl || game.link || '#');

                    return (
                      <div
                        key={game.id || idx}
                        className="bg-[#090C12] border border-white/10 hover:border-amber-400/50 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
                      >
                        <div className="flex gap-3.5">
                          {/* Game Thumbnail */}
                          <div className="w-16 h-20 rounded-xl bg-[#0F131D] overflow-hidden border border-white/10 shrink-0">
                            <img
                              src={game.coverUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400'}
                              alt={game.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Game Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-white truncate" title={game.title}>
                              {game.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                              <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">
                                {game.size || 'Direct Cloud'}
                              </span>
                              <span>•</span>
                              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={11} /> Akses Aktif
                              </span>
                            </div>
                            {game.orderId && (
                              <p className="text-[10px] text-slate-500 mt-1 font-mono">
                                Invoice: {game.orderId}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-white/5 flex items-center gap-2">
                          <a
                            href={folderUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                          >
                            <FolderDown size={14} />
                            <span>Buka Google Drive</span>
                          </a>

                          <a
                            href={waHelpUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Bantuan Instalasi via WhatsApp"
                          >
                            <WhatsAppIcon className="w-4 h-4 fill-current" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Empty State */
                <div className="py-16 px-4 bg-[#07090E] border border-white/10 rounded-3xl text-center max-w-lg mx-auto space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                    <FolderDown size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white mb-1">
                      Belum Ada Game di Koleksimu
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      Jika kamu baru saja memesan di Shopee, masukkan Nomor Pesanan di halaman klaim agar game otomatis masuk ke akun ini.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <Link
                      to="/claim"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-shopee-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-shopee-orange/20"
                    >
                      <ShoppingBag size={14} />
                      <span>Klaim Pesanan Shopee</span>
                    </Link>

                    <Link
                      to="/katalog"
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      <Gamepad2 size={14} className="text-amber-400" />
                      <span>Jelajahi Katalog</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} MyGameON • Cloud Direct Game Library</p>
      </footer>
    </div>
  );
};

export default UserLibraryPage;
