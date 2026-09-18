import React, { useState } from 'react';
import {
  XMarkIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const ProofPreviewModal = ({
  order,
  isOpen,
  onClose,
  onUpdateStatus,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopyEmail = () => {
    if (!order.buyerEmail) return;
    navigator.clipboard.writeText(order.buyerEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleCopyInvoice = () => {
    if (!order.invoiceId) return;
    navigator.clipboard.writeText(order.invoiceId);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  const generateWaLink = () => {
    const phone = (order.buyerPhone || '').replace(/\D/g, '');
    const cleanPhone = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
    const itemList = (order.items || [])
      .map((item, idx) => `  ${idx + 1}. ${item.title} (${formatCurrency(item.price)})`)
      .join('\n');

    const message = `Halo Kak *${order.buyerName}*, terima kasih telah order di MyGameON! 🎮\n\n` +
      `*Detail Pesanan [${order.invoiceId}]:*\n` +
      `${itemList}\n` +
      `*Total:* ${formatCurrency(order.totalAmount)}\n\n` +
      `Akses folder Google Drive game sudah dibagikan ke email:\n` +
      `📧 *${order.buyerEmail}*\n\n` +
      `Silakan cek inbox Gmail Kakak atau buka tab *"Dibagikan kepada saya" (Shared with me)* di Google Drive ya!\n\n` +
      `Jika ada kendala instalasi atau akses, silakan langsung balas chat ini. Selamat bermain! 🔥`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const isCompleted = order.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-[#1A1F27] border border-[#2A2F39] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#F3F4F6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A2F39] bg-[#111317]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm sm:text-base font-bold text-[#FFD100] tracking-wider truncate">
              {order.invoiceId}
            </span>
            <button
              onClick={handleCopyInvoice}
              title="Salin Invoice ID"
              className="p-1 rounded text-[#7E8796] hover:text-[#FFD100] hover:bg-[#2A2F39] transition-colors"
            >
              {copiedInvoice ? (
                <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-400" />
              ) : (
                <ClipboardDocumentIcon className="w-4 h-4" />
              )}
            </button>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isCompleted
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                  Selesai
                </>
              ) : (
                <>
                  <ClockIcon className="w-3.5 h-3.5" />
                  Menunggu Verifikasi
                </>
              )}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7E8796] hover:text-[#F3F4F6] hover:bg-[#2A2F39] transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Top Grid: Buyer Info & Order Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer Details */}
            <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E8796]">
                Data Pembeli
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-1 border-b border-[#2A2F39]/60">
                  <span className="text-[#7E8796]">Nama</span>
                  <span className="font-medium text-[#F3F4F6]">{order.buyerName}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#2A2F39]/60">
                  <span className="text-[#7E8796]">WhatsApp</span>
                  <a
                    href={`https://wa.me/${(order.buyerPhone || '').replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#FFD100] hover:underline"
                  >
                    {order.buyerPhone}
                  </a>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#2A2F39]/60">
                  <span className="text-[#7E8796]">Email Google Drive</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#F3F4F6]">{order.buyerEmail}</span>
                    <button
                      onClick={handleCopyEmail}
                      className="px-2 py-0.5 rounded bg-[#2A2F39] hover:bg-[#373E4D] text-xs font-medium text-[#FFD100] transition-colors flex items-center gap-1"
                    >
                      {copiedEmail ? (
                        <>
                          <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                          Salin
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#7E8796]">Waktu Order</span>
                  <span className="text-[#C8CFDA] text-xs">{formatDateTime(order.createdAt)}</span>
                </div>
                {order.notes && (
                  <div className="pt-2 border-t border-[#2A2F39]/60">
                    <span className="text-xs text-[#7E8796] block mb-1">Catatan Pembeli:</span>
                    <p className="text-xs text-[#C8CFDA] bg-[#1A1F27] p-2 rounded border border-[#2A2F39]/40 italic">
                      "{order.notes}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Items Summary */}
            <div className="bg-[#111317] border border-[#2A2F39] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E8796] mb-3">
                  Item Pesanan ({order.items?.length || 0})
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin pr-1">
                  {(order.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-[#1A1F27] border border-[#2A2F39]/50"
                    >
                      <span className="font-medium text-[#F3F4F6] truncate max-w-[200px]" title={item.title}>
                        {item.title}
                      </span>
                      <span className="font-bold text-[#FFD100]">
                        {formatCurrency(item.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-[#2A2F39] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#7E8796]">Total Bayar QRIS:</span>
                <span className="text-lg font-extrabold text-emerald-400">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Proof Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#7E8796]">
                Bukti Transfer Pembeli (Screenshot / Struk QRIS)
              </h3>
              {order.paymentProofUrl && order.paymentProofUrl !== 'offline_preview' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111317] border border-[#2A2F39] text-xs font-medium text-[#C8CFDA] hover:text-[#F3F4F6] hover:bg-[#2A2F39] transition-colors"
                  >
                    {isZoomed ? (
                      <>
                        <MagnifyingGlassMinusIcon className="w-3.5 h-3.5" />
                        Ukuran Standar
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassPlusIcon className="w-3.5 h-3.5" />
                        Perbesar Foto
                      </>
                    )}
                  </button>
                  <a
                    href={order.paymentProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111317] border border-[#2A2F39] text-xs font-medium text-[#FFD100] hover:bg-[#2A2F39] transition-colors"
                  >
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    Buka Asli
                  </a>
                </div>
              )}
            </div>

            <div className="relative bg-[#111317] border border-[#2A2F39] rounded-xl p-3 flex items-center justify-center min-h-[300px] overflow-hidden">
              {order.paymentProofUrl && order.paymentProofUrl !== 'offline_preview' ? (
                <img
                  src={order.paymentProofUrl}
                  alt={`Bukti Transfer ${order.invoiceId}`}
                  className={`rounded-lg object-contain transition-all duration-200 ${
                    isZoomed ? 'max-h-[750px] w-full cursor-zoom-out' : 'max-h-[360px] cursor-zoom-in'
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
              ) : (
                <div className="text-center py-12 text-[#7E8796]">
                  <p className="text-sm font-medium text-[#C8CFDA]">
                    {order.paymentProofUrl === 'offline_preview'
                      ? 'Bukti tersimpan lokal pada sesi browser pembeli (offline mode).'
                      : 'Bukti transfer tidak dapat dimuat atau belum diunggah.'}
                  </p>
                  <p className="text-xs mt-1 text-[#7E8796]">
                    Hubungi pembeli via WhatsApp untuk konfirmasi manual struk QRIS.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[#2A2F39] bg-[#111317]">
          {/* Left Quick Helpers */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyEmail}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#2A2F39] hover:bg-[#373E4D] text-xs font-semibold text-[#F3F4F6] transition-colors"
            >
              {copiedEmail ? (
                <>
                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-400" />
                  Email Drive Tersalin!
                </>
              ) : (
                <>
                  <ClipboardDocumentIcon className="w-4 h-4 text-[#FFD100]" />
                  Salin Email Drive
                </>
              )}
            </button>
            <a
              href={generateWaLink()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/40 text-xs font-semibold text-[#25D366] transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              Chat WA (Kirim Akses)
            </a>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const nextStatus = isCompleted ? 'pending_verification' : 'completed';
                onUpdateStatus?.(order.id, nextStatus);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isCompleted
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
              }`}
            >
              <CheckCircleIcon className="w-4 h-4" />
              {isCompleted ? 'Buka Kembali Pesanan' : 'Tandai Selesai (Sudah Diberi Akses)'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#2A2F39] hover:bg-[#373E4D] text-xs font-medium text-[#C8CFDA] transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProofPreviewModal;
