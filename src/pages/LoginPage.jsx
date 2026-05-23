import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Gamepad2, LogIn, ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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
  // Strip control chars, trim, lowercase
  return value.replace(/[\x00-\x1F\x7F]/g, '').trim().toLowerCase();
}

// ═══════════════════════════════════════════════════════════════
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const lockTimerRef = useRef(null);

  const navigate = useNavigate();
  const {
    currentUser,
    isAdmin,
    loading: authLoading,
    login,
    logout,
  } = useAuth();

  // ── Auto-redirect jika sudah login sebagai admin ───────────
  useEffect(() => {
    if (!authLoading && currentUser && isAdmin) {
      navigate('/dashboard', { replace: true });
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
        // Reset attempts after lockout expires
        writeLockState({ attempts: 0, lockoutUntil: 0 });
      }
    };
    tick();
    lockTimerRef.current = setInterval(tick, 1000);
  }, []);

  // Resume lockout on mount (survives page refresh within session)
  useEffect(() => {
    const { lockoutUntil } = readLockState();
    if (lockoutUntil > Date.now()) {
      startCountdown(lockoutUntil);
    }
    return () => clearInterval(lockTimerRef.current);
  }, [startCountdown]);

  // ── Form submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check lockout
    const state = readLockState();
    if (state.lockoutUntil > Date.now()) {
      setError('Terlalu banyak percobaan. Tunggu sebelum mencoba lagi.');
      return;
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
      // 1) Authenticate with Firebase
      const userCredential = await login(cleanEmail, password);

      // 2) Force-refresh token to get latest custom claims
      const tokenResult = await userCredential.user.getIdTokenResult(true);
      const claims = tokenResult.claims || {};
      const hasAdminClaim =
        claims.admin === true || claims.role === 'admin';

      // 3) Verify admin privilege
      if (!hasAdminClaim) {
        // Non-admin — sign out immediately, don't reveal dashboard
        await logout();
        setError('Akses ditolak. Akun ini tidak memiliki izin admin.');
        return;
      }

      // 4) Success — clear lockout state & navigate
      clearLockState();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // ── Increment failed attempts ──
      const prev = readLockState();
      const newAttempts = prev.attempts + 1;
      let newLockout = 0;

      if (newAttempts >= MAX_ATTEMPTS) {
        newLockout = Date.now() + LOCKOUT_MS;
        startCountdown(newLockout);
      }
      writeLockState({ attempts: newAttempts, lockoutUntil: newLockout });

      // ── Generic error messages — don't leak info ──
      // Firebase v9 uses auth/invalid-credential for both wrong email & wrong password
      const code = err?.code || '';
      if (
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-credential'
      ) {
        setError('Email atau password salah.');
      } else if (code === 'auth/invalid-email') {
        setError('Format email tidak valid.');
      } else if (code === 'auth/user-disabled') {
        setError('Akun ini telah dinonaktifkan.');
      } else if (code === 'auth/too-many-requests') {
        setError(
          'Terlalu banyak percobaan gagal. Akun sementara dikunci oleh Firebase. Coba lagi nanti.'
        );
      } else {
        setError('Terjadi kesalahan. Coba lagi nanti.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Don't render form while auth state still loading ───────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#111317] grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-[#7E8796]">
          <svg
            className="animate-spin w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm">Memeriksa sesi...</span>
        </div>
      </div>
    );
  }

  const isLocked = lockSeconds > 0;

  return (
    <div className="min-h-screen bg-[#111317] flex flex-col">
      {/* Background pattern */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(255,209,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,209,0,0.05) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,209,0,0.08),transparent_50%)]" />

      {/* Back to landing */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#7E8796] hover:text-[#F3F4F6] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>
      </div>

      {/* Login card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Logo / Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFD100]/10 border border-[#FFD100]/20 mb-4">
              <Gamepad2 className="w-7 h-7 text-[#FFD100]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#F3F4F6]">
              Admin Panel
            </h1>
            <p className="mt-1.5 text-sm text-[#7E8796]">
              Login untuk mengakses dashboard
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-[#2A2F39] bg-[#1A1F27] p-6 shadow-xl shadow-black/20">
            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Lockout banner */}
            {isLocked && (
              <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400 text-center">
                Coba lagi dalam{' '}
                <span className="font-bold tabular-nums">{lockSeconds}</span>{' '}
                detik
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-[#9CA3AF] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="Masukkan email"
                  disabled={isLocked}
                  className="w-full rounded-xl border border-[#2F3643] bg-[#111317] text-[#F3F4F6] px-4 py-3 text-sm placeholder:text-[#7E8796] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-[#9CA3AF] mb-1.5"
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
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    disabled={isLocked}
                    className="w-full rounded-xl border border-[#2F3643] bg-[#111317] text-[#F3F4F6] px-4 py-3 pr-11 text-sm placeholder:text-[#7E8796] focus:outline-none focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7E8796] hover:text-[#F3F4F6] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4.5 h-4.5" />
                    ) : (
                      <Eye className="w-4.5 h-4.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || isLocked}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#FFD100] py-3 text-sm font-bold text-[#111317] hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />
                      <path
                        d="M4 12a8 8 0 018-8"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Masuk
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security note */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-[#7E8796]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Hanya untuk admin &amp; owner MyGameON.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
