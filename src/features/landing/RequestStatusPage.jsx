// src/features/landing/RequestStatusPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Search,
  Copy,
  Check,
  ShoppingCart,
  XCircle,
  Loader2,
  Gamepad2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { db } from '../../config/firebaseConfig';
import {
  getRequestStatusDescription,
  getRequestStatusLabel,
  normalizeStatus,
  REQUEST_TIMELINE_STEPS,
  REQUEST_TIMELINE_RDP_STEPS,
  REQUEST_STATUS,
} from '../../shared/requestStatus';
import LandingNavbar from './components/LandingNavbar';
import Seo from '../../components/common/Seo';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../config/integrations';

/* ── Timeline Stepper Component ─────────────────────── */
const TimelineStep = ({ step, done, isCurrent, isLast }) => (
  <div className="flex gap-4">
    {/* Dot + Connecting Line */}
    <div className="flex flex-col items-center w-6 shrink-0">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 ${
          done
            ? isCurrent
              ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/20 shadow-lg shadow-amber-400/30'
              : 'bg-emerald-500 text-slate-950 font-bold'
            : 'bg-[#0E131E] border border-white/10 text-slate-600'
        }`}
      >
        {done ? (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-700" />
        )}
      </div>

      {!isLast && (
        <div
          className={`w-0.5 flex-1 min-h-[36px] my-1 transition-colors ${
            done ? 'bg-emerald-500/40' : 'bg-white/10'
          }`}
        />
      )}
    </div>

    {/* Text Description */}
    <div className={isLast ? '' : 'pb-6'}>
      <p
        className={`text-xs sm:text-sm font-black transition-colors ${
          isCurrent
            ? 'text-amber-400'
            : done
              ? 'text-slate-100'
              : 'text-slate-500'
        }`}
      >
        {getRequestStatusLabel(step)}
      </p>
      <p
        className={`text-xs mt-0.5 leading-relaxed ${
          done ? 'text-slate-400' : 'text-slate-600'
        }`}
      >
        {getRequestStatusDescription(step)}
      </p>
    </div>
  </div>
);

/* ── Request Status Page ─────────────────────────────── */
const RequestStatusPage = () => {
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || '';
  const savedCode = localStorage.getItem('mygameon_last_tracking_code') || '';

  const [codeInput, setCodeInput] = useState(queryCode || savedCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestData, setRequestData] = useState(null);
  const [copied, setCopied] = useState(false);

  const normalizedCode = useMemo(
    () => codeInput.trim().toUpperCase(),
    [codeInput]
  );

  // Auto-lookup on mount if query code or saved code exists
  useEffect(() => {
    const bootCode = (queryCode || savedCode).toUpperCase();
    if (bootCode) {
      setCodeInput(bootCode);

      const runAutoLookup = async () => {
        setLoading(true);
        setError('');
        try {
          const q = query(
            collection(db, 'requests'),
            where('trackingCode', '==', bootCode)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setRequestData({ id: snap.docs[0].id, ...snap.docs[0].data() });
          } else if (queryCode) {
            setError('Nomor tiket tidak ditemukan. Pastikan kode yang dimasukkan sudah benar.');
          }
        } catch {
          // silent fail on initial mount
        } finally {
          setLoading(false);
        }
      };

      runAutoLookup();
    }
  }, [queryCode, savedCode]);

  const fetchStatus = async (e) => {
    if (e) e.preventDefault();
    if (!normalizedCode) {
      setError('Masukkan nomor tiket pelacakan terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError('');
    setRequestData(null);

    try {
      const q = query(
        collection(db, 'requests'),
        where('trackingCode', '==', normalizedCode)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setError('Nomor tiket tidak ditemukan. Periksa kembali kombinasi huruf/angka (Contoh: RQ-XXXXXX).');
      } else {
        const docData = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setRequestData(docData);
        localStorage.setItem('mygameon_last_tracking_code', normalizedCode);
      }
    } catch (err) {
      console.error('Error fetching request status:', err);
      setError('Terjadi kendala koneksi saat memeriksa tiket. Coba lagi beberapa saat.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!requestData?.trackingCode) return;
    await navigator.clipboard.writeText(requestData.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentStatus = normalizeStatus(requestData?.status);
  const isRejected = currentStatus === REQUEST_STATUS.REJECTED;
  const isCompleted = currentStatus === REQUEST_STATUS.COMPLETED;
  const isRdp =
    requestData?.needsRdp === true || currentStatus === REQUEST_STATUS.QUEUED;
  const timelineSteps = isRdp
    ? REQUEST_TIMELINE_RDP_STEPS
    : REQUEST_TIMELINE_STEPS;
  const statusIndex = timelineSteps.indexOf(currentStatus);

  // Chat WA admin regarding this ticket
  const waCheckUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau menanyakan progres request game:\n- Judul: ${requestData?.title || 'Game'}\n- Nomor Tiket: ${requestData?.trackingCode || normalizedCode}\nApakah ada kendala dalam pengerjaannya min? Terima kasih.`,
  });

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black font-sans antialiased">
      <Seo
        title="Lacak Status Request Game — MyGameON"
        description="Pantau progres pengerjaan game yang kamu request di MyGameON. Masukkan kode tiket untuk melihat status real-time dari review hingga upload Google Drive."
        path="/request-status"
      />

      {/* 1. Navbar */}
      <LandingNavbar />

      {/* Ambient lighting */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,209,0,0.05),transparent_50%)]" />

      {/* 2. Main Content */}
      <main className="relative z-10 flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
            <Clock size={13} className="text-amber-400" />
            <span>Tracking Tiket Purnajual</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Lacak Status <span className="text-amber-400">Request Game</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Masukkan kode tiket pelacakan kamu (format: <span className="font-mono text-slate-300">RQ-XXXXXX</span>) untuk melihat tahapan pengerjaan saat ini.
          </p>
        </div>

        {/* ── SEARCH INPUT BOX ── */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0F17] p-4 sm:p-5 shadow-2xl mb-6">
          <form onSubmit={fetchStatus} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Masukkan Nomor Tiket (Contoh: RQ-A89F12)"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-[#06080C] border border-white/10 text-white placeholder:text-slate-600 text-xs sm:text-sm font-mono tracking-wider focus:outline-none focus:border-amber-400 transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !codeInput.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-95 disabled:opacity-50 shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-4 h-4 text-slate-950" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <>
                  <Search size={15} />
                  <span>Cek Progres Tiket</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-center gap-2 animate-in fade-in">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick chip for saved code */}
          {savedCode && !requestData && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-400">
              <span>Tiket Terakhir:</span>
              <button
                type="button"
                onClick={() => {
                  setCodeInput(savedCode);
                  fetchStatus();
                }}
                className="font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/25 px-2.5 py-0.5 rounded-lg hover:bg-amber-400/20 transition-colors"
              >
                {savedCode}
              </button>
            </div>
          )}
        </div>

        {/* ── RESULT CARD ── */}
        {requestData && (
          <div className="rounded-3xl border border-white/10 bg-[#0B0F17] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            
            {/* Header Result */}
            <div className="p-6 sm:p-7 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase font-mono">
                    Platform: {requestData.platform || 'PC Game'}
                  </span>
                  {requestData.votes > 1 && (
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                      <Flame size={12} />
                      <span>{requestData.votes} Gamer Meminta</span>
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {requestData.title || 'Judul Game'}
                </h2>
              </div>

              {/* Ticket Copy Button */}
              <button
                onClick={copyCode}
                className="flex items-center gap-2 bg-[#06080C] hover:bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-mono font-bold text-amber-400 transition-colors shrink-0"
                title="Salin Nomor Tiket"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{requestData.trackingCode}</span>
                {copied && <span className="text-[10px] text-emerald-400 font-sans">Tersalin!</span>}
              </button>
            </div>

            {/* ── STATUS CALLOUT ── */}
            <div className="p-6 sm:p-7 space-y-6">
              
              {/* COMPLETED BANNER */}
              {isCompleted && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm">
                        Game Sudah Siap &amp; Tersedia!
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        File installer dan link Google Drive resmi sudah aktif dan siap kamu dapatkan.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      to={`/katalog?search=${encodeURIComponent(requestData.title)}`}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                    >
                      <span>Buka di Katalog</span>
                      <ArrowRight size={14} />
                    </Link>
                    {requestData.shopeeProductUrl && (
                      <a
                        href={requestData.shopeeProductUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2.5 rounded-xl bg-shopee-orange hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-shopee-orange/20"
                      >
                        <ShoppingCart size={14} />
                        <span>Shopee</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* REJECTED BANNER */}
              {isRejected && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                  <XCircle size={22} className="text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      Request Belum Dapat Dipenuhi
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {getRequestStatusDescription(REQUEST_STATUS.REJECTED)}
                    </p>
                    {requestData.rejectionNote && (
                      <div className="mt-2.5 p-3 rounded-xl bg-[#06080C] border border-white/10 text-xs text-rose-300 font-mono">
                        Alasan: "{requestData.rejectionNote}"
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── STEPPER TIMELINE (Jika Tidak Ditolak) ── */}
              {!isRejected && (
                <div className="pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <Clock size={13} className="text-amber-400" />
                    <span>Tahapan Pengerjaan Saat Ini</span>
                  </h4>

                  <div className="space-y-1">
                    {timelineSteps.map((step, i) => (
                      <TimelineStep
                        key={step}
                        step={step}
                        done={statusIndex >= i}
                        isCurrent={statusIndex === i}
                        isLast={i === timelineSteps.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Notes if provided */}
              {requestData.notes && (
                <div className="p-4 rounded-2xl bg-[#07090E] border border-white/5 text-xs text-slate-400">
                  <strong className="text-slate-300">Catatan Peminta:</strong> "{requestData.notes}"
                </div>
              )}

              {/* Bottom Quick Help Contact */}
              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
                <span>Butuh konfirmasi cepat atau ada pertanyaan seputar game ini?</span>
                <a
                  href={waCheckUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 font-bold transition-colors"
                >
                  <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                  <span>Chat Admin dengan Tiket Ini</span>
                </a>
              </div>

            </div>
          </div>
        )}

        {/* Link back to new request */}
        <div className="mt-8 text-center">
          <Link
            to="/request-game"
            className="text-xs font-bold text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5"
          >
            <span>Mau request judul game baru lainnya? Klik di sini →</span>
          </Link>
        </div>

      </main>

      {/* 3. Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} MyGameON • Layanan Pelacakan Tiket Cloud Game</p>
      </footer>
    </div>
  );
};

export default RequestStatusPage;
