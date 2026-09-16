// src/features/landing/RequestGamePage.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Info,
  Clock,
  Copy,
  Gamepad2,
  MessageCircle,
  ShoppingBag,
  Phone,
  FileText,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  collection,
  addDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  updateDoc,
  increment,
  doc,
} from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import {
  REQUEST_ACTIVE_STATUSES,
  REQUEST_STATUS,
} from '../../shared/requestStatus';
import LandingNavbar from './components/LandingNavbar';
import Seo from '../../components/common/Seo';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../config/integrations';
import { useAuth } from '../../contexts/AuthContext';
import { trackGameRequest } from '../../utils/metaPixel';

const RequestGamePage = () => {
  const [searchParams] = useSearchParams();
  const urlTitle = searchParams.get('title') || '';
  const { currentUser, userProfile } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      gameTitle: urlTitle,
      shopeeUsername: userProfile?.shopeeUsername || '',
      contactWhatsApp: '',
      notes: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'voted' | 'rate_limit' | 'error'
  const [trackingCode, setTrackingCode] = useState('');
  const [submittedTitle, setSubmittedTitle] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync title from query param & user profile if available
  useEffect(() => {
    if (urlTitle) {
      setValue('gameTitle', urlTitle);
    }
  }, [urlTitle, setValue]);

  useEffect(() => {
    if (userProfile?.shopeeUsername) {
      setValue('shopeeUsername', userProfile.shopeeUsername);
    }
  }, [userProfile, setValue]);

  const createTrackingCode = () => {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `RQ-${seed.slice(-6).toUpperCase()}`;
  };

  const copyTrackingCode = async () => {
    if (!trackingCode) return;
    await navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const onSubmit = async (data) => {
    // Anti-bot honeypot
    if (data.website_trap) {
      setSubmitStatus('success');
      reset();
      return;
    }

    // Rate limiting (1 per 2 minutes)
    const lastRequestTime = localStorage.getItem('mygameon_last_req');
    const COOLDOWN_PERIOD = 120000;
    if (
      lastRequestTime &&
      Date.now() - parseInt(lastRequestTime, 10) < COOLDOWN_PERIOD
    ) {
      setSubmitStatus('rate_limit');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setTrackingCode('');

    try {
      const cleanTitle = data.gameTitle.trim();
      if (cleanTitle.length < 3) throw new Error('Judul terlalu pendek');
      const titleLower = cleanTitle.toLowerCase();
      setSubmittedTitle(cleanTitle);

      // Check duplicates among active requests
      const q = query(
        collection(db, 'requests'),
        where('title_lower', '==', titleLower),
        where('status', 'in', REQUEST_ACTIVE_STATUSES)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Already exists — add vote
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'requests', existingDoc.id), {
          votes: increment(1),
          updatedAt: serverTimestamp(),
        });
        const existingCode = existingDoc.data().trackingCode || '';
        setTrackingCode(existingCode);
        if (existingCode) {
          localStorage.setItem('mygameon_last_tracking_code', existingCode);
        }
        setSubmitStatus('voted');
      } else {
        // New request
        const code = createTrackingCode();
        const requestData = {
          title: cleanTitle,
          title_lower: titleLower,
          platform: 'PC',
          notes: data.notes?.trim() || '',
          shopeeUsername: (data.shopeeUsername || '').trim().replace(/^@/, ''),
          contactWhatsApp: (data.contactWhatsApp || '').trim(),
          requestedByEmail: currentUser?.email?.toLowerCase() || '',
          status: REQUEST_STATUS.PENDING,
          trackingCode: code,
          votes: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Write main request to Firestore
        const newDocRef = await addDoc(collection(db, 'requests'), requestData);

        // Also write sensitive contact info to private subcollection for admin-only security
        if (data.contactWhatsApp || data.shopeeUsername) {
          await setDoc(doc(db, 'requests', newDocRef.id, 'private', 'contact'), {
            contactWhatsApp: (data.contactWhatsApp || '').trim(),
            shopeeUsername: (data.shopeeUsername || '').trim(),
            email: currentUser?.email || '',
          });
        }

        try {
          trackGameRequest(cleanTitle);
        } catch {
          // ignore tracking error
        }

        setTrackingCode(code);
        localStorage.setItem('mygameon_last_tracking_code', code);
        setSubmitStatus('success');
      }

      localStorage.setItem('mygameon_last_req', Date.now().toString());
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build WhatsApp URL with Ticket Code prefilled
  const waNotifyUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya baru saja request game PC:\n- Judul Game: ${submittedTitle}\n- Nomor Tiket: ${trackingCode}\nMohon bantuannya untuk diproses ya min! Terima kasih.`,
  });

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black font-sans antialiased">
      <Seo
        title="Request Game PC — MyGameON"
        description="Game PC favoritmu belum ada di etalase? Kirim request judul game sekarang. Dapatkan kode tiket resmi untuk memantau status pengerjaan secara real-time."
        path="/request-game"
      />

      {/* 1. Header Navigation */}
      <LandingNavbar />

      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,209,0,0.05),transparent_50%)]" />

      {/* 2. Main Content */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Top Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Gamepad2 size={14} className="text-amber-400" />
            <span>Layanan Request Game Cloud</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Request Judul Game <span className="text-amber-400">Favoritmu</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-2 leading-relaxed">
            Belum menemukan game yang kamu cari di katalog? Kirimkan judulnya di sini. Kami akan mencarikan installer terbaik, menguji kestabilannya, dan mengunggahnya ke Google Drive resmi.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs">
            <Link
              to="/request-status"
              className="font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
            >
              <Search size={13} />
              <span>Sudah punya tiket? Cek status di sini →</span>
            </Link>
          </div>
        </div>

        {/* ── CARD: FORM / HASIL SUBMIT ── */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0F17] shadow-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden">
          
          {/* STATE SUCCESS / VOTED: TAMPILAN TIKET */}
          {submitStatus === 'success' || submitStatus === 'voted' ? (
            <div className="py-6 sm:py-8 text-center max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                {submitStatus === 'voted' ? <ThumbsUp size={32} /> : <CheckCircle2 size={32} />}
              </div>

              <div>
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  {submitStatus === 'voted' ? 'Vote Berhasil Ditambahkan!' : 'Request Berhasil Diterima!'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-2">
                  {submittedTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {submitStatus === 'voted'
                    ? 'Game ini sebelumnya sudah pernah direquest gamer lain. Vote kamu otomatis menaikkan prioritas pengerjaan di antrean kami.'
                    : 'Request kamu telah masuk ke sistem antrean admin. Simpan nomor tiket di bawah untuk memantau progresnya.'}
                </p>
              </div>

              {/* Ticket Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#06080C] border border-amber-400/30 shadow-inner text-center">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Nomor Tiket Pelacakan Resmi
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-wider">
                    {trackingCode}
                  </span>
                  <button
                    onClick={copyTrackingCode}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
                    title="Salin Nomor Tiket"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                {copied && (
                  <p className="text-[11px] text-emerald-400 font-bold mt-1">
                    ✓ Kode tiket berhasil disalin ke clipboard!
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* 1. Track on Web */}
                <Link
                  to={`/request-status?code=${trackingCode}`}
                  className="w-full py-3.5 px-6 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-[0.98]"
                >
                  <span>Pantau Status Pengerjaan di Web</span>
                  <ArrowRight size={16} />
                </Link>

                {/* 2. Send Ticket to WhatsApp Admin */}
                <a
                  href={waNotifyUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 px-6 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>Kirim Tiket ke WhatsApp Admin (Opsional)</span>
                </a>

                {/* 3. Reset Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSubmitStatus(null);
                    reset();
                  }}
                  className="text-xs text-slate-500 hover:text-slate-300 font-semibold underline pt-2"
                >
                  Request judul game lainnya
                </button>
              </div>
            </div>
          ) : (
            /* FORM INPUT REQUEST */
            <div>
              {/* Info banner */}
              <div className="p-4 rounded-2xl bg-[#070A10] border border-white/5 flex items-start gap-3 mb-6 text-xs text-slate-300 leading-relaxed">
                <Info size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Panduan Pengisian:</strong> Ketik judul game PC selengkap mungkin. Kami memprioritaskan game yang memiliki banyak vote dan peminat. Kamu dapat memantau kapan installer selesai diuji dan siap diunggah ke Google Drive.
                </div>
              </div>

              {/* Rate limit warning banner */}
              {submitStatus === 'rate_limit' && (
                <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-xs text-amber-300 flex items-center gap-2.5">
                  <Clock size={18} className="text-amber-400 shrink-0" />
                  <span>Kamu baru saja mengirim request. Harap tunggu 2 menit sebelum mengirim request berikutnya.</span>
                </div>
              )}

              {/* Error banner */}
              {submitStatus === 'error' && (
                <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400 flex items-center gap-2.5">
                  <AlertCircle size={18} className="text-rose-400 shrink-0" />
                  <span>Gagal memproses request. Periksa koneksi internet Anda dan coba lagi.</span>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Honeypot */}
                <input
                  type="text"
                  {...register('website_trap')}
                  tabIndex={-1}
                  autoComplete="off"
                  className="absolute opacity-0 h-0 w-0 -z-10"
                />

                {/* Field 1: Judul Game */}
                <div>
                  <label htmlFor="gameTitle" className="block text-xs font-bold text-slate-200 mb-1.5">
                    Judul Game Lengkap <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="gameTitle"
                      type="text"
                      {...register('gameTitle', {
                        required: 'Judul game wajib diisi',
                        minLength: { value: 3, message: 'Judul minimal 3 karakter' },
                        maxLength: { value: 90, message: 'Judul terlalu panjang' },
                      })}
                      placeholder="Contoh: Red Dead Redemption 2, God of War Ragnarok, Tekken 8"
                      className="w-full rounded-2xl border border-white/15 bg-[#07090E] text-white px-4 py-3 pl-11 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-medium"
                    />
                    <Gamepad2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.gameTitle && (
                    <p className="text-[11px] text-rose-400 mt-1 font-semibold">
                      {errors.gameTitle.message}
                    </p>
                  )}
                </div>

                {/* Field 2: Username Shopee (Opsional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="shopeeUsername" className="block text-xs font-bold text-slate-200">
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
                      {...register('shopeeUsername')}
                      placeholder="@username_shopee kamu"
                      className="w-full rounded-2xl border border-white/15 bg-[#07090E] text-white px-4 py-3 pl-11 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-mono"
                    />
                    <ShoppingBag className="w-4 h-4 text-orange-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Bantu kami mengidentifikasi akun tokomu untuk klaim voucher saat game selesai disiapkan.
                  </p>
                </div>

                {/* Field 3: Kontak WhatsApp (Opsional) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="contactWhatsApp" className="block text-xs font-bold text-slate-200">
                      Nomor WhatsApp Pembeli
                    </label>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Untuk Kabari Game Siap
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="contactWhatsApp"
                      type="tel"
                      {...register('contactWhatsApp')}
                      placeholder="0812xxxxxx atau 62812xxxxxx"
                      className="w-full rounded-2xl border border-white/15 bg-[#07090E] text-white px-4 py-3 pl-11 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all font-mono"
                    />
                    <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Admin akan mengirimkan link Google Drive secara privat via WA begitu game siap diunduh.
                  </p>
                </div>

                {/* Field 4: Catatan Tambahan (Opsional) */}
                <div>
                  <label htmlFor="notes" className="block text-xs font-bold text-slate-200 mb-1.5">
                    Catatan Tambahan (Opsional)
                  </label>
                  <div className="relative">
                    <textarea
                      id="notes"
                      rows={2}
                      {...register('notes')}
                      placeholder="Contoh: Butuh versi update terbaru v1.50 atau sertakan DLC lengkap..."
                      className="w-full rounded-2xl border border-white/15 bg-[#07090E] text-white px-4 py-3 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-[0.98] disabled:opacity-50 mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 text-slate-950" />
                      <span>Mencatat Antrean Request...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Kirim Request &amp; Dapatkan Nomor Tiket</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* 3. Guarantees & Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 text-center text-xs text-slate-400">
          <div className="p-4 rounded-2xl bg-[#090C12] border border-white/5">
            <div className="font-bold text-white mb-1 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Full Clean Installer</span>
            </div>
            <p className="text-[11px] text-slate-500">File bebas adware, malware, dan shortlink yang membingungkan.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#090C12] border border-white/5">
            <div className="font-bold text-white mb-1 flex items-center justify-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              <span>Transparan 4 Tahap</span>
            </div>
            <p className="text-[11px] text-slate-500">Pantau progres dari review, testing, hingga upload Google Drive.</p>
          </div>
          <div className="p-4 rounded-2xl bg-[#090C12] border border-white/5">
            <div className="font-bold text-white mb-1 flex items-center justify-center gap-1.5">
              <ThumbsUp size={14} className="text-cyan-400" />
              <span>Prioritas Vote</span>
            </div>
            <p className="text-[11px] text-slate-500">Game dengan permintaan terbanyak diproses lebih cepat oleh tim.</p>
          </div>
        </div>

      </main>

      {/* 4. Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} MyGameON • Layanan Request Game PC &amp; Purnajual</p>
      </footer>
    </div>
  );
};

export default RequestGamePage;
