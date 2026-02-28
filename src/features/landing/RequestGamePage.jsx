import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShoppingBag,
  ThumbsUp,
  Info,
  Clock,
  Copy,
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
import { useAuth } from '../../contexts/AuthContext';
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
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'voted' | 'error' | 'rate_limit'
  const [trackingCode, setTrackingCode] = useState('');

  const createTrackingCode = () => {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    return `RQ-${seed.slice(-6).toUpperCase()}`;
  };

  const copyTrackingCode = async () => {
    if (!trackingCode) return;
    await navigator.clipboard.writeText(trackingCode);
  };

  const { currentUser } = useAuth() || { currentUser: null };

  const onSubmit = async (data) => {
    // --- SECURITY CHECK 1: HONEYPOT (Anti-Bot) ---
    // Field 'website_trap' disembunyikan via CSS. Manusia tidak akan mengisinya.
    // Jika terisi, berarti itu Bot autfill.
    if (data.website_trap) {
      console.warn('Bot detected via honeypot.');
      // Fake success: Biarkan bot mengira sukses agar tidak mencoba lagi
      setSubmitStatus('success');
      reset();
      return;
    }

    // --- SECURITY CHECK 2: RATE LIMITING (Anti-Spam) ---
    // Mencegah user mengirim request bertubi-tubi (Flood).
    // Batas: 1 Request per 2 menit (120000 ms)
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
      // Validasi manual ekstra
      if (cleanTitle.length < 3) throw new Error('Judul terlalu pendek');

      const titleLower = cleanTitle.toLowerCase();

      // 1. CEK DUPLIKASI
      const q = query(
        collection(db, 'requests'),
        where('title_lower', '==', titleLower),
        where('status', 'in', REQUEST_ACTIVE_STATUSES)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // SKENARIO A: SUDAH ADA (VOTE)
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
        // SKENARIO B: BELUM ADA (BUAT BARU)
        let displayName = 'Anonymous';
        let source = 'web_user';

        if (currentUser) {
          displayName = currentUser.email.split('@')[0];
          source = 'web_user_logged_in';
        } else {
          // Sanitasi username shopee (hapus karakter aneh)
          const cleanShopee = data.shopeeUsername.replace(
            /[^a-zA-Z0-9_.-]/g,
            ''
          );
          displayName = `Shopee: ${cleanShopee}`;
          source = 'shopee';
        }

        const code = createTrackingCode();
        const requestData = {
          title: cleanTitle,
          title_lower: titleLower,

          platform: 'PC',
          notes: '',

          requesterName: displayName,
          source: source,
          userId: currentUser ? currentUser.uid : 'anonymous',

          status: REQUEST_STATUS.PENDING,
          isUrgent: false,
          isRdpBatch: false,
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

      // Catat waktu sukses submit ke LocalStorage untuk Rate Limiting
      localStorage.setItem('mygameon_last_req', Date.now().toString());

      reset();
      setTimeout(() => setSubmitStatus(null), 5000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111317]">
      <nav className="bg-[#111317] border-b border-[#2A2F39] px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-[#9CA3AF] hover:text-[#F3F4F6] transition-colors font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Kembali ke Beranda
          </Link>
          <span className="text-[#9CA3AF] text-sm font-medium">
            MyGameOn Request
          </span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-[#1A1F27] rounded-2xl shadow-sm border border-[#2A2F39] overflow-hidden">
          <div className="p-8 border-b border-[#2A2F39] bg-[linear-gradient(135deg,#1A1F27_0%,#151920_100%)] text-[#F3F4F6]">
            <h1 className="text-3xl font-bold mb-2">
              Game yang Kamu Cari Belum Ada?
            </h1>
            <p className="text-[#C8CFDA]">
              Isi form singkat, request kamu akan kami review dan diproses jika
              file tersedia.
            </p>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              Tidak perlu login. Proses cepat. Status request jelas.
            </p>
          </div>

          <div className="p-8">
            {/* --- DISCLAIMER BOX --- */}
            <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-4 mb-8 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#FFD100] flex-shrink-0 mt-0.5" />
              <div className="text-sm text-[#C8CFDA]">
                <p className="font-bold mb-1">Mohon Perhatian:</p>
                <ul className="list-disc list-inside space-y-1 opacity-90 text-xs sm:text-sm">
                  <li>
                    Pastikan penulisan <b>Judul Game</b> benar dan tidak typo.
                  </li>
                  <li>
                    Gunakan nama lengkap (contoh:{' '}
                    <i>&quot;Resident Evil 4&quot;</i> bukan{' '}
                    <i>&quot;RE4&quot;</i>).
                  </li>
                  <li>
                    Request dengan nama yang salah/typo berpotensi{' '}
                    <b>tidak tersedia</b> saat direview.
                  </li>
                </ul>
              </div>
            </div>

            {/* NOTIFIKASI SUKSES */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center animate-in fade-in slide-in-from-top-4">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Request Berhasil Dikirim.</p>
                  <p className="text-sm opacity-90">
                    Simpan kode tracking untuk memantau progres request kamu.
                  </p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Tracking Code:</span>{' '}
                    <span className="font-bold">{trackingCode || '-'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={copyTrackingCode}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-white text-green-700 border border-green-200 text-xs font-semibold"
                    >
                      <Copy size={14} className="mr-1" /> Copy Kode
                    </button>
                    {trackingCode && (
                      <Link
                        to={`/request-status?code=${trackingCode}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-700 text-white text-xs font-semibold"
                      >
                        Cek Status Sekarang
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFIKASI VOTE */}
            {submitStatus === 'voted' && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-center animate-in fade-in slide-in-from-top-4">
                <ThumbsUp className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">
                    Request Ditambahkan ke Antrian!
                  </p>
                  <p className="text-sm opacity-90">
                    Game ini sudah ada di daftar request. Kami menambahkan +1
                    vote dukunganmu.
                  </p>
                  {trackingCode && (
                    <div className="mt-2">
                      <Link
                        to={`/request-status?code=${trackingCode}`}
                        className="text-xs font-semibold underline"
                      >
                        Cek Status Request dengan Kode: {trackingCode}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NOTIFIKASI RATE LIMIT (BARU) */}
            {submitStatus === 'rate_limit' && (
              <div className="mb-6 p-4 bg-amber-50 text-amber-700 rounded-xl flex items-center animate-in fade-in slide-in-from-top-4">
                <Clock className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Tunggu Sebentar!</p>
                  <p className="text-sm opacity-90">
                    Kamu baru saja mengirim request. Mohon tunggu 2 menit
                    sebelum mengirim lagi.
                  </p>
                </div>
              </div>
            )}

            {/* NOTIFIKASI ERROR */}
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Gagal Mengirim</p>
                  <p className="text-sm opacity-90">
                    Terjadi kesalahan koneksi. Coba lagi nanti.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* --- HONEYPOT FIELD (HIDDEN) --- */}
              {/* Input ini tidak terlihat user. Jika diisi (oleh bot), submit akan ditolak. */}
              <input
                type="text"
                {...register('website_trap')}
                tabIndex={-1}
                autoComplete="off"
                style={{
                  display: 'none',
                  position: 'absolute',
                  opacity: 0,
                  height: 0,
                  width: 0,
                  zIndex: -1,
                }}
              />

              <div>
                <label className="block text-sm font-semibold text-[#C8CFDA] mb-2">
                  Username Shopee *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShoppingBag className="h-5 w-5 text-[#9CA3AF]" />
                  </div>
                  <input
                    type="text"
                    {...register('shopeeUsername', {
                      required: 'Username Shopee wajib diisi',
                      maxLength: {
                        value: 30,
                        message: 'Username terlalu panjang (maks 30)',
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9_.-]+$/,
                        message: 'Username mengandung karakter tidak valid',
                      },
                    })}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-[#2F3643] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100]/50 transition-all outline-none"
                    placeholder="Contoh: user123_shop"
                  />
                </div>
                {errors.shopeeUsername && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.shopeeUsername.message}
                  </span>
                )}
                <p className="text-xs text-[#9CA3AF] mt-1">
                  Kami akan menghubungi via Shopee jika game tersedia.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#C8CFDA] mb-2">
                  Judul Game PC yang Dicari *
                </label>
                <input
                  type="text"
                  {...register('gameTitle', {
                    required: 'Judul game wajib diisi',
                    minLength: { value: 3, message: 'Judul terlalu pendek' },
                    maxLength: {
                      value: 50,
                      message: 'Judul terlalu panjang (maks 50)',
                    },
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-[#2F3643] bg-[#111317] text-[#F3F4F6] focus:ring-2 focus:ring-[#FFD100]/50 focus:border-[#FFD100]/50 transition-all outline-none"
                  placeholder="Contoh: Tekken 8, Cyberpunk 2077..."
                />
                {errors.gameTitle && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.gameTitle.message}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#FFD100] hover:brightness-95 text-[#111317] font-bold rounded-xl shadow-lg shadow-[#000]/20 active:transform active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />{' '}
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" /> Kirim Request
                  </>
                )}
              </button>
              <p className="text-xs text-[#9CA3AF] text-center">
                Request diproses sesuai ketersediaan file.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestGamePage;
