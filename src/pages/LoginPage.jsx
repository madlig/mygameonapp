import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Gamepad2,
  LogIn,
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  UserPlus,
  ShoppingBag,
  User,
  Mail,
  Lock,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import Seo from '../components/common/Seo';

// ─── Google Icon Component ────────────────────────────────────
const GoogleIcon = ({ className = 'w-4 h-4' }) => (
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
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

// ─── Client-side brute-force protection ──────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 2 * 60 * 1000; // 2 menit lockout
const STORAGE_KEY = 'mgo_login_state';

function readLockState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { attempts: 0, lockoutUntil: 0 };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockoutUntil: 0 };
  }
}

function writeLockState(state) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable — degrade gracefully
  }
}

function clearLockState() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ─── Input sanitiser ─────────────────────────────────────────
function sanitizeEmail(value) {
  return (value || '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .toLowerCase();
}

// ═══════════════════════════════════════════════════════════════
const LoginPage = ({ initialMode = 'login' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Deteksi mode awal dari URL atau prop
  const isRegisterRoute = location.pathname === '/register' || initialMode === 'register';
  const [mode, setMode] = useState(isRegisterRoute ? 'register' : 'login');

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopeeUsername, setShopeeUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const lockTimerRef = useRef(null);

  const {
    currentUser,
    isAdmin,
    loading: authLoading,
    login,
    register,
    loginWithGoogle,
  } = useAuth();

  // Sinkronkan state mode jika URL berubah
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login') {
      setMode('login');
    }
  }, [location.pathname]);

  // ── Auto-redirect jika sudah login ─────────────────────────
  useEffect(() => {
    if (!authLoading && currentUser) {
      if (isAdmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/library', { replace: true });
      }
    }
  }, [currentUser, isAdmin, authLoading, navigate]);

  // ── Lockout countdown timer ────────────────────────────────
  const startCountdown = useCallback((until) => {
    clearInterval(lockTimerRef.current);
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setLockSeconds(remaining);
      if (remaining <= 0) {
        clearInterval(lockTimerRef.current);
        writeLockState({ attempts: 0, lockoutUntil: 0 });
      }
    };
    tick();
    lockTimerRef.current = setInterval(tick, 1000);
  }, []);

  // Resume lockout on mount
  useEffect(() => {
    const { lockoutUntil } = readLockState();
    if (lockoutUntil > Date.now()) {
      startCountdown(lockoutUntil);
    }
    return () => clearInterval(lockTimerRef.current);
  }, [startCountdown]);

  // ── Google 1-Click Login Handler ───────────────────────────
  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const userCredential = await loginWithGoogle();
      clearLockState();

      // Cek hak akses admin
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      const claims = tokenResult.claims || {};
      const hasAdmin = claims.admin === true || claims.role === 'admin';

      if (hasAdmin) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/library', { replace: true });
      }
    } catch (err) {
      console.error('Google Sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError(
          'Login Google belum diaktifkan di Firebase Console (Authentication > Sign-in method > Google). Silakan gunakan tab "Masuk ke Akun" atau "Daftar Baru" via Email di bawah.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          'Domain saat ini belum didaftarkan di Authorized Domains Firebase Console.'
        );
      } else if (code !== 'auth/popup-closed-by-user') {
        setError('Gagal masuk dengan akun Google. Silakan coba lagi atau gunakan form email.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // ── Email/Password Submit Handler ──────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check lockout jika login
    if (mode === 'login') {
      const state = readLockState();
      if (state.lockoutUntil > Date.now()) {
        setError('Terlalu banyak percobaan. Tunggu sebelum mencoba lagi.');
        return;
      }
    }

    // Basic validation
    const cleanEmail = sanitizeEmail(email);
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Masukkan alamat email yang valid.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    setLoading(true);

    try {
      if (mode === 'register') {
        // ── REGISTRASI AKUN BARU PEMBELI ──
        if (!displayName.trim()) {
          setError('Masukkan nama lengkap kamu.');
          setLoading(false);
          return;
        }

        await register(cleanEmail, password, displayName.trim(), shopeeUsername.trim());
        clearLockState();
        navigate('/library', { replace: true });
      } else {
        // ── LOGIN EMAIL / PASSWORD ──
        const userCredential = await login(cleanEmail, password);

        // Periksa custom claims admin
        const tokenResult = await userCredential.user.getIdTokenResult(true);
        const claims = tokenResult.claims || {};
        const hasAdminClaim = claims.admin === true || claims.role === 'admin';

        clearLockState();

        if (hasAdminClaim) {
          navigate('/dashboard', { replace: true });
        } else {
          // Pembeli diarahkan ke Library miliknya
          navigate('/library', { replace: true });
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      const code = err?.code || '';

      if (mode === 'login') {
        // Increment failed attempts on login
        const prev = readLockState();
        const newAttempts = prev.attempts + 1;
        let newLockout = 0;

        if (newAttempts >= MAX_ATTEMPTS) {
          newLockout = Date.now() + LOCKOUT_MS;
          startCountdown(newLockout);
        }
        writeLockState({ attempts: newAttempts, lockoutUntil: newLockout });
      }

      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Email atau password salah.');
      } else if (code === 'auth/email-already-in-use') {
        setError('Email ini sudah terdaftar. Silakan pilih tab "Masuk ke Akun".');
      } else if (code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (code === 'auth/weak-password') {
        setError('Password terlalu lemah. Gunakan minimal 6 karakter kombinasi.');
      } else if (code === 'auth/too-many-requests') {
        setError('Terlalu banyak percobaan gagal. Akun sementara dikunci. Coba lagi nanti.');
      } else {
        setError('Terjadi kendala saat memproses akun. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Auth loading spinner ───────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#07090E] grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin w-8 h-8 text-amber-400" />
          <span className="text-xs">Memeriksa sesi login...</span>
        </div>
      </div>
    );
  }

  const isLocked = lockSeconds > 0 && mode === 'login';

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black font-sans antialiased">
      <Seo
        title={mode === 'register' ? 'Daftar Akun — MyGameON' : 'Masuk Akun — MyGameON'}
        description="Masuk atau daftar akun MyGameON untuk mengakses brankas game, link Google Drive purnajual, dan klaim pesanan Shopee."
      />

      {/* Ambient background effect */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,209,0,0.06),transparent_60%)]" />

      {/* Top Bar / Back to Home */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-6 pt-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Kembali ke Beranda</span>
        </Link>

        <Link
          to="/katalog"
          className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors"
        >
          Jelajahi Katalog
        </Link>
      </header>

      {/* Main Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link to="/" className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 mb-3 shadow-lg shadow-amber-400/10 hover:border-amber-400/60 transition-all">
              <Gamepad2 className="w-6 h-6 text-amber-400" />
            </Link>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {mode === 'register' ? 'Buat Akun MyGameON' : 'Masuk ke Akun Kamu'}
            </h1>
            <p className="mt-1 text-xs text-slate-400 max-w-xs mx-auto">
              Akses brankas game PC, direct cloud Google Drive, dan sinkronisasi pesananmu.
            </p>
          </div>

          {/* Form Card */}
          <div className="rounded-3xl border border-white/10 bg-[#0B0F17] p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#06080C] border border-white/5 mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LogIn size={14} />
                <span>Masuk ke Akun</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className={`py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus size={14} />
                <span>Daftar Baru</span>
              </button>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-400 leading-relaxed animate-in fade-in">
                {error}
              </div>
            )}

            {/* Lockout banner */}
            {isLocked && (
              <div className="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-xs text-amber-400 text-center">
                Terlalu banyak percobaan. Coba lagi dalam{' '}
                <span className="font-bold tabular-nums">{lockSeconds}</span> detik.
              </div>
            )}

            {/* Google 1-Click Button (Sangat Direkomendasikan bagi Pembeli GDrive) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || isLocked}
              className="w-full flex items-center justify-center gap-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs sm:text-sm py-3 px-4 shadow-lg hover:shadow-white/10 transition-all active:scale-[0.98] disabled:opacity-50 mb-5"
            >
              {googleLoading ? (
                <Loader2 size={16} className="animate-spin text-slate-900" />
              ) : (
                <GoogleIcon className="w-4 h-4" />
              )}
              <span>{googleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Akun Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0B0F17] px-3 text-[11px] uppercase tracking-wider text-slate-500 shrink-0 font-semibold">
                atau via email
              </span>
              <div className="border-t border-white/10 w-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Field: Nama Lengkap (Khusus Mode Register) */}
              {mode === 'register' && (
                <div>
                  <label
                    htmlFor="displayName"
                    className="block text-xs font-bold text-slate-300 mb-1.5"
                  >
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required={mode === 'register'}
                      placeholder="Nama kamu..."
                      className="w-full rounded-xl border border-white/10 bg-[#07090E] text-white px-4 py-2.5 pl-10 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all"
                    />
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Field: Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="nama@gmail.com"
                    disabled={isLocked}
                    className="w-full rounded-xl border border-white/10 bg-[#07090E] text-white px-4 py-2.5 pl-10 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all disabled:opacity-50"
                  />
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Field: Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    placeholder="Minimal 6 karakter"
                    disabled={isLocked}
                    className="w-full rounded-xl border border-white/10 bg-[#07090E] text-white px-4 py-2.5 pl-10 pr-10 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all disabled:opacity-50"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Field: Username Shopee (Khusus Mode Register, Opsional) */}
              {mode === 'register' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="shopeeUsername"
                      className="block text-xs font-bold text-slate-300"
                    >
                      Username Akun Shopee
                    </label>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      Opsional
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="shopeeUsername"
                      type="text"
                      value={shopeeUsername}
                      onChange={(e) => setShopeeUsername(e.target.value)}
                      placeholder="@username_shopee kamu"
                      className="w-full rounded-xl border border-white/10 bg-[#07090E] text-white px-4 py-2.5 pl-10 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-mono"
                    />
                    <ShoppingBag className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Untuk memudahkan verifikasi otomatis klaim game pesanan dari Shopee.
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-400 hover:bg-amber-300 py-3 text-xs font-black text-slate-950 transition-all shadow-lg shadow-amber-400/20 active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 text-slate-950" />
                    <span>Memproses...</span>
                  </>
                ) : mode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Daftar &amp; Akses Koleksi Game</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Masuk ke Akun</span>
                  </>
                )}
              </button>
            </form>

            {/* Shopee Buyer Tip */}
            <div className="mt-5 pt-4 border-t border-white/5 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Tips Pembeli Shopee:</strong> Gunakan alamat email Gmail yang sama dengan yang kamu cantumkan saat order di Shopee agar game otomatis muncul di brankasmu.
              </span>
            </div>
          </div>

          {/* Admin notice note */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Staf &amp; Admin terdaftar otomatis dialihkan ke Dashboard Manajemen.</span>
          </div>

        </div>
      </main>

      {/* Clean Footer */}
      <footer className="relative z-10 border-t border-white/5 py-4 text-center text-[11px] text-slate-600">
        <p>© {new Date().getFullYear()} MyGameON • Autentikasi Pelanggan &amp; Staf</p>
      </footer>
    </div>
  );
};

export default LoginPage;
