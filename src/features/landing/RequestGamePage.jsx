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

const RequestGamePage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'voted' | 'error' | 'rate_limit'

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

    try {
      const cleanTitle = data.gameTitle.trim();
      // Validasi manual ekstra
      if (cleanTitle.length < 3) throw new Error('Judul terlalu pendek');

      const titleLower = cleanTitle.toLowerCase();

      // 1. CEK DUPLIKASI
      const q = query(
        collection(db, 'requests'),
        where('title_lower', '==', titleLower),
        where('status', 'in', ['pending', 'queued', 'processing', 'uploaded'])
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // SKENARIO A: SUDAH ADA (VOTE)
        const existingDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, 'requests', existingDoc.id), {
          votes: increment(1),
          updatedAt: serverTimestamp(),
        });
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

        const requestData = {
          title: cleanTitle,
          title_lower: titleLower,

          platform: 'PC',
          notes: '',

          requesterName: displayName,
          source: source,
          userId: currentUser ? currentUser.uid : 'anonymous',

          status: 'pending',
          isUrgent: false,
          isRdpBatch: false,

          votes: 1,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await addDoc(collection(db, 'requests'), requestData);
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
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft size={20} className="mr-2" />
            Kembali ke Beranda
          </Link>
          <span className="text-slate-400 text-sm font-medium">
            MyGameOn Request
          </span>
        </div>
      </nav>

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
            <h1 className="text-3xl font-bold mb-2">Request Game PC</h1>
            <p className="text-blue-100">
              Isi form di bawah untuk request game PC via Shopee.
            </p>
          </div>

          <div className="p-8">
            {/* --- DISCLAIMER BOX --- */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
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
                    <b>ditolak</b> oleh Admin.
                  </li>
                </ul>
              </div>
            </div>

            {/* NOTIFIKASI SUKSES */}
            {submitStatus === 'success' && (
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center animate-in fade-in slide-in-from-top-4">
                <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Permintaan Terkirim!</p>
                  <p className="text-sm opacity-90">
                    Terima kasih! Pantau notifikasi Shopee kamu ya.
                  </p>
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
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username Shopee *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <ShoppingBag className="h-5 w-5 text-slate-400" />
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
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="Contoh: user123_shop"
                  />
                </div>
                {errors.shopeeUsername && (
                  <span className="text-red-500 text-sm mt-1">
                    {errors.shopeeUsername.message}
                  </span>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Kami akan menghubungi via Shopee jika game tersedia.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Judul Game PC yang Dicari *
                </label>
                <input
                  type="text"
                  {...register('gameTitle', {
                    required: 'Judul game wajib diisi',
                    minLength: { value: 3, message: 'Judul terlalu pendek' },
                    maxLength: {
                      value: 50,
                      message: 'Judul terlalu panjang (maks 100)',
                    },
                  })}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 active:transform active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
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
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestGamePage;
