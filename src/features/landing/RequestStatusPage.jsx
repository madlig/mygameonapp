// src/features/landing/RequestStatusPage.jsx
//
// Public tracking page — customer checks request progress via tracking code.
// Simplified timeline: pending → reviewing → processing → completed (or rejected).
// Shows Shopee product link when completed.

import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  ArrowLeft,
  Search,
  Copy,
  CheckCircle2,
  Circle,
  ShoppingBag,
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

const RequestStatusPage = () => {
  const [searchParams] = useSearchParams();
  const queryCode = searchParams.get('code') || '';
  const savedCode = localStorage.getItem('mygameon_last_tracking_code') || '';

  const [codeInput, setCodeInput] = useState(queryCode || savedCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestData, setRequestData] = useState(null);

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
    <div className="min-h-screen bg-[#0D1117] text-[#F3F4F6]">
      <nav className="border-b border-[#2A2F39] px-4 py-3 sticky top-0 z-10 bg-[#111317]/90 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-[#7E8796] hover:text-[#F3F4F6] transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Link>
          <span className="text-[#7E8796] text-sm font-medium">
            Tracking Request
          </span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#2A2F39]">
            <h1 className="text-2xl sm:text-3xl font-bold">
              Cek Status Request
            </h1>
            <p className="text-[#7E8796] mt-2 text-sm">
              Masukkan kode tracking untuk melihat progres request kamu.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Search form */}
            <form onSubmit={fetchStatus} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]"
                    size={16}
                  />
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="RQ-XXXXXX"
                    className="w-full pl-9 pr-4 py-3 rounded-lg border border-[#2A2F39] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 outline-none font-mono text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-lg bg-[#FFD100] text-[#111317] font-bold hover:brightness-95 disabled:opacity-60 text-sm flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    'Cek Status'
                  )}
                </button>
              </div>
            </form>

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Result */}
            {requestData && (
              <div className="space-y-5 rounded-xl border border-[#2A2F39] bg-[#111317] p-5">
                {/* Title & status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#2A2F39]">
                  <div>
                    <h2 className="text-lg font-bold">
                      {requestData.title || 'Tanpa Judul'}
                    </h2>
                    <p className="text-sm text-[#7E8796] mt-1">
                      Status:{' '}
                      <span className="text-[#FFD100] font-semibold">
                        {getRequestStatusLabel(currentStatus)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 rounded-md border border-[#2A2F39] bg-[#1A1F27] px-3 py-2 text-xs font-semibold text-[#C8CFDA] hover:text-[#F3F4F6] transition-colors self-start"
                  >
                    <Copy size={12} /> {requestData.trackingCode}
                  </button>
                </div>

                {/* Shopee link (completed) */}
                {isCompleted && requestData.shopeeProductUrl && (
                  <a
                    href={requestData.shopeeProductUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#FFD100] px-4 py-3 text-sm font-bold text-[#111317] hover:brightness-95 transition-colors"
                  >
                    <ShoppingBag size={16} /> Beli di Shopee
                  </a>
                )}

                {/* Rejected message */}
                {isRejected && (
                  <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-300 flex items-start gap-3">
                    <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Tidak Tersedia</p>
                      <p className="text-xs text-red-400/80 mt-1">
                        {getRequestStatusDescription(REQUEST_STATUS.REJECTED)}
                      </p>
                      {requestData.rejectionNote && (
                        <p className="text-xs text-[#7E8796] mt-2 italic">
                          &ldquo;{requestData.rejectionNote}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline (only if not rejected) */}
                {!isRejected && (
                  <div className="space-y-0">
                    {timelineSteps.map((step, index) => {
                      const done = statusIndex >= index;
                      const isCurrent = statusIndex === index;
                      return (
                        <div key={step} className="flex items-start gap-3 py-3">
                          <div className="mt-0.5 flex-shrink-0">
                            {done ? (
                              <CheckCircle2
                                size={20}
                                className="text-[#FFD100]"
                              />
                            ) : (
                              <Circle size={20} className="text-[#2A2F39]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-semibold ${
                                done ? 'text-[#F3F4F6]' : 'text-[#4A5568]'
                              } ${isCurrent ? 'text-[#FFD100]' : ''}`}
                            >
                              {getRequestStatusLabel(step)}
                            </p>
                            <p
                              className={`text-xs mt-0.5 ${
                                done ? 'text-[#7E8796]' : 'text-[#4A5568]'
                              }`}
                            >
                              {getRequestStatusDescription(step)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Footer note */}
                <p className="text-[10px] text-[#4A5568] pt-2 border-t border-[#2A2F39]">
                  Status diperbarui oleh admin. Kamu akan dihubungi via WhatsApp
                  saat game tersedia.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestStatusPage;
