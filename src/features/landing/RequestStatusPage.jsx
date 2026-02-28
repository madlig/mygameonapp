import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ArrowLeft, Search, Copy, CheckCircle2, Circle } from 'lucide-react';
import { db } from '../../config/firebaseConfig';
import {
  getRequestStatusDescription,
  getRequestStatusLabel,
  REQUEST_PUBLIC_TIMELINE_STEPS,
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

  useEffect(() => {
    if (queryCode || savedCode) {
      const bootCode = (queryCode || savedCode).toUpperCase();
      setCodeInput(bootCode);

      const runAutoLookup = async () => {
        try {
          const q = query(
            collection(db, 'requests'),
            where('trackingCode', '==', bootCode)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const requestDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
            setRequestData(requestDoc);
          }
        } catch {
          // no-op for auto lookup
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
        setError(
          'Kode tracking tidak ditemukan. Pastikan kamu memasukkan kode yang benar.'
        );
      } else {
        const requestDoc = { id: snap.docs[0].id, ...snap.docs[0].data() };
        setRequestData(requestDoc);
        localStorage.setItem('mygameon_last_tracking_code', normalizedCode);
      }
    } catch {
      setError(
        'Terjadi kendala saat mengambil status request. Coba lagi beberapa saat.'
      );
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async () => {
    if (!requestData?.trackingCode) return;
    await navigator.clipboard.writeText(requestData.trackingCode);
  };

  const currentStatus = requestData?.status || REQUEST_STATUS.PENDING;
  const statusIndex = REQUEST_PUBLIC_TIMELINE_STEPS.indexOf(currentStatus);
  const isNotAvailable = currentStatus === REQUEST_STATUS.NOT_AVAILABLE;

  return (
    <div className="min-h-screen bg-[#111317] text-[#F3F4F6]">
      <nav className="border-b border-[#2A2F39] px-4 py-3 sticky top-0 z-10 bg-[#111317]/90 backdrop-blur">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Kembali ke Beranda
          </Link>
          <span className="text-[#9CA3AF] text-sm font-medium">
            Tracking Request
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden">
          <div className="p-8 border-b border-[#2A2F39] bg-[linear-gradient(135deg,#1A1F27_0%,#151920_100%)]">
            <h1 className="text-3xl font-bold">Cek Status Request Kamu</h1>
            <p className="text-[#9CA3AF] mt-2">
              Masukkan kode tracking untuk melihat progres terbaru request.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <form onSubmit={fetchStatus} className="space-y-3">
              <label className="block text-sm font-semibold text-[#C8CFDA]">
                Kode Tracking
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
                    size={16}
                  />
                  <input
                    type="text"
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Contoh: RQ-7F3A21"
                    className="w-full pl-9 pr-4 py-3 rounded-lg border border-[#2F3643] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100]/50 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-lg bg-[#FFD100] text-[#111317] font-bold hover:brightness-95 disabled:opacity-60"
                >
                  {loading ? 'Memproses...' : 'Lihat Status'}
                </button>
              </div>
            </form>

            {error && (
              <div className="rounded-lg border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {requestData && (
              <div className="space-y-5 rounded-xl border border-[#2A2F39] bg-[#111317] p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2F39] pb-4">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">Request ditemukan</p>
                    <h2 className="text-lg font-bold">
                      {requestData.title || 'Tanpa Judul'}
                    </h2>
                    <p className="text-sm text-[#9CA3AF] mt-1">
                      Status saat ini:{' '}
                      <span className="text-[#FFD100] font-semibold">
                        {getRequestStatusLabel(currentStatus)}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={copyCode}
                    className="inline-flex items-center gap-2 rounded-md border border-[#2F3643] bg-[#1A1F27] px-3 py-2 text-xs font-semibold text-[#C8CFDA] hover:text-[#F3F4F6]"
                  >
                    <Copy size={14} /> Copy Kode
                  </button>
                </div>

                <div className="rounded-lg border border-[#2A2F39] bg-[#1A1F27] px-4 py-3 text-sm">
                  <span className="text-[#9CA3AF]">Tracking Code:</span>{' '}
                  <span className="font-bold text-[#FFD100]">
                    {requestData.trackingCode || '-'}
                  </span>
                </div>

                {!isNotAvailable ? (
                  <div className="space-y-3">
                    {REQUEST_PUBLIC_TIMELINE_STEPS.map((step, index) => {
                      const done = statusIndex >= index;
                      return (
                        <div key={step} className="flex items-start gap-3">
                          <div className="mt-0.5 text-[#FFD100]">
                            {done ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <Circle size={18} className="text-[#4B5563]" />
                            )}
                          </div>
                          <div>
                            <p
                              className={`text-sm font-semibold ${done ? 'text-[#F3F4F6]' : 'text-[#9CA3AF]'}`}
                            >
                              {getRequestStatusLabel(step)}
                            </p>
                            <p className="text-xs text-[#9CA3AF]">
                              {getRequestStatusDescription(step)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                    {getRequestStatusDescription(REQUEST_STATUS.NOT_AVAILABLE)}
                  </div>
                )}

                <p className="text-xs text-[#9CA3AF]">
                  Request diproses sesuai ketersediaan file.
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
