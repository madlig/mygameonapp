// src/features/requests/components/RequestCard.jsx
//
// Simplified admin request card.
// Clear actions per status:
//   pending    → [Review] [Reject]
//   reviewing  → [Upload] [Reject]
//   processing → [Selesai] [Batal]
//   completed  → copy link Shopee / kirim WA
//   rejected   → (read-only)

import React, { useState } from 'react';
import {
  Clock,
  User,
  Calendar,
  ArrowRight,
  Play,
  CheckCircle,
  XCircle,
  Copy,
  MessageCircle,
  ThumbsUp,
  Loader2,
  ExternalLink,
  Server,
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import Swal from 'sweetalert2';
import {
  getRequestStatusBadgeClass,
  getRequestStatusLabel,
  REQUEST_STATUS,
} from '../../../shared/requestStatus';
import FinalizeRequestModal from './FinalizeRequestModal';

const swalDark = {
  color: '#F3F4F6',
  background: '#1A1F27',
  confirmButtonColor: '#FFD100',
};

const STATUS_BORDER = {
  [REQUEST_STATUS.PENDING]: 'border-l-yellow-500',
  [REQUEST_STATUS.REVIEWING]: 'border-l-indigo-500',
  [REQUEST_STATUS.QUEUED]: 'border-l-violet-500',
  [REQUEST_STATUS.PROCESSING]: 'border-l-blue-500',
  [REQUEST_STATUS.COMPLETED]: 'border-l-emerald-500',
  [REQUEST_STATUS.REJECTED]: 'border-l-red-500',
};

const RequestCard = ({ request }) => {
  const [showFinalize, setShowFinalize] = useState(false);
  const status = request.status;

  const title = request.title || 'Tanpa Judul';
  const displayUser = request.requesterName || 'Anonymous';
  const trackingCode = request.trackingCode || '-';
  const votes = request.votes || 1;
  const dateDisplay = request.createdAt?.seconds
    ? format(new Date(request.createdAt.seconds * 1000), 'd MMM', {
        locale: idLocale,
      })
    : '-';

  // ─── Helpers ───
  const update = (fields) =>
    updateDoc(doc(db, 'requests', request.id), {
      ...fields,
      updatedAt: serverTimestamp(),
    });

  const toast = (icon, title) =>
    Swal.fire({
      ...swalDark,
      icon,
      title,
      timer: 1200,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
    });

  const copyText = async (text, label) => {
    await navigator.clipboard.writeText(text);
    toast('success', `${label} disalin`);
  };

  // ─── Actions ───
  const handleStartReview = () => update({ status: REQUEST_STATUS.REVIEWING });

  const handleStartUpload = () => update({ status: REQUEST_STATUS.PROCESSING });

  const handleQueueRdp = () =>
    update({ status: REQUEST_STATUS.QUEUED, needsRdp: true });

  const handleComplete = () => {
    setShowFinalize(true);
  };

  const handleReject = async () => {
    const { value: note, isConfirmed } = await Swal.fire({
      ...swalDark,
      title: 'Tandai Tidak Tersedia',
      input: 'text',
      inputLabel: 'Alasan (opsional)',
      inputPlaceholder: 'Misal: file tidak ditemukan',
      showCancelButton: true,
      confirmButtonText: 'Tandai',
      cancelButtonText: 'Batal',
    });

    if (isConfirmed) {
      await update({
        status: REQUEST_STATUS.REJECTED,
        rejectionNote: note || '',
        rejectedAt: new Date(),
      });
    }
  };

  const handleCancelUpload = async () => {
    const r = await Swal.fire({
      ...swalDark,
      title: 'Batalkan upload?',
      text: 'Kembali ke status reviewing.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak',
    });
    if (r.isConfirmed) await update({ status: REQUEST_STATUS.REVIEWING });
  };

  // WhatsApp message builder
  const buildWhatsAppUrl = () => {
    const phone = (request.contactWhatsApp || '').replace(/[^0-9]/g, '');
    if (!phone) return '';
    const trackLink = `${window.location.origin}/request-status?code=${trackingCode}`;
    let msg = '';
    if (status === REQUEST_STATUS.COMPLETED) {
      msg = `Halo ${displayUser}! Game "${title}" sudah tersedia di katalog kami.`;
      if (request.shopeeProductUrl) {
        msg += `\n\nBeli di Shopee: ${request.shopeeProductUrl}`;
      }
      msg += `\n\nCek status: ${trackLink}`;
    } else {
      msg = `Halo ${displayUser}, update request "${title}":\nStatus: ${getRequestStatusLabel(status)}\n\nCek status: ${trackLink}`;
    }
    return `https://wa.me/${phone.startsWith('0') ? '62' + phone.slice(1) : phone}?text=${encodeURIComponent(msg)}`;
  };

  // ─── Render actions per status ───
  const renderActions = () => {
    const btnPrimary =
      'px-3 py-2 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors';
    const btnGhost =
      'px-3 py-2 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors';

    if (status === REQUEST_STATUS.PENDING) {
      return (
        <>
          <button
            onClick={handleReject}
            className={`${btnGhost} text-red-400 hover:bg-red-500/10`}
          >
            <XCircle size={14} /> Reject
          </button>
          <button
            onClick={handleStartReview}
            className={`${btnPrimary} bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 ml-auto`}
          >
            Mulai Review <ArrowRight size={14} />
          </button>
        </>
      );
    }

    if (status === REQUEST_STATUS.REVIEWING) {
      return (
        <>
          <button
            onClick={handleReject}
            className={`${btnGhost} text-red-400 hover:bg-red-500/10`}
          >
            <XCircle size={14} /> Reject
          </button>
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleQueueRdp}
              className={`${btnPrimary} bg-violet-500/20 text-violet-400 hover:bg-violet-500/30`}
              title="Butuh RDP — masuk antrian batch"
            >
              <Server size={14} /> Antri RDP
            </button>
            <button
              onClick={handleStartUpload}
              className={`${btnPrimary} bg-blue-500/20 text-blue-400 hover:bg-blue-500/30`}
            >
              <Play size={14} className="fill-blue-400" /> Upload
            </button>
          </div>
        </>
      );
    }

    if (status === REQUEST_STATUS.QUEUED) {
      return (
        <>
          <button
            onClick={() =>
              update({ status: REQUEST_STATUS.REVIEWING, needsRdp: false })
            }
            className={`${btnGhost} text-[#7E8796] hover:bg-[#2A2F39]`}
          >
            <XCircle size={14} /> Batal
          </button>
          <button
            onClick={handleStartUpload}
            className={`${btnPrimary} bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 ml-auto`}
          >
            <Play size={14} className="fill-blue-400" /> Mulai Upload
          </button>
        </>
      );
    }

    if (status === REQUEST_STATUS.PROCESSING) {
      return (
        <>
          <button
            onClick={handleCancelUpload}
            className={`${btnGhost} text-[#7E8796] hover:bg-[#2A2F39]`}
          >
            <XCircle size={14} /> Batal
          </button>
          <button
            onClick={handleComplete}
            className={`${btnPrimary} bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 ml-auto`}
          >
            <CheckCircle size={14} /> Selesai
          </button>
        </>
      );
    }

    if (status === REQUEST_STATUS.COMPLETED) {
      const waUrl = buildWhatsAppUrl();
      return (
        <div className="flex items-center gap-2 w-full">
          <span className="text-[10px] text-emerald-400 font-medium">
            ✓ Selesai
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            {request.shopeeProductUrl && (
              <button
                onClick={() =>
                  window.open(request.shopeeProductUrl, '_blank', 'noopener')
                }
                className="p-2 rounded-lg text-[#7E8796] hover:text-[#FFD100] hover:bg-[#FFD100]/10 transition-colors"
                title="Buka link Shopee"
              >
                <ExternalLink size={14} />
              </button>
            )}
            {waUrl && (
              <button
                onClick={() => window.open(waUrl, '_blank', 'noopener')}
                className={`${btnPrimary} bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25`}
              >
                <MessageCircle size={14} /> Kirim WA
              </button>
            )}
          </div>
        </div>
      );
    }

    if (status === REQUEST_STATUS.REJECTED) {
      return (
        <div className="text-[10px] text-[#7E8796]">
          {request.rejectionNote
            ? `Alasan: "${request.rejectionNote}"`
            : 'Ditandai tidak tersedia.'}
        </div>
      );
    }

    return null;
  };

  const borderClass = STATUS_BORDER[status] || 'border-l-[#2A2F39]';

  return (
    <div
      className={`bg-[#1A1F27] rounded-xl border border-[#2A2F39] border-l-[3px] ${borderClass} transition-all hover:border-[#3A3F49] group`}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-[#F3F4F6] text-sm line-clamp-1 group-hover:text-[#FFD100] transition-colors">
              {title}
            </h3>
            <div className="flex items-center text-[11px] text-[#7E8796] gap-3 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <User size={11} /> {displayUser}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={11} /> {dateDisplay}
              </span>
              {votes > 1 && (
                <span className="flex items-center gap-1 text-[#FFD100]">
                  <ThumbsUp size={11} /> {votes}
                </span>
              )}
              {request.needsRdp && (
                <span className="flex items-center gap-1 text-violet-400 font-bold">
                  <Server size={11} /> RDP
                </span>
              )}
            </div>
          </div>

          <span
            className={`px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 flex-shrink-0 ${getRequestStatusBadgeClass(status)}`}
          >
            {status === REQUEST_STATUS.PROCESSING && (
              <Loader2 size={10} className="animate-spin" />
            )}
            {status === REQUEST_STATUS.PENDING && <Clock size={10} />}
            {getRequestStatusLabel(status)}
          </span>
        </div>

        {/* Notes */}
        {request.notes && (
          <div className="mt-2 bg-[#111317] border border-[#2A2F39] p-2 rounded-lg text-xs text-[#7E8796] italic line-clamp-2">
            {request.notes}
          </div>
        )}
      </div>

      {/* Tracking code row */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between bg-[#111317] border border-[#2A2F39] rounded-lg px-3 py-2">
          <span className="text-xs text-[#7E8796]">
            <span className="font-mono font-bold text-[#C8CFDA]">
              {trackingCode}
            </span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => copyText(trackingCode, 'Kode')}
              className="p-1.5 rounded hover:bg-[#2A2F39] text-[#7E8796] hover:text-[#C8CFDA] transition-colors"
              title="Copy kode"
            >
              <Copy size={12} />
            </button>
            {request.contactWhatsApp && (
              <button
                onClick={() => copyText(request.contactWhatsApp, 'WhatsApp')}
                className="p-1.5 rounded hover:bg-[#2A2F39] text-[#7E8796] hover:text-[#C8CFDA] transition-colors"
                title="Copy nomor WA"
              >
                <MessageCircle size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[#2A2F39]">
        {renderActions()}
      </div>

      {/* Finalize modal */}
      {showFinalize && (
        <FinalizeRequestModal
          request={request}
          onClose={() => setShowFinalize(false)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default RequestCard;
