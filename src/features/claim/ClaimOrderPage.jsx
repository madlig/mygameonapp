// src/features/claim/ClaimOrderPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, AlertCircle, Loader2, Send, 
  HelpCircle, ArrowLeft, Gamepad2, ShieldCheck, Mail, ExternalLink,
  ShoppingBag, Disc, MessageSquare, Copy, Check, Sparkles, FolderDown,
  Download, Clock, Info, UserCheck, Key
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { db, collection, addDoc, getDocs, query, where, serverTimestamp, setDoc, doc } from '../../config/firebaseConfig';
import n8nService from '../../services/api/n8nService';
import { buildWhatsAppUrl } from '../../config/integrations';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import Seo from '../../components/common/Seo';

const ClaimOrderPage = () => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [shopeeUsername, setShopeeUsername] = useState('');
  const [orderType, setOrderType] = useState('sims4'); // 'sims4' or 'pcgame'
  const [gameTitle, setGameTitle] = useState('');
  const [notes, setNotes] = useState('');
  
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fallbackWaUrl, setFallbackWaUrl] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Auto-fill from active auth session
  useEffect(() => {
    if (currentUser?.email && !email) {
      setEmail(currentUser.email);
    }
  }, [currentUser, email]);

  useEffect(() => {
    if (userProfile?.shopeeUsername && !shopeeUsername) {
      setShopeeUsername(userProfile.shopeeUsername);
    }
  }, [userProfile, shopeeUsername]);

  const copyLicenseKey = async () => {
    if (!successData?.orderId) return;
    try {
      await navigator.clipboard.writeText(successData.orderId);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanInvoice = orderId.trim().toUpperCase().replace(/\s+/g, '');
    const cleanEmail = email.trim().toLowerCase();
    const cleanShopee = shopeeUsername.trim().replace(/^@/, '');
    const cleanGameTitle = orderType === 'pcgame' ? (gameTitle.trim() || 'Game PC Digital') : 'The Sims 4 All DLCs';

    if (!cleanInvoice || cleanInvoice.length < 5) {
      setErrorMessage('Nomor Pesanan Shopee tidak valid (minimal 5 karakter).');
      setStatus('error');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Alamat Gmail wajib diisi dengan benar.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    setFallbackWaUrl('');

    try {
      // 1. Cek duplikasi klaim nomor pesanan di Firestore
      const claimsRef = collection(db, 'claims');
      const dupQuery = query(claimsRef, where('invoice', '==', cleanInvoice));
      const dupSnap = await getDocs(dupQuery);

      if (!dupSnap.empty) {
        const existingClaim = dupSnap.docs[0].data();
        const claimDate = existingClaim.createdAt?.seconds 
          ? new Date(existingClaim.createdAt.seconds * 1000).toLocaleDateString('id-ID')
          : 'sebelumnya';

        setErrorMessage(
          `Nomor pesanan ${cleanInvoice} sudah pernah diajukan klaim pada tanggal ${claimDate}. Silakan periksa inbox Gmail Anda atau hubungi admin via WhatsApp.`
        );
        const waDup = buildWhatsAppUrl({
          text: `Halo Admin MyGameON, saya ingin konfirmasi ulang klaim pesanan Shopee No: ${cleanInvoice} (Email: ${cleanEmail}).`,
        });
        setFallbackWaUrl(waDup);
        setStatus('error');
        return;
      }

      // 2. Simpan record klaim ke koleksi utama 'claims' di Firestore
      const claimPayload = {
        invoice: cleanInvoice,
        email: cleanEmail,
        orderType,
        gameTitle: cleanGameTitle,
        shopeeUsername: cleanShopee,
        notes: notes.trim(),
        userId: currentUser?.uid || null,
        userDisplayName: currentUser?.displayName || '',
        status: 'pending_verification', // 'pending_verification' | 'processed' | 'active'
        source: 'web_claim',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const newClaimDoc = await addDoc(claimsRef, claimPayload);

      // Jika user login, simpan juga sub-koleksi di users/{uid}/claims/{id} untuk sync offline
      if (currentUser?.uid) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'claims', newClaimDoc.id), {
            ...claimPayload,
            claimId: newClaimDoc.id,
          });
        } catch (subErr) {
          console.warn('Sub-claim sync warning:', subErr);
        }

        // Jika profile belum punya shopeeUsername tapi diinput saat klaim, update profil user
        if (cleanShopee && !userProfile?.shopeeUsername) {
          try {
            await updateUserProfile({ shopeeUsername: cleanShopee });
          } catch {
            // non-fatal
          }
        }
      }

      // 3. Dispatch ke webhook otomatisasi n8n (atau fallback WhatsApp jika belum aktif)
      let n8nResult;
      try {
        n8nResult = await n8nService.dispatchOrderClaim({
          invoice: cleanInvoice,
          email: cleanEmail,
          orderType,
          gameTitle: cleanGameTitle,
          shopeeUsername: cleanShopee,
        });
      } catch (n8nErr) {
        console.warn('n8n dispatch warning:', n8nErr);
      }

      const generatedWaUrl = (n8nResult && n8nResult.whatsappUrl) || buildWhatsAppUrl({
        text: `Halo Admin MyGameON, saya sudah mengajukan klaim pesanan Shopee di website:\n- No. Pesanan: ${cleanInvoice}\n- Email Gmail: ${cleanEmail}\n- Username Shopee: ${cleanShopee ? `@${cleanShopee}` : '-'}\n- Kategori: ${orderType === 'sims4' ? 'The Sims 4 Complete Edition' : cleanGameTitle}\n\nMohon bantu verifikasi dan aktivasi ya min. Terima kasih!`,
      });

      setSuccessData({
        orderId: cleanInvoice,
        email: cleanEmail,
        orderType,
        gameTitle: cleanGameTitle,
        shopeeUsername: cleanShopee,
        whatsappUrl: generatedWaUrl,
        claimId: newClaimDoc.id,
      });

      setStatus('success');
    } catch (err) {
      console.error('Claim order error:', err);
      const waFallback = buildWhatsAppUrl({
        text: `Halo Admin MyGameON, saya mengalami kendala saat klaim pesanan Shopee No: ${cleanInvoice}.\nEmail: ${cleanEmail}.\nMohon bantuannya ya min.`,
      });
      setFallbackWaUrl(waFallback);
      setErrorMessage(err.message || 'Sistem klaim sedang sibuk. Silakan konfirmasi via WhatsApp.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setOrderId('');
    setGameTitle('');
    setNotes('');
    setStatus('idle');
    setErrorMessage('');
    setFallbackWaUrl('');
    setSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-black">
      <Seo
        title="Klaim Pesanan Shopee — MyGameON"
        description="Klaim pesanan game PC dan license key The Sims 4 dari toko resmi Shopee MyGameON secara kilat tanpa antre."
      />
      
      {/* Top Navigation */}
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
            <span className="text-[11px] font-mono text-emerald-400 font-bold">Server Klaim Aktif</span>
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
              Masukkan Nomor Pesanan Shopee dan Gmail Anda untuk mendapatkan akses folder Google Drive resmi & License Key aktivasi kilat tanpa antre.
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

          {/* Card Form */}
          {status !== 'success' ? (
            <div className="bg-[#0b0d12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Order Type Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Pilih Kategori Produk yang Dipesan:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderType('sims4')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        orderType === 'sims4'
                          ? 'border-amber-400 bg-amber-400/10 text-white font-bold shadow-sm'
                          : 'border-white/5 bg-black/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${orderType === 'sims4' ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400'}`}>
                        <Disc size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">The Sims 4</div>
                        <div className="text-[10px] text-slate-400">Launcher & All DLCs</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('pcgame')}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        orderType === 'pcgame'
                          ? 'border-amber-400 bg-amber-400/10 text-white font-bold shadow-sm'
                          : 'border-white/5 bg-black/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${orderType === 'pcgame' ? 'bg-amber-400 text-slate-950' : 'bg-white/5 text-slate-400'}`}>
                        <Gamepad2 size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Game PC Lainnya</div>
                        <div className="text-[10px] text-slate-400">Direct Google Drive</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Shopee Order ID */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Nomor Pesanan Shopee <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Contoh: 2409146VXXXXXX"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors font-mono tracking-wider"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Salin dari rincian pesanan Shopee Anda (Status pesanan: <em>Sudah Dikirim</em>).
                  </p>
                </div>

                {/* Buyer Email */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Alamat Email (Gmail Aktif) <span className="text-amber-400">*</span>
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
                  <p className="text-[10px] text-slate-500 mt-1">
                    Folder Google Drive resmi akan dishare langsung ke alamat Gmail ini.
                  </p>
                </div>

                {/* Shopee Username (Optional for auto-match) */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Username Shopee (Opsional)
                  </label>
                  <input
                    type="text"
                    value={shopeeUsername}
                    onChange={(e) => setShopeeUsername(e.target.value)}
                    placeholder="Contoh: username_shopee"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Membantu admin memverifikasi pesanan Anda secara otomatis tanpa perlu kirim tangkapan layar.
                  </p>
                </div>

                {/* Optional: Game title if PC Game */}
                {orderType === 'pcgame' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                      Judul Game yang Dipesan <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder="Contoh: Black Myth Wukong / Spider-Man Remastered"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors"
                      required={orderType === 'pcgame'}
                    />
                  </div>
                )}

                {/* Catatan Tambahan (Opsional) */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Catatan Tambahan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Butuh bantuan remote TeamViewer / panduan install"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* Error Banner */}
                {status === 'error' && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex flex-col gap-2.5 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle size={17} className="shrink-0 text-red-400 mt-0.5" />
                      <span className="leading-relaxed">{errorMessage}</span>
                    </div>
                    {fallbackWaUrl && (
                      <div className="pt-2 border-t border-red-500/15">
                        <a
                          href={fallbackWaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors"
                        >
                          <MessageSquare size={14} />
                          <span>Hubungi Admin via WhatsApp Toko</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black py-3.5 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/15 disabled:opacity-50 text-sm"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-slate-950" />
                      <span>Sedang Mendaftarkan Klaim...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Klaim Akses Game Sekarang</span>
                    </>
                  )}
                </button>
              </form>

              {/* Guarantees */}
              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-6 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" /> Garansi Berhasil Main
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-400" /> Full Speed GDrive
                </span>
              </div>
            </div>
          ) : (
            /* SUCCESS STATE */
            <div className="bg-[#0b0d12] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold mb-3">
                <Sparkles size={12} />
                <span>Klaim Berhasil Dicatat</span>
              </span>

              <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                Klaim Pesanan Terdaftar!
              </h3>
              <p className="text-xs text-slate-300 mb-6 max-w-md mx-auto leading-relaxed">
                Pesanan <span className="font-mono text-amber-400 font-bold">{successData?.orderId}</span> telah berhasil dihubungkan ke email <span className="font-semibold text-white">{successData?.email}</span>.
              </p>

              {/* Specific Instructions: The Sims 4 vs PC Game */}
              {successData?.orderType === 'sims4' ? (
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

                  {/* Key Display & Copy */}
                  <div className="flex items-center justify-between gap-2 p-3 bg-black/60 rounded-xl border border-white/10 font-mono text-sm text-amber-300">
                    <span className="truncate tracking-wider font-bold">{successData?.orderId}</span>
                    <button
                      type="button"
                      onClick={copyLicenseKey}
                      className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey ? 'Tersalin' : 'Salin Key'}</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed pt-1">
                    <p><strong>Langkah Mudah Memulai:</strong></p>
                    <p className="text-slate-400 pl-3">
                      1. Download dan jalankan <strong>MyGameON Ultimate Launcher</strong>.<br />
                      2. Masukkan Nomor Pesanan Shopee di atas saat diminta License Key.<br />
                      3. Seluruh DLC The Sims 4 & fitur updater otomatis siap digunakan.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#080B11] border border-emerald-500/30 rounded-2xl p-4 sm:p-5 text-left mb-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gamepad2 size={16} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        Akses Google Drive Game:
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Game PC
                    </span>
                  </div>

                  <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-xs text-slate-200">
                    <div className="font-bold text-white mb-0.5">{successData?.gameTitle}</div>
                    <div className="text-slate-400 text-[11px]">Email Penerima: {successData?.email}</div>
                  </div>

                  <div className="text-xs text-slate-400 space-y-1 leading-relaxed pl-3">
                    <p>1. Folder Google Drive berkecepatan tinggi sedang dishare ke email Anda.</p>
                    <p>2. Anda dapat memantau status pesanan kapan saja melalui menu <strong>Koleksi Game Saya</strong>.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <a
                  href={successData?.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black py-3.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/15"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
                  <span>Konfirmasi Kilat via WhatsApp Toko</span>
                </a>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Link
                    to="/library"
                    className="flex-1 bg-white/5 hover:bg-white/10 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors"
                  >
                    <FolderDown size={14} className="text-emerald-400" />
                    <span>Lihat di Koleksi Game</span>
                  </Link>

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
            <span>Butuh panduan instalasi atau kendala lisensi? Chat kami di Shopee atau WhatsApp resmi toko.</span>
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
