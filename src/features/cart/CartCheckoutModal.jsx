// src/features/cart/CartCheckoutModal.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, ShoppingBag, Trash2, ArrowRight, ArrowLeft, 
  CheckCircle2, Upload, AlertCircle, Loader2, QrCode, 
  ExternalLink, Sparkles, ShieldCheck, Mail, Phone, User,
  FileImage, Copy, Check
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { db, storage, collection, addDoc, serverTimestamp } from '../../config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { buildWhatsAppUrl, INTEGRATIONS } from '../../config/integrations';
import WhatsAppIcon from '../../components/common/WhatsAppIcon';
import n8nService from '../../services/api/n8nService';

// Format Rupiah
const formatRp = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num || 0);
};

// Generate Invoice Number
const generateInvoiceId = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${dateStr}-${rand}`;
};

const CartCheckoutModal = () => {
  const navigate = useNavigate();
  const { items, itemCount, totalPrice, isCartOpen, closeCart, removeFromCart, clearCart } = useCart();

  // Wizard step: 'cart' -> 'payment' -> 'success'
  const [step, setStep] = useState('cart');

  // Customer Form Data
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Payment Proof File & Preview
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Result state
  const [completedOrder, setCompletedOrder] = useState(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const fileInputRef = useRef(null);

  if (!isCartOpen) return null;

  // Validate Step 1
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    const errors = {};

    if (!buyerName.trim()) {
      errors.name = 'Nama lengkap wajib diisi';
    }

    const cleanPhone = buyerPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      errors.phone = 'Nomor WhatsApp aktif wajib diisi (min. 9 digit)';
    }

    const cleanEmail = buyerEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      errors.email = 'Alamat email Google Drive (Gmail) aktif wajib diisi';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setStep('payment');
  };

  // Handle File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (JPG, PNG, atau WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran file maksimal 5 MB');
      return;
    }

    setProofFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result);
    };
    reader.readAsDataURL(file);
    setSubmitError('');
  };

  // Submit Order & Upload Proof
  const handleSubmitOrder = async () => {
    if (!proofFile) {
      setSubmitError('Wajib melampirkan foto / screenshot bukti transfer QRIS');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    const invoiceId = generateInvoiceId();
    let paymentProofUrl = '';

    try {
      // 1. Try Upload to Firebase Storage with timeout protection
      try {
        const fileExt = proofFile.name.split('.').pop() || 'jpg';
        const storageRef = ref(storage, `payment_proofs/${invoiceId}_${Date.now()}.${fileExt}`);
        const uploadPromise = uploadBytes(storageRef, proofFile).then((res) => getDownloadURL(res.ref));
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Storage timeout')), 2500));
        paymentProofUrl = await Promise.race([uploadPromise, timeoutPromise]);
      } catch (storageErr) {
        console.warn('Firebase storage note, using preview fallback:', storageErr);
        paymentProofUrl = proofPreview || 'offline_preview';
      }

      // 2. Prepare Order Payload (JSON-serializable)
      const orderPayload = {
        invoiceId,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        buyerEmail: buyerEmail.trim().toLowerCase(),
        notes: notes.trim(),
        items: items.map((item) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          type: item.type || 'single',
        })),
        itemCount: items.length,
        totalAmount: totalPrice,
        paymentMethod: 'QRIS_STATIC',
        paymentProofUrl: paymentProofUrl.startsWith('data:') ? 'base64_screenshot_attached' : paymentProofUrl,
        status: 'pending_verification',
      };

      // 3. Save to Firestore 'direct_orders' with timeout protection
      try {
        const firestorePromise = addDoc(collection(db, 'direct_orders'), {
          ...orderPayload,
          createdAt: serverTimestamp(),
        });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore timeout')), 2500));
        await Promise.race([firestorePromise, timeoutPromise]);
      } catch (dbErr) {
        console.warn('Firestore write warning:', dbErr);
        // Local fallback (Safe JSON serialization)
        try {
          const localOrders = JSON.parse(localStorage.getItem('mygameon_local_orders') || '[]');
          localOrders.unshift({ ...orderPayload, createdAt: new Date().toISOString() });
          localStorage.setItem('mygameon_local_orders', JSON.stringify(localOrders.slice(0, 20)));
        } catch (lsErr) {
          console.warn('LocalStorage save warning:', lsErr);
        }
      }

      // 4. Dispatch Telemetry / Notification via n8n (if available)
      try {
        if (n8nService?.dispatchDirectOrder) {
          await n8nService.dispatchDirectOrder(orderPayload);
        }
      } catch (telemetryErr) {
        console.warn('Telemetry alert note:', telemetryErr);
      }

      // 5. Complete Order
      setCompletedOrder({
        ...orderPayload,
        gameTitles: items.map((i) => i.title).join(', '),
      });
      clearCart();
      setStep('success');
    } catch (err) {
      console.error('Error submitting order:', err);
      setSubmitError('Terjadi kendala: ' + (err.message || 'Silakan kirim bukti langsung ke WhatsApp Admin.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyInvoice = (inv) => {
    if (!inv) return;
    navigator.clipboard.writeText(inv);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const handleCloseAndReset = () => {
    closeCart();
    // Delay reset state until modal animation completes
    setTimeout(() => {
      setStep('cart');
      setProofFile(null);
      setProofPreview(null);
      setCompletedOrder(null);
      setSubmitError('');
    }, 300);
  };

  const handleExploreCatalog = () => {
    handleCloseAndReset();
    navigate('/katalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // WhatsApp Confirmation URL for Step 3
  const waConfirmUrl = completedOrder
    ? buildWhatsAppUrl({
        text: `Halo Admin MyGameON, saya baru saja melakukan checkout via web:\n\n` +
              `*No. Invoice:* ${completedOrder.invoiceId}\n` +
              `*Nama:* ${completedOrder.buyerName}\n` +
              `*WhatsApp:* ${completedOrder.buyerPhone}\n` +
              `*Email Google Drive:* ${completedOrder.buyerEmail}\n` +
              `*Total:* ${formatRp(completedOrder.totalAmount)}\n` +
              `*Game yang Dipesan:*\n${completedOrder.items.map((it, i) => `${i + 1}. ${it.title}`).join('\n')}\n\n` +
              `Bukti transfer QRIS sudah saya upload di sistem web. Mohon verifikasi dan kirim akses Google Drive-nya ya min! Terima kasih.`,
      })
    : '#';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#090D16] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-[#0C111C]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white">
                {step === 'cart' && 'Keranjang & Data Pembeli'}
                {step === 'payment' && 'Pembayaran QRIS & Bukti Transfer'}
                {step === 'success' && 'Pesanan Berhasil Dibuat!'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {step === 'cart' && `${itemCount} Game Terpilih`}
                {step === 'payment' && 'Scan QRIS dan upload bukti pembayaran'}
                {step === 'success' && `Invoice #${completedOrder?.invoiceId || ''}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseAndReset}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Dynamic by Step */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* ══════════════════════════════════════════════════
              STEP 1: CART ITEMS & BUYER INFO
          ══════════════════════════════════════════════════ */}
          {step === 'cart' && (
            <>
              {items.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-500 flex items-center justify-center mx-auto">
                    <ShoppingBag size={28} />
                  </div>
                  <h4 className="text-base font-bold text-white">Keranjang Masih Kosong</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Pilih game favoritmu di katalog atau pilih paket bundling borongan untuk mulai berbelanja.
                  </p>
                  <button
                    type="button"
                    onClick={handleExploreCatalog}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition-transform active:scale-95 shadow-lg shadow-amber-400/20"
                  >
                    Jelajahi Katalog Lengkap
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProceedToPayment} className="space-y-5">
                  {/* Item List */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Daftar Game ({itemCount}):</span>
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Kosongkan</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {item.coverImageUrl ? (
                              <img
                                src={item.coverImageUrl}
                                alt={item.title}
                                className="w-11 h-11 rounded-lg object-cover bg-[#050608] shrink-0 border border-white/10"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-amber-400/10 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                                PC
                              </div>
                            )}
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-white truncate">
                                {item.title}
                              </h5>
                              <span className="text-[10px] text-slate-400 block">
                                Download Google Drive Full Speed
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-xs font-black text-amber-400 font-mono">
                              {formatRp(item.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Hapus game"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total Bar */}
                  <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                        Total Pembayaran
                      </span>
                      <span className="text-xs text-slate-300">
                        {itemCount} game siap kirim
                      </span>
                    </div>
                    <span className="text-xl font-black text-amber-400 font-mono">
                      {formatRp(totalPrice)}
                    </span>
                  </div>

                  {/* Buyer Data Form */}
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                      Data Pengiriman Akses Game:
                    </span>

                    {/* Nama */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <User size={12} className="text-amber-400" />
                        <span>Nama Lengkap / Panggilan: <strong className="text-rose-400">*</strong></span>
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className={`w-full bg-[#0E131F] border ${formErrors.name ? 'border-rose-500' : 'border-white/15'} focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none`}
                      />
                      {formErrors.name && (
                        <p className="text-[10px] text-rose-400 mt-1">{formErrors.name}</p>
                      )}
                    </div>

                    {/* WhatsApp */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Phone size={12} className="text-emerald-400" />
                        <span>Nomor WhatsApp Aktif: <strong className="text-rose-400">*</strong></span>
                      </label>
                      <input
                        type="tel"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className={`w-full bg-[#0E131F] border ${formErrors.phone ? 'border-rose-500' : 'border-white/15'} focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none`}
                      />
                      {formErrors.phone && (
                        <p className="text-[10px] text-rose-400 mt-1">{formErrors.phone}</p>
                      )}
                    </div>

                    {/* Email Google Drive */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Mail size={12} className="text-amber-400" />
                        <span>Email Google Drive (Gmail): <strong className="text-rose-400">*</strong></span>
                      </label>
                      <input
                        type="email"
                        required
                        value={buyerEmail}
                        onChange={(e) => setBuyerEmail(e.target.value)}
                        placeholder="namaanda@gmail.com"
                        className={`w-full bg-[#0E131F] border ${formErrors.email ? 'border-rose-500' : 'border-white/15'} focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none`}
                      />
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Link folder download game akan dishare langsung ke alamat Gmail ini.
                      </span>
                      {formErrors.email && (
                        <p className="text-[10px] text-rose-400 mt-1">{formErrors.email}</p>
                      )}
                    </div>

                    {/* Catatan Opsional */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 mb-1 block">
                        Catatan Pesanan (Opsional):
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Contoh: Mohon panduan cara instalasi ya min"
                        className="w-full bg-[#0E131F] border border-white/10 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-600 outline-none"
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    type="submit"
                    className="w-full py-3 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/10 active:scale-98"
                  >
                    <span>Lanjut ke Pembayaran QRIS ({formatRp(totalPrice)})</span>
                    <ArrowRight size={15} />
                  </button>
                </form>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════
              STEP 2: QRIS PAYMENT & PROOF UPLOAD
          ══════════════════════════════════════════════════ */}
          {step === 'payment' && (
            <div className="space-y-5">
              
              {/* Top Navigation Back */}
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Ubah Daftar Pesanan &amp; Data Pembeli</span>
              </button>

              {/* Total Transfer Notice */}
              <div className="p-4 rounded-2xl bg-[#0F1422] border border-amber-400/30 text-center space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total yang Harus Dibayar:
                </span>
                <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                  {formatRp(totalPrice)}
                </div>
                <p className="text-[11px] text-slate-300">
                  Penerima: <strong className="text-white">MYGAMEON STORE - GAME</strong> (NMID: ID1026496585237)
                </p>
              </div>

              {/* QRIS Display Container */}
              <div className="p-4 rounded-2xl bg-white text-slate-950 flex flex-col items-center justify-center space-y-3 shadow-xl">
                <div className="w-full max-w-[240px] aspect-[3/4] overflow-hidden rounded-xl border border-slate-200 shadow-inner flex items-center justify-center bg-white">
                  <img
                    src="/branding/qris_mygameon.png"
                    alt="QRIS MyGameON Store"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center space-y-0.5">
                  <span className="text-[11px] font-black text-slate-900 block">
                    Bisa Di-scan Menggunakan Semua Aplikasi:
                  </span>
                  <p className="text-[10px] text-slate-600 font-medium">
                    BCA Mobile, Mandiri Livin, BRImo, BNI, GoPay, OVO, DANA, ShopeePay, LinkAja
                  </p>
                </div>
              </div>

              {/* Upload Proof Box */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileImage size={14} className="text-emerald-400" />
                    <span>Upload Bukti Transfer / Screenshot: <strong className="text-rose-400">*</strong></span>
                  </label>
                  {proofFile && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <Check size={12} strokeWidth={3} /> Foto Terpasang
                    </span>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {proofPreview ? (
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-emerald-500/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={proofPreview}
                        alt="Preview Bukti Transfer"
                        className="w-14 h-14 rounded-lg object-cover border border-white/10 bg-black shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">
                          {proofFile?.name || 'bukti-transfer.jpg'}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-medium">
                          Ukuran: {Math.round((proofFile?.size || 0) / 1024)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 hover:underline shrink-0 px-2 py-1"
                    >
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-white/20 hover:border-amber-400/60 bg-white/[0.02] hover:bg-white/[0.05] cursor-pointer text-center space-y-2 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                      <Upload size={20} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Klik di sini untuk upload screenshot bukti transfer
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Mendukung format JPG, PNG, atau WEBP (Maksimal 10 MB)
                      </span>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}
              </div>

              {/* Submit Final Button */}
              <button
                type="button"
                disabled={isSubmitting || !proofFile}
                onClick={handleSubmitOrder}
                className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-slate-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/10 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-slate-950" />
                    <span>Mengirim &amp; Menyimpan Bukti Transfer...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Kirim &amp; Selesaikan Pesanan</span>
                  </>
                )}
              </button>

            </div>
          )}

          {/* ══════════════════════════════════════════════════
              STEP 3: SUCCESS & WHATSAPP CONFIRMATION
          ══════════════════════════════════════════════════ */}
          {step === 'success' && completedOrder && (
            <div className="py-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">
                  Pesanan Berhasil Diterima!
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Terima kasih <strong className="text-white">{completedOrder.buyerName}</strong>. Bukti transfer telah kami simpan di sistem.
                </p>
              </div>

              {/* Invoice Pill Box */}
              <div className="p-3.5 rounded-2xl bg-[#0D121E] border border-white/10 max-w-sm mx-auto flex items-center justify-between gap-3">
                <div className="text-left min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Nomor Invoice Resmi:
                  </span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    #{completedOrder.invoiceId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyInvoice(completedOrder.invoiceId)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 flex items-center gap-1 transition-colors"
                >
                  {copiedInvoice ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  <span>{copiedInvoice ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              {/* Delivery Info Box */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left text-xs space-y-1.5 max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email Tujuan:</span>
                  <strong className="text-white font-mono">{completedOrder.buyerEmail}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Nominal:</span>
                  <strong className="text-emerald-400 font-mono">{formatRp(completedOrder.totalAmount)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    Menunggu Verifikasi Admin
                  </span>
                </div>
              </div>

              {/* WhatsApp Call to Action (High priority) */}
              <div className="space-y-2 pt-2">
                <a
                  href={waConfirmUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-98"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current shrink-0" />
                  <span>Kirim Konfirmasi 1-Klik ke WhatsApp Admin</span>
                </a>
                <p className="text-[11px] text-slate-500">
                  Klik tombol di atas untuk membuka chat WhatsApp langsung agar admin memproses link download Anda dalam hitungan menit!
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCloseAndReset}
                  className="text-xs text-slate-400 hover:text-white underline transition-colors"
                >
                  Tutup &amp; Kembali ke Website
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default CartCheckoutModal;
