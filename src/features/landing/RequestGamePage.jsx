import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
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
import PageShell from './components/PageShell';
import Seo from '../../components/common/Seo';
import { trackGameRequest } from '../../utils/metaPixel';

/* ── Shared input class ──────────────────────────────── */
const inputCls =
  'w-full px-3.5 py-3 rounded-[10px] bg-bg-secondary border border-border-default text-[13.5px] text-text-primary placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-accent-yellow/30 focus:border-accent-yellow/40 transition-colors font-[inherit]';

/* ── InputField ──────────────────────────────────────── */
const InputField = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-[13px] font-bold text-text-muted mb-1.5">
      {label} {required && <span className="text-accent-red">*</span>}
    </label>
    {children}
    {error && <p className="text-accent-red text-[11px] mt-1">{error}</p>}
    {hint && !error && (
      <p className="text-text-ghost text-[11px] mt-1">{hint}</p>
    )}
  </div>
);

/* ── Notification Banners ────────────────────────────── */
const SuccessBanner = ({ trackingCode, onCopy }) => (
  <div className="mx-[22px] mt-[18px] p-4 bg-accent-emerald/[0.08] border border-accent-emerald/20 rounded-xl flex gap-3 items-start">
    <CheckCircle2 className="w-[18px] h-[18px] text-accent-emerald flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-[13px] font-bold text-accent-emerald mb-1">
        Request Berhasil Dikirim!
      </p>
      <p className="text-[11.5px] text-text-dim mb-2">
        Simpan kode tracking untuk cek progres:
      </p>
      <div className="flex items-center gap-2">
        <span className="font-mono font-extrabold text-accent-yellow text-[15px] tracking-wide">
          {trackingCode}
        </span>
        <button
          type="button"
          onClick={onCopy}
          className="bg-accent-emerald/[0.12] border-none rounded-md px-2 py-1 cursor-pointer text-accent-emerald text-[10px] font-bold hover:bg-accent-emerald/20 transition-colors"
        >
          <Copy className="w-3 h-3" />
        </button>
      </div>
      {trackingCode && (
        <Link
          to={`/request-status?code=${trackingCode}`}
          className="inline-block mt-2 text-[11.5px] font-bold text-accent-yellow no-underline hover:underline"
        >
          Cek Status →
        </Link>
      )}
    </div>
  </div>
);

const VotedBanner = ({ trackingCode }) => (
  <div className="mx-[22px] mt-[18px] p-4 bg-accent-cyan/[0.08] border border-accent-cyan/20 rounded-xl flex gap-3 items-start">
    <ThumbsUp className="w-[18px] h-[18px] text-accent-cyan flex-shrink-0 mt-0.5" />
    <div>
      <p className="text-[13px] font-bold text-accent-cyan mb-1">
        +1 Vote Ditambahkan!
      </p>
      <p className="text-[11.5px] text-text-dim">
        Game ini sudah direquest sebelumnya. Vote kamu membantu memprioritaskan.
      </p>
      {trackingCode && (
        <Link
          to={`/request-status?code=${trackingCode}`}
          className="inline-block mt-2 text-[11.5px] font-bold text-accent-yellow no-underline hover:underline"
        >
          Cek Status: {trackingCode} →
        </Link>
      )}
    </div>
  </div>
);

const RateLimitBanner = () => (
  <div className="mx-[22px] mt-[18px] p-4 bg-accent-orange/[0.08] border border-accent-orange/20 rounded-xl flex gap-3 items-center">
    <Clock className="w-[18px] h-[18px] text-accent-orange flex-shrink-0" />
    <p className="text-[13px] text-accent-orange">
      Tunggu 2 menit sebelum mengirim request lagi.
    </p>
  </div>
);

const ErrorBanner = () => (
  <div className="mx-[22px] mt-[18px] p-4 bg-accent-red/[0.08] border border-accent-red/20 rounded-xl flex gap-3 items-center">
    <AlertCircle className="w-[18px] h-[18px] text-accent-red flex-shrink-0" />
    <p className="text-[13px] text-accent-red">
      Gagal mengirim. Periksa koneksi dan coba lagi.
    </p>
  </div>
);

/* ── Request Game Page ───────────────────────────────── */
const RequestGamePage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [trackingCode, setTrackingCode] = useState('');

  const createTrackingCode = () => {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `RQ-${seed.slice(-6).toUpperCase()}`;
  };

  const copyTrackingCode = async () => {
    if (!trackingCode) return;
    await navigator.clipboard.writeText(trackingCode);
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
      Date.now() - parseInt(lastRequestTime) < COOLDOWN_PERIOD
    ) {
      setSubmitStatus('rate_limit');
      setTimeout(() => setSubmitStatus(null), 5000);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setTrackingCode('');

    try {
      const cleanTitle = data.gameTitle.trim();
      if (cleanTitle.length < 3) throw new Error('Judul terlalu pendek');

      const titleLower = cleanTitle.toLowerCase();

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
          status: REQUEST_STATUS.PENDING,
          trackingCode: code,
          votes: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        // Write main request (public-readable)
        const newDocRef = await addDoc(collection(db, 'requests'), requestData);

        // Write sensitive contact info to private sub-collection (admin-only read)
        await setDoc(doc(db, 'requests', newDocRef.id, 'private', 'contact'), {
          contactWhatsApp: data.contactWhatsApp.trim(),
          shopeeUsername: data.shopeeUsername.trim(),
        });
        trackGameRequest(data.gameTitle);
        setTrackingCode(code);
        localStorage.setItem('mygameon_last_tracking_code', code);
        setSubmitStatus('success');
      }

      localStorage.setItem('mygameon_last_req', Date.now().toString());
      reset();
      setTimeout(() => setSubmitStatus(null), 8000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell title="Request Game" maxWidth={520}>
      <Seo
        title="Request Game"
        description="Game yang kamu cari belum ada di katalog MyGameON? Isi form request — tanpa login, proses cepat, dan kami kabari via WhatsApp saat tersedia."
        path="/request-game"
      />
      {/* Header */}
      <div className="slide-stagger-1 mb-8">
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 bg-accent-purple/[0.08] border border-accent-purple/20 px-3.5 py-[5px] rounded-full mb-5">
          <span className="bg-accent-purple text-white text-[9px] font-extrabold px-2 py-[2px] rounded-full">
            FORM
          </span>
          <span className="text-accent-purple-light text-[11.5px] font-semibold">
            Tanpa login, proses cepat
          </span>
        </div>

        <h1 className="text-[clamp(26px,3.5vw,36px)] font-black tracking-[-1.2px] leading-[1.1] mb-2.5">
          Request Game <span className="text-accent-yellow">Baru</span>
        </h1>
        <p className="text-text-dim text-[14px] leading-relaxed">
          Game yang kamu cari belum ada di katalog? Isi form ini dan kami akan
          carikan.
        </p>
      </div>

      {/* Card */}
      <div className="slide-stagger-2 bg-bg-secondary border border-border-default rounded-[18px] overflow-hidden">
        {/* Info box */}
        <div className="flex gap-3 items-start px-[22px] py-[18px] border-b border-bg-surface">
          <div className="w-7 h-7 rounded-[7px] bg-accent-yellow/[0.08] border border-accent-yellow/[0.15] grid place-items-center flex-shrink-0 mt-0.5">
            <Info className="w-3 h-3 text-accent-yellow" />
          </div>
          <p className="text-[11.5px] text-text-dim leading-relaxed">
            Tulis{' '}
            <strong className="text-text-tertiary">judul game lengkap</strong>{' '}
            (bukan singkatan). Jika game sudah pernah direquest, vote kamu akan
            ditambahkan. Kamu dihubungi via WhatsApp saat tersedia.
          </p>
        </div>

        {/* Status notifications */}
        {submitStatus === 'success' && (
          <SuccessBanner
            trackingCode={trackingCode}
            onCopy={copyTrackingCode}
          />
        )}
        {submitStatus === 'voted' && (
          <VotedBanner trackingCode={trackingCode} />
        )}
        {submitStatus === 'rate_limit' && <RateLimitBanner />}
        {submitStatus === 'error' && <ErrorBanner />}

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-[18px] p-[22px]"
        >
          {/* Honeypot */}
          <input
            type="text"
            {...register('website_trap')}
            tabIndex={-1}
            autoComplete="off"
            className="absolute opacity-0 h-0 w-0 -z-10"
          />

          {/* Game title */}
          <InputField
            label="Judul Game"
            required
            error={errors.gameTitle?.message}
            hint="Contoh: Cyberpunk 2077, Tekken 8"
          >
            <div className="relative">
              <Gamepad2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-text-faint pointer-events-none" />
              <input
                type="text"
                {...register('gameTitle', {
                  required: 'Judul game wajib diisi',
                  minLength: { value: 3, message: 'Judul terlalu pendek' },
                  maxLength: { value: 80, message: 'Judul terlalu panjang' },
                })}
                placeholder="Ketik judul game lengkap..."
                className={`${inputCls} !pl-10`}
              />
            </div>
          </InputField>

          {/* Shopee Username */}
          <InputField
            label="Username Shopee"
            required
            error={errors.shopeeUsername?.message}
          >
            <input
              type="text"
              {...register('shopeeUsername', {
                required: 'Username Shopee wajib diisi',
                maxLength: { value: 30, message: 'Username terlalu panjang' },
              })}
              placeholder="Username Shopee kamu"
              className={inputCls}
            />
          </InputField>

          {/* WhatsApp */}
          <InputField
            label="Nomor WhatsApp"
            required
            error={errors.contactWhatsApp?.message}
            hint="Kami kirim link produk Shopee via WA saat game tersedia"
          >
            <div className="relative">
              <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-text-faint pointer-events-none" />
              <input
                type="text"
                {...register('contactWhatsApp', {
                  required: 'Nomor WhatsApp wajib diisi',
                  minLength: { value: 9, message: 'Nomor terlalu pendek' },
                  maxLength: { value: 20, message: 'Nomor terlalu panjang' },
                  pattern: {
                    value: /^[0-9+\-\s]+$/,
                    message: 'Format nomor tidak valid',
                  },
                })}
                placeholder="08xxxxxxxxxx"
                className={`${inputCls} !pl-10`}
              />
            </div>
          </InputField>

          {/* Notes */}
          <InputField label="Catatan" hint="Versi tertentu, DLC, dll.">
            <textarea
              {...register('notes', {
                maxLength: { value: 200, message: 'Catatan terlalu panjang' },
              })}
              placeholder="Opsional..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </InputField>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-yellow w-full py-3.5 bg-accent-yellow text-bg-primary border-none rounded-xl text-[14px] font-extrabold cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Mengirim...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Kirim Request
              </>
            )}
          </button>
        </form>
      </div>

      {/* Bottom link */}
      <div className="slide-stagger-3 mt-5 text-center">
        <Link
          to="/request-status"
          className="text-[12.5px] text-text-faint font-semibold no-underline transition-colors hover:text-accent-yellow"
        >
          Sudah pernah request? Cek status di sini →
        </Link>
      </div>
    </PageShell>
  );
};

export default RequestGamePage;
