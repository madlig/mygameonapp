// src/features/landing/RequestGamePage.jsx
//
// Public form — customer requests a game they want.
// Simplified: just title + WhatsApp contact. No Shopee checkout flow.
// Duplicate detection: if same title already in active requests, adds +1 vote.
// Anti-bot: honeypot + rate limiting (1 req per 2 min).

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  Info,
  Clock,
  Copy,
  Gamepad2,
  MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  collection,
  addDoc,
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
          requesterName: data.contactName?.trim() || 'Anonymous',
          contactWhatsApp: data.contactWhatsApp.trim(),
          status: REQUEST_STATUS.PENDING,
          trackingCode: code,
          votes: 1,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'requests'), requestData);
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
    <div className="min-h-screen bg-[#0D1117]">
      <nav className="bg-[#111317] border-b border-[#2A2F39] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-[#7E8796] hover:text-[#F3F4F6] transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} className="mr-2" />
            Kembali
          </Link>
          <span className="text-[#7E8796] text-sm font-medium">
            Request Game
          </span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-[#1A1F27] rounded-2xl border border-[#2A2F39] overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-[#2A2F39]">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#F3F4F6] mb-2">
              Request Game
            </h1>
            <p className="text-[#7E8796] text-sm">
              Game yang kamu cari belum ada? Isi form ini dan kami akan carikan.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {/* Info box */}
            <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-4 mb-6 flex items-start gap-3">
              <Info className="w-4 h-4 text-[#FFD100] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#7E8796] space-y-1">
                <p>
                  Tulis <b className="text-[#C8CFDA]">judul game lengkap</b>{' '}
                  (bukan singkatan).
                </p>
                <p>
                  Jika game sudah pernah direquest orang lain, vote kamu akan
                  ditambahkan.
                </p>
                <p>Kamu akan dihubungi via WhatsApp saat game tersedia.</p>
              </div>
            </div>

            {/* Success notification */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm">
                    Request Berhasil Dikirim!
                  </p>
                  <p className="text-xs text-emerald-400/80 mt-1">
                    Simpan kode tracking untuk cek progres:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-mono font-bold text-[#FFD100] text-sm">
                      {trackingCode}
                    </span>
                    <button
                      type="button"
                      onClick={copyTrackingCode}
                      className="p-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 transition-colors"
                    >
                      <Copy size={12} />
                    </button>
                  </div>
                  {trackingCode && (
                    <Link
                      to={`/request-status?code=${trackingCode}`}
                      className="inline-block mt-2 text-xs font-semibold text-[#FFD100] hover:underline"
                    >
                      Cek Status →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Voted notification */}
            {submitStatus === 'voted' && (
              <div className="mb-6 p-4 bg-sky-500/10 border border-sky-500/25 text-sky-300 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
                <ThumbsUp className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-sm">+1 Vote Ditambahkan!</p>
                  <p className="text-xs text-sky-400/80 mt-1">
                    Game ini sudah direquest sebelumnya. Vote kamu membantu
                    memprioritaskan.
                  </p>
                  {trackingCode && (
                    <Link
                      to={`/request-status?code=${trackingCode}`}
                      className="inline-block mt-2 text-xs font-semibold text-[#FFD100] hover:underline"
                    >
                      Cek Status: {trackingCode} →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Rate limit notification */}
            {submitStatus === 'rate_limit' && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/25 text-amber-300 rounded-xl flex items-center gap-3">
                <Clock className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Tunggu 2 menit sebelum mengirim request lagi.
                </p>
              </div>
            )}

            {/* Error notification */}
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/25 text-red-300 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">
                  Gagal mengirim. Periksa koneksi dan coba lagi.
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Honeypot */}
              <input
                type="text"
                {...register('website_trap')}
                tabIndex={-1}
                autoComplete="off"
                style={{
                  position: 'absolute',
                  opacity: 0,
                  height: 0,
                  width: 0,
                  zIndex: -1,
                }}
              />

              {/* Game title */}
              <div>
                <label className="block text-sm font-semibold text-[#C8CFDA] mb-1.5">
                  Judul Game *
                </label>
                <div className="relative">
                  <Gamepad2
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]"
                    size={18}
                  />
                  <input
                    type="text"
                    {...register('gameTitle', {
                      required: 'Judul game wajib diisi',
                      minLength: { value: 3, message: 'Judul terlalu pendek' },
                      maxLength: {
                        value: 80,
                        message: 'Judul terlalu panjang',
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#2A2F39] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-all outline-none text-sm"
                    placeholder="Contoh: Cyberpunk 2077, Tekken 8..."
                  />
                </div>
                {errors.gameTitle && (
                  <span className="text-red-400 text-xs mt-1 block">
                    {errors.gameTitle.message}
                  </span>
                )}
              </div>

              {/* Contact name */}
              <div>
                <label className="block text-sm font-semibold text-[#C8CFDA] mb-1.5">
                  Nama Panggilan *
                </label>
                <input
                  type="text"
                  {...register('contactName', {
                    required: 'Nama wajib diisi',
                    maxLength: { value: 30, message: 'Nama terlalu panjang' },
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-[#2A2F39] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-all outline-none text-sm"
                  placeholder="Nama kamu"
                />
                {errors.contactName && (
                  <span className="text-red-400 text-xs mt-1 block">
                    {errors.contactName.message}
                  </span>
                )}
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-semibold text-[#C8CFDA] mb-1.5">
                  Nomor WhatsApp *
                </label>
                <div className="relative">
                  <MessageCircle
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5568]"
                    size={18}
                  />
                  <input
                    type="text"
                    {...register('contactWhatsApp', {
                      required: 'Nomor WhatsApp wajib diisi',
                      minLength: {
                        value: 9,
                        message: 'Nomor terlalu pendek',
                      },
                      maxLength: {
                        value: 20,
                        message: 'Nomor terlalu panjang',
                      },
                      pattern: {
                        value: /^[0-9+\-\s]+$/,
                        message: 'Format nomor tidak valid',
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#2A2F39] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-all outline-none text-sm"
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                {errors.contactWhatsApp && (
                  <span className="text-red-400 text-xs mt-1 block">
                    {errors.contactWhatsApp.message}
                  </span>
                )}
                <p className="text-[10px] text-[#4A5568] mt-1">
                  Kami kirim link produk Shopee via WhatsApp saat game tersedia.
                </p>
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-sm font-semibold text-[#C8CFDA] mb-1.5">
                  Catatan{' '}
                  <span className="text-[#4A5568] font-normal">(opsional)</span>
                </label>
                <textarea
                  {...register('notes', {
                    maxLength: {
                      value: 200,
                      message: 'Catatan terlalu panjang',
                    },
                  })}
                  rows="2"
                  className="w-full px-4 py-3 rounded-lg border border-[#2A2F39] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/40 focus:border-[#FFD100]/50 transition-all outline-none text-sm resize-none"
                  placeholder="Versi tertentu, DLC, dll..."
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[#FFD100] hover:brightness-95 text-[#111317] font-bold rounded-xl active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{' '}
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" /> Kirim Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestGamePage;
