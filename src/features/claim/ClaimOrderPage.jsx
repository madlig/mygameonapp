// src/features/claim/ClaimOrderPage.jsx
//
// Smart Auto-Detect Shopee Order Claim Page.
// Strict Security: Manual title input is completely locked down.
// Failed / Unverified lookups trigger an automated Telemetry Alert to Admin Telegram.

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertCircle, Loader2, Send, 
  HelpCircle, ArrowLeft, Gamepad2, ShieldCheck, Mail, ExternalLink,
  ShoppingBag, Disc, MessageSquare, Copy, Check, Sparkles, FolderDown,
  Download, Clock, Info, UserCheck, Key, ShieldAlert, Lock, Search,
  AlertTriangle, RefreshCw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  db, collection, addDoc, getDoc, getDocs, query, where, 
  serverTimestamp, setDoc, updateDoc, doc 
} from '../../config/firebaseConfig';
import n8nService from '../../services/api/n8nService';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../config/integrations';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import Seo from '../../components/common/Seo';

const MAX_FAILED_ATTEMPTS = 3;

// Tangga durasi lockout progresif:
// Akumulasi 1 (salah 3x): 5 menit (300s)
// Akumulasi 2 (salah 3x lagi): 10 menit (600s)
// Akumulasi 3 (salah 3x lagi): 20 menit (1200s)
// Akumulasi 4 (salah 3x lagi): 40 menit (2400s)
// Akumulasi 5 (salah 3x lagi): 60 menit / 1 jam (3600s - Maksimal)
const LOCKOUT_TIERS = [
  { tier: 1, durationSec: 5 * 60, label: '5 Menit' },
  { tier: 2, durationSec: 10 * 60, label: '10 Menit' },
  { tier: 3, durationSec: 20 * 60, label: '20 Menit' },
  { tier: 4, durationSec: 40 * 60, label: '40 Menit' },
  { tier: 5, durationSec: 60 * 60, label: '1 Jam (Maksimal)' },
];

const STORAGE_KEYS = {
  LOCKOUT_UNTIL: 'mygameon_claim_lockout_until',
  ACCUMULATION_TIER: 'mygameon_claim_lockout_tier',
  ACTIVE_LOCKOUT_TIER: 'mygameon_claim_active_tier',
  FAILED_ATTEMPTS: 'mygameon_claim_failed_attempts',
};

// Helper format countdown: HH:MM:SS atau MM:SS
const formatRemainingTime = (totalSeconds) => {
  if (totalSeconds <= 0) return '00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ClaimOrderPage = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  // Navigation steps: 'lookup' -> 'confirm' -> 'success'
  const [step, setStep] = useState('lookup');

  // Input states
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Verified order state from Firestore
  const [verifiedOrder, setVerifiedOrder] = useState(null);

  // Status, Security & Progressive Lockout
  const [isVerifying, setIsVerifying] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [lookupError, setLookupError] = useState(null); // { message, unverified: boolean, alreadyClaimed: boolean }
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [accumulationTier, setAccumulationTier] = useState(1);
  const [activeLockoutTier, setActiveLockoutTier] = useState(1);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [copiedKey, setCopiedKey] = useState(false);

  // Auto-fill from active auth session
  useEffect(() => {
    if (currentUser?.email && !email) {
      setEmail(currentUser.email);
    }
  }, [currentUser, email]);

  // Baca persistensi lockout & akumulasi dari localStorage saat halaman di-load
  useEffect(() => {
    try {
      const storedTier = localStorage.getItem(STORAGE_KEYS.ACCUMULATION_TIER);
      const storedActiveTier = localStorage.getItem(STORAGE_KEYS.ACTIVE_LOCKOUT_TIER);
      const storedAttempts = localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      const storedLockoutUntil = localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL);

      if (storedTier) {
        const parsedTier = parseInt(storedTier, 10);
        if (!isNaN(parsedTier) && parsedTier >= 1) {
          setAccumulationTier(Math.min(5, parsedTier));
        }
      }

      if (storedActiveTier) {
        const parsedActive = parseInt(storedActiveTier, 10);
        if (!isNaN(parsedActive) && parsedActive >= 1) {
          setActiveLockoutTier(Math.min(5, parsedActive));
        }
      }

      if (storedAttempts) {
        const parsedAttempts = parseInt(storedAttempts, 10);
        if (!isNaN(parsedAttempts) && parsedAttempts >= 0) {
          setFailedAttempts(parsedAttempts);
        }
      }

      if (storedLockoutUntil) {
        const untilTimestamp = parseInt(storedLockoutUntil, 10);
        const remainingSec = Math.ceil((untilTimestamp - Date.now()) / 1000);

        if (remainingSec > 0) {
          setLockoutTimer(remainingSec);
        } else {
          // Waktu lockout sudah kedaluwarsa
          localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
          setLockoutTimer(0);
        }
      }
    } catch (storageErr) {
      console.warn('Gagal membaca storage lockout:', storageErr);
    }
  }, []);

  // Handle countdown lockout timer dengan auto-cleanup storage
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const timer = setInterval(() => {
      setLockoutTimer((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          try {
            localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
          } catch {}
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  const copyLicenseKey = async () => {
    if (!verifiedOrder?.invoice) return;
    try {
      await navigator.clipboard.writeText(verifiedOrder.invoice);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    } catch {
      // ignore
    }
  };

  // ─── STEP 1: VERIFY SHOPEE ORDER NUMBER ─────────────────────────
  const handleVerifyOrder = async (e) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    const cleanInvoice = orderId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (!cleanInvoice || cleanInvoice.length < 5) {
      setLookupError({
        message: 'Nomor Pesanan Shopee tidak valid (minimal 5 karakter alfanumerik).',
        unverified: false,
      });
      return;
    }

    setIsVerifying(true);
    setLookupError(null);

    try {
      // 1. Cari langsung di koleksi shopee_orders (Doc ID = cleanInvoice)
      let orderData = null;
      const orderDocRef = doc(db, 'shopee_orders', cleanInvoice);
      const orderSnap = await getDoc(orderDocRef);

      if (orderSnap.exists()) {
        orderData = { id: orderSnap.id, ...orderSnap.data() };
      } else {
        // Fallback: query field 'invoice'
        const q = query(collection(db, 'shopee_orders'), where('invoice', '==', cleanInvoice));
        const qSnap = await getDocs(q);
        if (!qSnap.empty) {
          orderData = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
        }
      }

      // KASUS A: NOMOR PESANAN DITEMUKAN
      if (orderData) {
        // Cek jika pesanan sudah pernah diklaim sebelumnya
        if (orderData.status === 'claimed') {
          const claimDate = orderData.claimedAt?.seconds
            ? new Date(orderData.claimedAt.seconds * 1000).toLocaleDateString('id-ID')
            : 'sebelumnya';

          setLookupError({
            message: `Nomor pesanan ${cleanInvoice} sudah pernah diklaim pada ${claimDate} (${orderData.claimedByEmail || 'email terdaftar'}).`,
            unverified: false,
            alreadyClaimed: true,
            invoice: cleanInvoice,
          });
          setIsVerifying(false);
          return;
        }

        // Normalisasi format items (array games)
        let normalizedItems = [];
        if (Array.isArray(orderData.items) && orderData.items.length > 0) {
          normalizedItems = orderData.items.map((item, idx) => ({
            index: idx + 1,
            title: typeof item === 'string' ? item : (item.title || item.cleanTitle || 'Game PC'),
            rawTitle: item.rawTitle || (typeof item === 'string' ? item : item.title),
            variation: item.variation || '',
            isSims4: Boolean(item.isSims4 || /sims 4/i.test(typeof item === 'string' ? item : item.title)),
            allowCC: Boolean(item.allowCC || (item.variation && /CC/i.test(item.variation))),
          }));
        } else if (orderData.gameTitle) {
          // Format single game lama
          normalizedItems = [{
            index: 1,
            title: orderData.gameTitle,
            rawTitle: orderData.gameTitle,
            variation: '',
            isSims4: /sims 4/i.test(orderData.gameTitle),
            allowCC: false,
          }];
        }

        setVerifiedOrder({
          ...orderData,
          invoice: cleanInvoice,
          items: normalizedItems,
          hasSims4: normalizedItems.some((i) => i.isSims4),
          totalGames: normalizedItems.length,
        });

        // Reset proteksi lockout dan kegagalan karena user sudah memasukkan invoice valid
        try {
          localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);
          localStorage.removeItem(STORAGE_KEYS.ACCUMULATION_TIER);
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_LOCKOUT_TIER);
          localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
        } catch {}
        setFailedAttempts(0);
        setAccumulationTier(1);
        setActiveLockoutTier(1);
        setLockoutTimer(0);
        setStep('confirm');
      } else {
        // KASUS B: NOMOR PESANAN TIDAK DITEMUKAN (POTENSI COBA-COBA / BRUTEFORCE)
        const nextFailedCount = failedAttempts + 1;
        setFailedAttempts(nextFailedCount);

        let activeDurationSec = 0;
        let activeTierConfig = null;

        // Jika sudah mencapai 3 kali salah pada siklus aktif: aktifkan lockout akumulatif
        if (nextFailedCount >= MAX_FAILED_ATTEMPTS) {
          const currentTierIdx = Math.min(LOCKOUT_TIERS.length - 1, Math.max(0, accumulationTier - 1));
          activeTierConfig = LOCKOUT_TIERS[currentTierIdx];
          activeDurationSec = activeTierConfig.durationSec;
          const lockoutUntil = Date.now() + activeDurationSec * 1000;
          const appliedTier = currentTierIdx + 1;

          // Naikkan tier untuk siklus berikutnya (maksimal capped di 5 = 1 jam)
          const nextTier = Math.min(5, accumulationTier + 1);

          setLockoutTimer(activeDurationSec);
          setActiveLockoutTier(appliedTier);
          setFailedAttempts(0);
          setAccumulationTier(nextTier);

          // Simpan persistensi ke localStorage anti-refresh
          try {
            localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, String(lockoutUntil));
            localStorage.setItem(STORAGE_KEYS.ACCUMULATION_TIER, String(nextTier));
            localStorage.setItem(STORAGE_KEYS.ACTIVE_LOCKOUT_TIER, String(appliedTier));
            localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, '0');
          } catch (storageErr) {
            console.warn('Gagal menyimpan status lockout:', storageErr);
          }
        } else {
          // Simpan progres percobaan gagal sebelum mencapai batas 3x
          try {
            localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, String(nextFailedCount));
          } catch {}
        }

        // Kirim notifikasi darurat / telemetri alert ke Telegram Admin via n8n
        try {
          await n8nService.dispatchUnverifiedInvoiceAlert({
            invoice: cleanInvoice,
            userEmail: currentUser?.email || '',
            attemptCount: nextFailedCount,
            accumulationTier,
            lockoutDurationMin: activeDurationSec > 0 ? Math.round(activeDurationSec / 60) : 0,
          });
        } catch (telemetryErr) {
          console.warn('Telemetry dispatch notice:', telemetryErr);
        }

        // Catat jejak audit ke Firestore 'failed_claim_attempts'
        try {
          await addDoc(collection(db, 'failed_claim_attempts'), {
            invoice: cleanInvoice,
            timestamp: serverTimestamp(),
            userEmail: currentUser?.email || '',
            userId: currentUser?.uid || null,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            attemptCount: nextFailedCount,
            accumulationTier,
            lockoutApplied: activeDurationSec > 0,
            lockoutDurationSec: activeDurationSec,
          });
        } catch (auditErr) {
          console.warn('Audit record notice:', auditErr);
        }

        setLookupError({
          message: `Nomor pesanan #${cleanInvoice} belum terdaftar di sistem.`,
          unverified: true,
          invoice: cleanInvoice,
          attemptCount: nextFailedCount,
          lockedOut: activeDurationSec > 0,
          durationLabel: activeTierConfig?.label || '',
        });
      }
    } catch (err) {
      console.error('Error verifying Shopee order:', err);
      setLookupError({
        message: 'Terjadi kendala koneksi saat menghubungi server verifikasi. Silakan coba sesaat lagi.',
        unverified: false,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── STEP 2: CONFIRM & CLAIM GAMES ──────────────────────────────
  const handleConfirmClaim = async (e) => {
    e.preventDefault();
    if (!verifiedOrder) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Mohon masukkan alamat Gmail aktif Anda.');
      return;
    }

    setIsClaiming(true);

    try {
      const invoice = verifiedOrder.invoice;
      const shopeeUsername = verifiedOrder.buyerUsername || verifiedOrder.shopeeUsername || '';

      // 1. Update status di shopee_orders menjadi 'claimed'
      try {
        const orderDocRef = doc(db, 'shopee_orders', invoice);
        await updateDoc(orderDocRef, {
          status: 'claimed',
          claimedByEmail: cleanEmail,
          claimedAt: serverTimestamp(),
          claimedUid: currentUser?.uid || null,
        });
      } catch (upErr) {
        console.warn('Update order status note:', upErr);
      }

      // 2. Simpan record klaim resmi ke Firestore koleksi 'claims'
      const claimPayload = {
        invoice,
        email: cleanEmail,
        orderType: verifiedOrder.hasSims4 ? 'sims4' : 'pcgame',
        gameTitle: verifiedOrder.items.map((i) => i.title).join(', '),
        items: verifiedOrder.items,
        shopeeUsername,
        notes: notes.trim(),
        userId: currentUser?.uid || null,
        userDisplayName: currentUser?.displayName || '',
        status: 'active', // Otomatis aktif karena sudah diverifikasi dari invoice Shopee!
        source: 'smart_claim_autodetect',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newClaimDoc = await addDoc(collection(db, 'claims'), claimPayload);

      // 3. Simpan ke sub-koleksi users/{uid}/claims/{id} jika user login
      if (currentUser?.uid) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'claims', newClaimDoc.id), {
            ...claimPayload,
            claimId: newClaimDoc.id,
          });

          // Otomatis sinkronkan username Shopee ke profil user
          if (shopeeUsername && !userProfile?.shopeeUsername) {
            await updateUserProfile({ shopeeUsername });
          }
        } catch (subErr) {
          console.warn('Sub-claim sync note:', subErr);
        }
      }

      // 4. Dispatch ke webhook otomatisasi n8n untuk share Google Drive / kirim lisensi
      try {
        await n8nService.dispatchOrderClaim({
          invoice,
          email: cleanEmail,
          orderType: verifiedOrder.hasSims4 ? 'sims4' : 'pcgame',
          gameTitle: claimPayload.gameTitle,
          shopeeUsername,
        });
      } catch (n8nErr) {
        console.warn('n8n dispatch note:', n8nErr);
      }

      setStep('success');
    } catch (err) {
      console.error('Error completing claim:', err);
      alert('Gagal menyelesaikan klaim: ' + (err.message || 'Silakan hubungi WhatsApp admin.'));
    } finally {
      setIsClaiming(false);
    }
  };

  const handleReset = () => {
    setStep('lookup');
    setOrderId('');
    setNotes('');
    setVerifiedOrder(null);
    setLookupError(null);
  };

  const waSupportUrl = (invoiceNum = '') => buildWhatsAppUrl({
    text: `Halo Admin MyGameON, nomor pesanan Shopee saya #${invoiceNum || orderId.trim() || '...' } belum terdeteksi di sistem klaim. Mohon bantuannya ya min.`,
  });

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      <Seo
        title="Klaim Pesanan Shopee — MyGameON"
        description="Sistem verifikasi otomatis pesanan Shopee MyGameON. Masukkan nomor pesanan untuk membuka akses game dan License Key The Sims 4 secara kilat."
      />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0b0d12]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-xs sm:text-sm font-semibold">
          <ArrowLeft size={16} />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/library" className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition-colors hidden sm:inline-flex items-center gap-1.5">
            <FolderDown size={14} />
            <span>Koleksi Game Saya</span>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-400 font-bold">Verifikasi Shopee Aktif</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-xl">

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 mb-4 shadow-lg shadow-amber-400/5">
              <ShoppingBag size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              Klaim Pesanan <span className="text-amber-400">Shopee</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Sistem verifikasi otomatis MyGameON. Masukkan Nomor Pesanan Shopee Anda untuk mendeteksi seluruh judul game dan lisensi resmi secara instan.
            </p>
          </div>

          {/* User Auth Context Banner */}
          {currentUser && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[#090D15] border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 text-slate-300">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <UserCheck size={15} />
                </div>
                <div>
                  <span className="text-slate-400">Login sebagai: </span>
                  <strong className="text-white font-semibold">{currentUser.displayName || currentUser.email}</strong>
                </div>
              </div>
              <Link to="/library" className="text-amber-400 hover:text-amber-300 font-bold underline text-[11px]">
                Buka Library
              </Link>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: LOOKUP NOMOR PESANAN SHOPEE (INPUT MANUAL DIKUNCI)
          ═══════════════════════════════════════════════════════════════ */}
          {step === 'lookup' && (
            <div className="bg-[#0b0d12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

              <form onSubmit={handleVerifyOrder} className="space-y-5">
                
                {/* Security Shield Notice */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span className="font-bold text-white block mb-0.5">Sistem Verifikasi Anti-Manipulasi:</span>
                    Judul game akan dibaca 100% otomatis dari data checkout Shopee toko kami. Pengisian judul manual dikunci untuk memastikan keaslian pesanan.
                  </div>
                </div>

                {/* Shopee Order ID Input */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5 flex items-center justify-between">
                    <span>Nomor Pesanan Shopee</span>
                    <span className="text-amber-400 text-[10px] lowercase font-mono">contoh: 2609142PXHW1PB</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => {
                        setOrderId(e.target.value);
                        setLookupError(null);
                      }}
                      placeholder="Tempel / ketik nomor pesanan..."
                      disabled={lockoutTimer > 0 || isVerifying}
                      className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors font-mono tracking-wider disabled:opacity-50"
                      required
                    />
                    <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-500">
                      <Search size={18} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5">
                    <span>Salin dari rincian pesanan Shopee Anda (Status: <em>Sudah Dikirim</em> atau <em>Perlu Dikirim</em>).</span>
                    {failedAttempts > 0 && lockoutTimer === 0 && (
                      <span className="text-amber-400 font-semibold font-mono">
                        Sisa: {MAX_FAILED_ATTEMPTS - failedAttempts}x percobaan
                      </span>
                    )}
                  </div>
                </div>

                {/* Lockout Warning with progressive cumulative countdown */}
                {lockoutTimer > 0 && (
                  <div className="p-5 bg-gradient-to-br from-red-500/15 via-red-950/30 to-red-500/5 border border-red-500/35 rounded-2xl space-y-3.5 animate-in fade-in">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                        <Lock size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                            Keamanan Sistem • Akumulasi Ke-{activeLockoutTier} dari 5
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            (Maks. 1 Jam)
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-red-200">
                          Akses Form Verifikasi Terkunci Sementara
                        </h4>
                      </div>
                    </div>

                    {/* Big Countdown Timer Display */}
                    <div className="p-3.5 bg-black/60 rounded-xl border border-red-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 font-medium">
                        Sisa Waktu Penguncian:
                      </span>
                      <div className="flex items-center gap-2 font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-widest">
                        <Clock size={18} className="text-red-400 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>{formatRemainingTime(lockoutTimer)}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Sistem mendeteksi 3 kali percobaan nomor pesanan yang tidak terdaftar. Akses formulir dikunci sementara selama <strong>{LOCKOUT_TIERS[Math.min(LOCKOUT_TIERS.length - 1, Math.max(0, activeLockoutTier - 1))].label}</strong>.
                      {activeLockoutTier < 5 ? (
                        <span className="text-slate-400 block mt-1">
                          Jika masih salah pada siklus berikutnya, durasi penguncian bertambah (5m → 10m → 20m → 40m → 60m maksimal).
                        </span>
                      ) : (
                        <span className="text-red-300 block mt-1 font-semibold">
                          Telah mencapai batas maksimal pembatasan sistem (1 Jam).
                        </span>
                      )}
                    </p>

                    <div className="pt-2 border-t border-red-500/20">
                      <a
                        href={waSupportUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                      >
                        <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
                        <span>Klaim Terkendala? Hubungi WhatsApp Admin Toko</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Error Banner when lookup fails */}
                {lookupError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/25 rounded-2xl text-xs space-y-3 animate-in fade-in">
                    <div className="flex items-start gap-2.5 text-red-300">
                      <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <strong className="text-red-200 block mb-0.5">
                          {lookupError.alreadyClaimed ? 'Pesanan Sudah Diklaim' : 'Nomor Pesanan Tidak Ditemukan'}
                        </strong>
                        <span>{lookupError.message}</span>
                      </div>
                    </div>

                    {/* Unverified Notice: Strictly redirect to WhatsApp Business */}
                    {lookupError.unverified && (
                      <div className="pt-2.5 border-t border-red-500/15 space-y-2.5">
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Sistem mendeteksi nomor pesanan ini belum tersinkronisasi (biasanya butuh 1-2 menit setelah checkout). Demi keamanan transaksi, <strong>input manual tidak diizinkan</strong>.
                        </p>
                        <a
                          href={waSupportUrl(lookupError.invoice)}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/10"
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
                          <span>Konfirmasi ke WhatsApp Business Toko</span>
                        </a>
                      </div>
                    )}

                    {lookupError.alreadyClaimed && (
                      <div className="pt-2 border-t border-red-500/15">
                        <a
                          href={waSupportUrl(lookupError.invoice)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:text-amber-300 font-bold underline inline-flex items-center gap-1 text-[11px]"
                        >
                          <MessageSquare size={13} />
                          <span>Hubungi Admin jika ini adalah pesanan Anda</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifying || lockoutTimer > 0 || !orderId.trim()}
                  className="w-full bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/15 disabled:opacity-50 text-sm"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-slate-950" />
                      <span>Memeriksa Data Pesanan Shopee...</span>
                    </>
                  ) : lockoutTimer > 0 ? (
                    <>
                      <Lock size={18} className="text-slate-950" />
                      <span>Terkunci Sementara ({formatRemainingTime(lockoutTimer)})</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} className="stroke-[2.5]" />
                      <span>Verifikasi & Deteksi Game Saya</span>
                    </>
                  )}
                </button>
              </form>

              {/* Guarantees */}
              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-6 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Deteksi Otomatis
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Full Speed GDrive
                </span>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: CONFIRM VERIFIED ORDER (AUTO-DETECTED GAMES)
          ═══════════════════════════════════════════════════════════════ */}
          {step === 'confirm' && verifiedOrder && (
            <div className="bg-[#0b0d12] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Header Verified */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                      Pesanan Terverifikasi
                    </span>
                    <h3 className="text-sm font-black text-white font-mono">
                      #{verifiedOrder.invoice}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-bold text-slate-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 block">
                    @{verifiedOrder.buyerUsername || verifiedOrder.shopeeUsername || 'Pembeli Shopee'}
                  </span>
                </div>
              </div>

              {/* List of Detected Games */}
              <div className="mb-6 space-y-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Game Terdeteksi dalam Pesanan Ini ({verifiedOrder.items?.length || 1} Game):
                </label>

                <div className="space-y-2">
                  {verifiedOrder.items?.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          item.isSims4 ? 'bg-amber-400/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {item.isSims4 ? <Disc size={18} /> : <Gamepad2 size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate" title={item.title}>
                            {idx + 1}. {item.title}
                          </h4>
                          {item.variation && (
                            <span className="text-[10px] text-amber-400/90 font-medium">
                              Variasi: {item.variation}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        item.isSims4 
                          ? 'bg-amber-400/15 text-amber-400 border border-amber-400/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {item.isSims4 ? 'The Sims 4' : 'Game PC'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirmation Form */}
              <form onSubmit={handleConfirmClaim} className="space-y-4">
                {/* Delivery Gmail */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Alamat Email (Gmail Aktif Penerima) <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="namaanda@gmail.com"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500">
                      <Mail size={16} />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Folder Google Drive resmi akan dishare langsung ke alamat Gmail ini.
                  </p>
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Perlu panduan install atau kendala drive"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Submit & Back Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => setStep('lookup')}
                    disabled={isClaiming}
                    className="sm:w-1/3 bg-white/5 hover:bg-white/10 text-slate-300 font-bold py-3 px-4 rounded-xl text-xs transition-colors text-center"
                  >
                    Ganti Nomor
                  </button>

                  <button
                    type="submit"
                    disabled={isClaiming}
                    className="flex-1 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/15 disabled:opacity-50 text-xs sm:text-sm"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-slate-950" />
                        <span>Sedang Membuka Akses Game...</span>
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Klaim {verifiedOrder.totalGames} Game Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: SUCCESS FULFILLMENT SCREEN
          ═══════════════════════════════════════════════════════════════ */}
          {step === 'success' && verifiedOrder && (
            <div className="bg-[#0b0d12] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-3">
                <Sparkles size={12} />
                <span>Klaim Berhasil Diverifikasi 100%</span>
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                Akses Game Telah Dibuka!
              </h3>
              <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                Pesanan <span className="font-mono text-amber-400 font-bold">#{verifiedOrder.invoice}</span> telah berhasil dihubungkan ke email <span className="font-semibold text-white">{email}</span>.
              </p>

              {/* Sims 4 Key Callout if order contains The Sims 4 */}
              {verifiedOrder.hasSims4 && (
                <div className="bg-[#080B11] border border-amber-400/30 rounded-2xl p-4 sm:p-5 text-left mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key size={16} className="text-amber-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        License Key Launcher Anda:
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      The Sims 4
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-sm text-amber-300">
                    <span className="truncate tracking-wider font-bold">{verifiedOrder.invoice}</span>
                    <button
                      type="button"
                      onClick={copyLicenseKey}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey ? 'Tersalin' : 'Salin Key'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-400 leading-relaxed pl-2">
                    Gunakan nomor pesanan di atas sebagai <strong>License Key</strong> di aplikasi <em>MyGameON Ultimate Launcher</em>. Seluruh DLC & fitur updater otomatis langsung aktif.
                  </div>
                </div>
              )}

              {/* PC Games Instructions */}
              <div className="bg-[#080B11] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-left mb-6 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-bold text-emerald-400 mb-1">
                  <FolderDown size={16} />
                  <span>Daftar Game Masuk ke Koleksi Anda:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-slate-400">
                  {verifiedOrder.items?.map((item, i) => (
                    <li key={i}>
                      <strong className="text-white">{item.title}</strong>
                      {item.variation ? ` (${item.variation})` : ''}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-slate-500 pt-2 border-t border-white/5">
                  Folder Google Drive telah dishare ke <strong>{email}</strong>. Cek tab <em>"Dibagikan kepada saya"</em> di Google Drive Anda.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/library"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/15"
                >
                  <FolderDown size={16} />
                  <span>Buka di Koleksi Game Saya</span>
                </Link>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={buildWhatsAppUrl({
                      text: `Halo Admin MyGameON, saya sudah selesai klaim pesanan Shopee No: #${verifiedOrder.invoice} untuk ${verifiedOrder.items?.map((i) => i.title).join(', ')}. Terima kasih!`,
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-emerald-400" />
                    <span>Konfirmasi WA</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 font-medium py-3 px-4 rounded-xl text-xs transition-colors"
                  >
                    Klaim Pesanan Lain
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Assistance */}
          <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <HelpCircle size={14} />
            <span>Butuh bantuan instalasi atau nomor pesanan belum terbaca? Hubungi WhatsApp resmi toko.</span>
          </div>

        </div>
      </main>

      {/* Mini Footer */}
      <footer className="border-t border-white/5 py-4 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} MyGameON Studio. All Rights Reserved.
      </footer>
    </div>
  );
};

export default ClaimOrderPage;
