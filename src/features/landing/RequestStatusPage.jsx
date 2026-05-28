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
import PageShell from './components/PageShell';

/* ── Timeline Step ───────────────────────────────────── */
const TimelineStep = ({ step, done, isCurrent, isLast }) => (
  <div className="flex gap-3.5">
    {/* Dot + line */}
    <div className="flex flex-col items-center w-5">
      <div
        className={`w-5 h-5 rounded-full grid place-items-center flex-shrink-0 transition-all duration-300 ${
          done
            ? isCurrent
              ? 'bg-accent-yellow'
              : 'bg-accent-yellow/[0.15]'
            : 'bg-bg-surface border border-border-muted'
        }`}
      >
        {done && (
          <Check
            className={`w-2.5 h-2.5 ${
              isCurrent ? 'text-bg-primary' : 'text-accent-yellow'
            }`}
            strokeWidth={3}
          />
        )}
      </div>
      {!isLast && (
        <div
          className={`w-px flex-1 min-h-[28px] ${
            done ? 'bg-accent-yellow/20' : 'bg-border-default'
          }`}
        />
      )}
    </div>
    {/* Text */}
    <div className={isLast ? '' : 'pb-5'}>
      <p
        className={`text-[13.5px] font-bold ${
          isCurrent
            ? 'text-accent-yellow'
            : done
              ? 'text-text-secondary'
              : 'text-text-ghost'
        }`}
      >
        {getRequestStatusLabel(step)}
      </p>
      <p
        className={`text-[11.5px] mt-0.5 ${
          done ? 'text-text-dim' : 'text-text-hidden'
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

  // Auto-lookup on mount if code provided
  useEffect(() => {
    if (queryCode || savedCode) {
      const bootCode = (queryCode || savedCode).toUpperCase();
      setCodeInput(bootCode);

      const runAutoLookup = async () => {
        setLoading(true);
        try {
          const q = query(
            collection(db, 'requests'),
            where('trackingCode', '==', bootCode)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            setRequestData({ id: snap.docs[0].id, ...snap.docs[0].data() });
          }
        } catch {
          // silent fail for auto-lookup
        } finally {
          setLoading(false);
        }
      };

      runAutoLookup();
    }
  }, [queryCode, savedCode]);

  const fetchStatus = async (e) => {
    e.preventDefault();
    if (!normalizedCode) {
      setError('Masukkan kode tracking terlebih dahulu.');
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
        setError('Kode tracking tidak ditemukan. Pastikan kode sudah benar.');
      } else {
        const doc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setRequestData(doc);
        localStorage.setItem('mygameon_last_tracking_code', normalizedCode);
      }
    } catch {
      setError('Terjadi kendala. Coba lagi beberapa saat.');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!requestData?.trackingCode) return;
    await navigator.clipboard.writeText(requestData.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  return (
    <PageShell title="Cek Status Request" maxWidth={580}>
      {/* Header */}
      <div className="slide-stagger-1 mb-8">
        <h1 className="text-[clamp(26px,3.5vw,36px)] font-black tracking-[-1.2px] leading-[1.1] mb-2.5">
          Cek Status <span className="text-accent-yellow">Request</span>
        </h1>
        <p className="text-text-dim text-[14px] leading-relaxed">
          Masukkan kode tracking untuk melihat progres request game kamu.
        </p>
      </div>

      {/* Search card */}
      <div className="slide-stagger-2 bg-bg-secondary border border-border-default rounded-2xl p-[22px] mb-5">
        <form onSubmit={fetchStatus} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-text-faint pointer-events-none" />
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="RQ-XXXXXX"
              className="w-full pl-10 pr-3.5 py-3 rounded-[10px] bg-bg-secondary border border-border-default text-[13.5px] text-text-primary placeholder-text-faint focus:outline-none focus:ring-2 focus:ring-accent-yellow/30 focus:border-accent-yellow/40 transition-colors font-mono tracking-wider"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-yellow px-5 py-3 bg-accent-yellow text-bg-primary border-none rounded-[10px] text-[13px] font-extrabold cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Cek Status'
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-3.5 px-3.5 py-3 bg-accent-red/[0.06] border border-accent-red/[0.15] rounded-[10px] text-[12.5px] text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Result card */}
      {requestData && (
        <div className="bg-bg-secondary border border-border-default rounded-2xl overflow-hidden animate-slide-in">
          {/* Title bar */}
          <div className="flex justify-between items-center flex-wrap gap-3 px-[22px] py-[18px] border-b border-bg-surface">
            <div>
              <h2 className="text-[18px] font-extrabold text-text-primary mb-1">
                {requestData.title || 'Tanpa Judul'}
              </h2>
              <p className="text-[12px] text-text-dim">
                Status:{' '}
                <span className="text-accent-yellow font-bold">
                  {getRequestStatusLabel(currentStatus)}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="flex items-center gap-1.5 bg-bg-primary border border-border-subtle rounded-lg px-3 py-1.5 cursor-pointer text-text-tertiary text-[11px] font-bold font-mono transition-colors hover:border-accent-yellow hover:text-accent-yellow"
            >
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              {requestData.trackingCode}
            </button>
          </div>

          {/* Shopee link (completed) */}
          {isCompleted && requestData.shopeeProductUrl && (
            <div className="px-[22px] py-3.5 border-b border-bg-surface">
              <a
                href={requestData.shopeeProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-yellow flex items-center justify-center gap-2 w-full bg-accent-yellow text-bg-primary py-3.5 rounded-xl font-extrabold text-[14px] no-underline"
              >
                <ShoppingCart className="w-4 h-4" />
                Beli di Shopee
              </a>
            </div>
          )}

          {/* Rejected */}
          {isRejected && (
            <div className="mx-[22px] mt-[18px] p-4 bg-accent-red/[0.06] border border-accent-red/[0.15] rounded-[10px]">
              <div className="flex gap-3 items-start">
                <XCircle className="w-[18px] h-[18px] text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px] font-bold text-red-400 mb-1">
                    Tidak Tersedia
                  </p>
                  <p className="text-[11.5px] text-text-dim">
                    {getRequestStatusDescription(REQUEST_STATUS.REJECTED)}
                  </p>
                  {requestData.rejectionNote && (
                    <p className="text-[11.5px] text-text-tertiary mt-2 italic">
                      &ldquo;{requestData.rejectionNote}&rdquo;
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          {!isRejected && (
            <div className="p-[22px]">
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
          )}

          {/* Footer note */}
          <div className="px-[22px] py-3.5 border-t border-bg-surface">
            <p className="text-[10px] text-text-hidden">
              Status diperbarui oleh admin. Kamu akan dihubungi via WhatsApp
              saat game tersedia.
            </p>
          </div>
        </div>
      )}

      {/* Bottom link */}
      <div className="slide-stagger-3 mt-6 text-center">
        <Link
          to="/request-game"
          className="text-[12.5px] text-text-faint font-semibold no-underline transition-colors hover:text-accent-yellow"
        >
          Belum punya kode? Request game dulu →
        </Link>
      </div>
    </PageShell>
  );
};

export default RequestStatusPage;
