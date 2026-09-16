import React, { useState } from 'react';
import { 
  CheckCircle2, AlertCircle, Loader2, Send, 
  HelpCircle, ArrowLeft, Gamepad2, ShieldCheck, Mail, ExternalLink,
  ShoppingBag, Disc
} from 'lucide-react';
import { Link } from 'react-router-dom';
import n8nService from '../../services/api/n8nService';
import { buildWhatsAppUrl } from '../../config/integrations';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';

const ClaimOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [email, setEmail] = useState('');
  const [orderType, setOrderType] = useState('sims4'); // 'sims4' or 'pcgame'
  const [gameTitle, setGameTitle] = useState('');
  
  const [status, setStatus] = useState('idle'); // 'idle', 'submitting', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [fallbackWaUrl, setFallbackWaUrl] = useState('');
  const [successData, setSuccessData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim() || !email.trim()) {
      setErrorMessage('Nomor Pesanan dan Email Gmail wajib diisi.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMessage('');
    setFallbackWaUrl('');

    try {
      const response = await n8nService.submitClaim({
        invoice: orderId.trim(),
        email: email.trim().toLowerCase(),
        orderType,
        gameTitle: orderType === 'pcgame' ? gameTitle.trim() : 'The Sims 4 All DLCs',
      });

      if (response && response.success) {
        setSuccessData({
          orderId: orderId.trim(),
          email: email.trim().toLowerCase(),
          whatsappUrl: response.whatsappUrl,
        });
        setStatus('success');
      } else {
        throw new Error(response?.message || 'Klaim gagal diproses otomatis.');
      }
    } catch (err) {
      console.error('Claim order error:', err);
      const waFallback = buildWhatsAppUrl({
        text: `Halo Admin MyGameON, saya mengalami kendala saat klaim pesanan Shopee No: ${orderId.trim()}.\nEmail: ${email.trim().toLowerCase()}.\nMohon bantuannya ya min.`,
      });
      setFallbackWaUrl(waFallback);
      setErrorMessage(err.message || 'Sistem klaim sedang sibuk. Silakan konfirmasi via WhatsApp.');
      setStatus('error');
    }
  };

  const handleReset = () => {
    setOrderId('');
    setEmail('');
    setGameTitle('');
    setStatus('idle');
    setErrorMessage('');
    setFallbackWaUrl('');
    setSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      
      {/* Top Navigation */}
      <header className="border-b border-white/5 bg-[#0b0d12]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-semibold">
          <ArrowLeft size={18} />
          <span>Kembali ke Beranda</span>
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-xs font-mono text-emerald-400">Server Klaim Aktif</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-4 shadow-lg shadow-amber-500/5">
              <ShoppingBag size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-display">
              Klaim Pesanan <span className="text-amber-400">Shopee</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Masukkan Nomor Pesanan Shopee dan Gmail Anda untuk mendapatkan akses game & lisensi resmi secara kilat tanpa antre.
            </p>
          </div>

          {/* Card Form */}
          {status !== 'success' ? (
            <div className="bg-[#0b0d12] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Order Type Selector */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Kategori Pesanan Anda:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderType('sims4')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        orderType === 'sims4'
                          ? 'border-amber-400 bg-amber-400/10 text-white font-bold shadow-sm'
                          : 'border-white/5 bg-black/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Disc size={16} className={orderType === 'sims4' ? 'text-amber-400' : 'text-slate-500'} />
                      <span className="text-xs">The Sims 4 Launcher</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderType('pcgame')}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        orderType === 'pcgame'
                          ? 'border-amber-400 bg-amber-400/10 text-white font-bold shadow-sm'
                          : 'border-white/5 bg-black/40 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Gamepad2 size={16} className={orderType === 'pcgame' ? 'text-amber-400' : 'text-slate-500'} />
                      <span className="text-xs">Game PC Lainnya</span>
                    </button>
                  </div>
                </div>

                {/* Shopee Order ID */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Nomor Pesanan Shopee
                  </label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="Contoh: 2409146VXXXXXX"
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Salin dari rincian pesanan Shopee Anda (Status: Sudah Dikirim).
                  </p>
                </div>

                {/* Buyer Email */}
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                    Alamat Email (Gmail Aktif)
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
                    Akses Google Drive atau info aktivasi akan dikirimkan ke email ini.
                  </p>
                </div>

                {/* Optional: Game title if PC Game */}
                {orderType === 'pcgame' && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                      Judul Game yang Dipesan
                    </label>
                    <input
                      type="text"
                      value={gameTitle}
                      onChange={(e) => setGameTitle(e.target.value)}
                      placeholder="Contoh: Black Myth Wukong / Spider-Man"
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                )}

                {/* Error Banner */}
                {status === 'error' && (
                  <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0 text-red-400" />
                      <span>{errorMessage}</span>
                    </div>
                    {fallbackWaUrl && (
                      <a
                        href={fallbackWaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 pl-6 transition-colors"
                      >
                        <MessageSquare size={13} />
                        <span>Klaim langsung via WhatsApp Toko</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-black font-extrabold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 disabled:opacity-50 text-sm"
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Sedang Memproses Klaim...</span>
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
            <div className="bg-[#0b0d12] border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>

              <h3 className="text-xl font-bold text-white mb-1">
                Klaim Berhasil Diterima!
              </h3>
              <p className="text-xs text-slate-400 mb-6 max-w-sm mx-auto">
                Akses pesanan <span className="font-mono text-amber-400">{successData?.orderId}</span> telah didaftarkan untuk email <span className="font-semibold text-white">{successData?.email}</span>.
              </p>

              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 text-left text-xs text-slate-300 mb-6 space-y-2">
                <div className="flex items-start gap-2 font-semibold text-amber-400">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-amber-400" />
                  <span>Instruksi Langkah Selanjutnya:</span>
                </div>
                <p className="text-slate-400 pl-6 leading-relaxed">
                  1. Periksa kotak masuk (Inbox) atau folder <strong>Spam</strong> Gmail Anda.<br />
                  2. Jika Anda memesan <strong>The Sims 4</strong>, download launcher dari website dan gunakan Nomor Pesanan Shopee sebagai <strong>License Key</strong> Anda.<br />
                  3. Jika Anda memesan <strong>Game PC</strong>, buka folder Google Drive yang telah dishare ke email Anda.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={successData?.whatsappUrl || buildWhatsAppUrl({ text: 'Halo Admin MyGameON, saya sudah klaim pesanan Shopee ini' })}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/10"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current shrink-0" />
                  <span>Konfirmasi via WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 font-medium py-3 px-4 rounded-xl text-xs transition-colors"
                >
                  Klaim Pesanan Lain
                </button>
              </div>
            </div>
          )}

          {/* Footer Assistance */}
          <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <HelpCircle size={14} />
            <span>Butuh bantuan instalasi? Hubungi kami langsung di chat Shopee atau WhatsApp toko.</span>
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
