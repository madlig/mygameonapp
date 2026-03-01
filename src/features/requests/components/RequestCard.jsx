import React from 'react';
import {
  Clock,
  CheckCircle,
  User,
  Gamepad2,
  Calendar,
  Server,
  Zap,
  ArrowRight,
  Play,
  Loader2,
  FileCheck,
  XCircle,
  Copy,
  Link2,
  ShoppingBag,
  Pencil,
  MessageCircle,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebaseConfig';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Swal from 'sweetalert2';
import {
  getRequestStatusBadgeClass,
  getRequestStatusLabel,
  REQUEST_STATUS,
} from '../../../shared/requestStatus';

const RequestCard = ({ request, onApproveClick }) => {
  const isRdpMode =
    request.uploadMode === 'rdp_batch' || request.isRdpBatch === true;
  const routeLabel = isRdpMode ? 'Batch RDP (>20GB)' : 'Direct (<=20GB)';

  // Handlers
  const handleMarkAsReviewing = async () => {
    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.REVIEWING,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const collectCheckoutLink = async () => {
    const result = await Swal.fire({
      title: 'Masukkan Link Checkout Shopee',
      input: 'url',
      inputValue: request.shopeeCheckoutUrl || '',
      inputLabel: 'Link produk checkout Shopee',
      inputPlaceholder: 'https://shopee.co.id/....',
      showCancelButton: true,
      confirmButtonText: 'Simpan Link',
      cancelButtonText: 'Batal',
      inputValidator: (value) => {
        if (!value) return 'Link Shopee wajib diisi.';
        if (!/^https?:\/\//.test(value)) {
          return 'Link harus diawali http:// atau https://';
        }
        return null;
      },
    });

    if (!result.isConfirmed) return '';

    return result.value;
  };

  const handleSetDirectFlow = async () => {
    const checkoutLink = await collectCheckoutLink();
    if (!checkoutLink) return;

    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.AWAITING_PAYMENT,
      uploadMode: 'direct',
      isRdpBatch: false,
      shopeeCheckoutUrl: checkoutLink,
      paymentRequestedAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleSetRdpBatchFlow = async () => {
    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.QUEUED,
      uploadMode: 'rdp_batch',
      isRdpBatch: true,
      batchQueuedAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleOpenBatchCheckoutWindow = async () => {
    const checkoutLink = await collectCheckoutLink();
    if (!checkoutLink) return;

    const now = new Date();
    const deadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.AWAITING_PAYMENT,
      uploadMode: 'rdp_batch',
      isRdpBatch: true,
      shopeeCheckoutUrl: checkoutLink,
      checkoutWindowOpenedAt: now,
      checkoutDeadlineAt: deadline,
      paymentRequestedAt: now,
      updatedAt: now,
    });
  };

  const handleEditCheckoutLink = async () => {
    const checkoutLink = await collectCheckoutLink();
    if (!checkoutLink) return;

    await updateDoc(doc(db, 'requests', request.id), {
      shopeeCheckoutUrl: checkoutLink,
      updatedAt: new Date(),
    });
  };

  const handleMarkAsPaid = async () => {
    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.PAID,
      paidAt: new Date(),
      updatedAt: new Date(),
    });
  };

  const handleBackToReview = async () => {
    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.REVIEWING,
      updatedAt: new Date(),
    });
  };

  const handleStartUpload = async () => {
    await updateDoc(doc(db, 'requests', request.id), {
      status: REQUEST_STATUS.PROCESSING,
      startedAt: new Date(),
      updatedAt: new Date(),
    });
  };
  // LOGIKA BARU: Cukup toggle boolean, tidak perlu hitung score lagi
  const toggleUrgent = async () => {
    await updateDoc(doc(db, 'requests', request.id), {
      isUrgent: !request.isUrgent,
      updatedAt: new Date(),
    });
  };

  const handleMarkNotAvailable = async () => {
    const result = await Swal.fire({
      title: 'Tandai Tidak Tersedia?',
      text: 'Status request akan ditandai sebagai Tidak Tersedia.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Tandai',
      cancelButtonText: 'Batal',
    });

    if (result.isConfirmed) {
      await updateDoc(doc(db, 'requests', request.id), {
        status: REQUEST_STATUS.NOT_AVAILABLE,
        unavailableAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };

  const handleMarkAsUploaded = async () => {
    const result = await Swal.fire({
      title: 'Konfirmasi Selesai Upload',
      text: "Apakah file game benar-benar sudah selesai diupload? Status akan berubah menjadi 'Siap Publish'.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Selesai',
      cancelButtonText: 'Batal',
    });
    if (result.isConfirmed) {
      await updateDoc(doc(db, 'requests', request.id), {
        status: REQUEST_STATUS.UPLOADED,
        uploadedAt: new Date(),
        updatedAt: new Date(),
      });
      Swal.fire({
        title: 'Berhasil!',
        icon: 'success',
        timer: 1000,
        showConfirmButton: false,
      });
    }
  };

  const handleCancelUpload = async () => {
    const result = await Swal.fire({
      title: 'Batalkan Upload?',
      text: 'Kembali ke antrian?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya',
      cancelButtonText: 'Tidak',
    });
    if (result.isConfirmed)
      await updateDoc(doc(db, 'requests', request.id), {
        status: REQUEST_STATUS.QUEUED,
        updatedAt: new Date(),
      });
  };

  const getStatusBadge = () => {
    const s = request.status || REQUEST_STATUS.PENDING;
    const baseClass = `px-2 py-1 rounded-md text-[10px] font-bold ${getRequestStatusBadgeClass(s)}`;

    switch (s) {
      case REQUEST_STATUS.PENDING:
        return <span className={baseClass}>{getRequestStatusLabel(s)}</span>;
      case REQUEST_STATUS.QUEUED:
        return (
          <span className={`${baseClass} flex items-center`}>
            {isRdpMode ? (
              <Server size={10} className="mr-1" />
            ) : (
              <Clock size={10} className="mr-1" />
            )}{' '}
            {getRequestStatusLabel(s)}
          </span>
        );
      case REQUEST_STATUS.AWAITING_PAYMENT:
        return (
          <span className={`${baseClass} flex items-center`}>
            <ShoppingBag size={10} className="mr-1" />{' '}
            {getRequestStatusLabel(s)}
          </span>
        );
      case REQUEST_STATUS.PAID:
        return (
          <span className={`${baseClass} flex items-center`}>
            <CheckCircle size={10} className="mr-1" />
            {getRequestStatusLabel(s)}
          </span>
        );
      case REQUEST_STATUS.REVIEWING:
        return (
          <span className={`${baseClass} flex items-center`}>
            <Clock size={10} className="mr-1" /> {getRequestStatusLabel(s)}
          </span>
        );
      case REQUEST_STATUS.PROCESSING:
        return (
          <span className={`${baseClass} flex items-center animate-pulse`}>
            <Loader2 size={10} className="mr-1 animate-spin" /> Uploading...
          </span>
        );
      case REQUEST_STATUS.UPLOADED:
        return (
          <span className={`${baseClass} flex items-center`}>
            <FileCheck size={10} className="mr-1" /> {getRequestStatusLabel(s)}
          </span>
        );
      case REQUEST_STATUS.NOT_AVAILABLE:
        return <span className={baseClass}>{getRequestStatusLabel(s)}</span>;
      case REQUEST_STATUS.AVAILABLE:
        return <span className={baseClass}>{getRequestStatusLabel(s)}</span>;
      default:
        return (
          <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md text-[10px] font-bold">
            Unknown
          </span>
        );
    }
  };

  // --- DATA DISPLAY ---
  const title = request.title || 'Tanpa Judul';
  const platform = request.platform || 'PC';
  const displayUser = request.requesterName || 'Anonymous'; // Menggunakan field requesterName yang sudah standar

  const dateDisplay = request.createdAt?.seconds
    ? format(new Date(request.createdAt.seconds * 1000), 'd MMM', {
        locale: id,
      })
    : 'No Date';

  const trackingCode = request.trackingCode || '-';

  const copyTrackingCode = async () => {
    if (!request.trackingCode) return;
    await navigator.clipboard.writeText(request.trackingCode);
  };

  const copyTrackingLink = async () => {
    if (!request.trackingCode) return;
    const link = `${window.location.origin}/request-status?code=${request.trackingCode}`;
    await navigator.clipboard.writeText(link);
  };

  const formatTimestamp = (value) => {
    if (!value) return '-';
    if (value?.seconds) {
      return format(new Date(value.seconds * 1000), 'd MMM yyyy HH:mm', {
        locale: id,
      });
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return format(parsed, 'd MMM yyyy HH:mm', { locale: id });
  };

  const checkoutDeadlineText = formatTimestamp(request.checkoutDeadlineAt);

  const buildBuyerUpdateMessage = () => {
    const statusLabel = getRequestStatusLabel(
      request.status || REQUEST_STATUS.PENDING
    );
    const trackingLink = `${window.location.origin}/request-status?code=${trackingCode}`;

    if (
      (request.status || REQUEST_STATUS.PENDING) ===
      REQUEST_STATUS.AWAITING_PAYMENT
    ) {
      if (isRdpMode) {
        return `Halo, request ${title} sudah masuk slot batch RDP.\nStatus: ${statusLabel}\nSilakan checkout lewat link Shopee berikut (aktif 24 jam): ${request.shopeeCheckoutUrl || '-'}\nTracking: ${trackingLink}`;
      }
      return `Halo, request ${title} sudah selesai review awal.\nStatus: ${statusLabel}\nSilakan checkout lewat link Shopee berikut: ${request.shopeeCheckoutUrl || '-'}\nTracking: ${trackingLink}`;
    }

    if (
      (request.status || REQUEST_STATUS.PENDING) === REQUEST_STATUS.QUEUED &&
      isRdpMode
    ) {
      return `Halo, request ${title} sudah masuk antrean batch RDP.\nCheckout akan dibuka saat jadwal upload aktif.\nTracking: ${trackingLink}`;
    }

    return `Halo, update request ${title}.\nStatus saat ini: ${statusLabel}.\nTracking: ${trackingLink}`;
  };

  const copyBuyerUpdateMessage = async () => {
    await navigator.clipboard.writeText(buildBuyerUpdateMessage());
    await Swal.fire({
      icon: 'success',
      title: 'Template pesan disalin',
      timer: 900,
      showConfirmButton: false,
    });
  };

  const copyShopeeLink = async () => {
    if (!request.shopeeCheckoutUrl) return;
    await navigator.clipboard.writeText(request.shopeeCheckoutUrl);
  };

  const openShopeeLink = () => {
    if (!request.shopeeCheckoutUrl) return;
    window.open(request.shopeeCheckoutUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`bg-white rounded-xl p-5 border shadow-sm transition-all hover:shadow-md relative group
      ${request.isUrgent ? 'border-red-400 ring-1 ring-red-100' : 'border-slate-100'}
      ${request.status === REQUEST_STATUS.AWAITING_PAYMENT ? 'ring-1 ring-amber-200 bg-amber-50/30' : ''}
      ${request.status === REQUEST_STATUS.PAID ? 'ring-1 ring-green-200 bg-green-50/30' : ''}
      ${request.status === REQUEST_STATUS.PROCESSING ? 'ring-1 ring-blue-200 bg-blue-50/30' : ''}
      ${request.status === REQUEST_STATUS.UPLOADED ? 'bg-emerald-50/30 border-emerald-200' : ''}
      ${request.status === REQUEST_STATUS.NOT_AVAILABLE ? 'bg-amber-50/40 border-amber-200' : ''}
    `}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        {request.isUrgent && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-md flex items-center">
            <Zap size={10} className="mr-1 fill-red-700" /> URGENT
          </span>
        )}
        {request.isRdpBatch && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md flex items-center">
            <Server size={10} className="mr-1" /> RDP
          </span>
        )}
        {getStatusBadge()}
      </div>

      <div className="pr-24">
        <h3 className="font-bold text-slate-800 text-lg mb-1 line-clamp-1">
          {title}
        </h3>
        <div className="flex items-center text-xs text-slate-500 gap-4 mb-3">
          <span
            className={`flex items-center ${displayUser === 'Admin' ? 'text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded' : ''}`}
          >
            <User size={12} className="mr-1" /> {displayUser}
          </span>
          <span className="flex items-center">
            <Gamepad2 size={12} className="mr-1" /> {platform}
          </span>
          <span className="flex items-center">
            <Calendar size={12} className="mr-1" /> {dateDisplay}
          </span>
        </div>
        {request.notes && (
          <div className="bg-slate-50 p-2 rounded-lg text-xs text-slate-600 italic mb-4 border border-slate-100">
            &quot;{request.notes}&quot;
          </div>
        )}

        <div className="mb-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-slate-100 px-2 py-1 font-semibold text-slate-700">
              Jalur: {routeLabel}
            </span>
            {request.contactWhatsApp && (
              <span>WA: {request.contactWhatsApp}</span>
            )}
            {request.contactEmail && <span>Email: {request.contactEmail}</span>}
            {request.shopeeUsername && (
              <span>Shopee: {request.shopeeUsername}</span>
            )}
          </div>
        </div>

        <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <div className="flex items-center justify-between gap-2">
            <span>
              Tracking:{' '}
              <span className="font-bold text-slate-800">{trackingCode}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={copyTrackingCode}
                className="inline-flex items-center rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold hover:bg-white"
                title="Copy kode tracking"
              >
                <Copy size={12} className="mr-1" /> Kode
              </button>
              <button
                type="button"
                onClick={copyTrackingLink}
                className="inline-flex items-center rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold hover:bg-white"
                title="Copy link tracking"
              >
                <Link2 size={12} className="mr-1" /> Link
              </button>
              <button
                type="button"
                onClick={copyBuyerUpdateMessage}
                className="inline-flex items-center rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold hover:bg-white"
                title="Copy template update pembeli"
              >
                <MessageCircle size={12} className="mr-1" /> Pesan
              </button>
            </div>
          </div>
        </div>

        {request.shopeeCheckoutUrl && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-1">
                Checkout Shopee tersimpan untuk pembeli.
                {isRdpMode && request.checkoutDeadlineAt
                  ? ` Deadline: ${checkoutDeadlineText}`
                  : ''}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={copyShopeeLink}
                  className="inline-flex items-center rounded border border-amber-300 px-2 py-1 text-[11px] font-semibold hover:bg-white"
                >
                  <Copy size={12} className="mr-1" /> Link
                </button>
                <button
                  type="button"
                  onClick={openShopeeLink}
                  className="inline-flex items-center rounded border border-amber-300 px-2 py-1 text-[11px] font-semibold hover:bg-white"
                >
                  <ShoppingBag size={12} className="mr-1" /> Buka
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
        {(request.status || REQUEST_STATUS.PENDING) ===
          REQUEST_STATUS.PENDING && (
          <>
            <button
              onClick={handleMarkNotAvailable}
              className="text-amber-700 hover:text-amber-800 text-xs font-medium px-2 flex items-center"
            >
              <XCircle size={14} className="mr-1" /> Tidak Tersedia
            </button>
            <button
              onClick={handleMarkAsReviewing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm ml-auto flex items-center"
            >
              Mulai Review <ArrowRight size={14} className="ml-2" />
            </button>
          </>
        )}

        {request.status === REQUEST_STATUS.REVIEWING && (
          <>
            <button
              onClick={handleMarkNotAvailable}
              className="text-amber-700 hover:text-amber-800 text-xs font-medium px-2 flex items-center"
            >
              <XCircle size={14} className="mr-1" /> Tidak Tersedia
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleSetRdpBatchFlow}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center"
              >
                <Server size={14} className="mr-2" /> Batch RDP (&gt;20GB)
              </button>
              <button
                onClick={handleSetDirectFlow}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center"
              >
                Direct (&lt;=20GB) <ArrowRight size={14} className="ml-2" />
              </button>
            </div>
          </>
        )}

        {[
          REQUEST_STATUS.AWAITING_PAYMENT,
          REQUEST_STATUS.PAID,
          REQUEST_STATUS.QUEUED,
          REQUEST_STATUS.PROCESSING,
          REQUEST_STATUS.UPLOADED,
        ].includes(request.status) && (
          <>
            <div className="flex gap-2">
              <button
                onClick={toggleUrgent}
                className={`p-2 rounded-lg border ${request.isUrgent ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-400'}`}
                title="Set Urgent"
              >
                <Zap
                  size={16}
                  className={request.isUrgent ? 'fill-red-600' : ''}
                />
              </button>
            </div>
            <div className="flex gap-2 ml-auto items-center">
              {request.status === REQUEST_STATUS.AWAITING_PAYMENT && (
                <>
                  <button
                    onClick={handleBackToReview}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center"
                  >
                    <Pencil size={14} className="mr-1" /> Kembali Review
                  </button>
                  <button
                    onClick={handleEditCheckoutLink}
                    className="px-3 py-2 bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-bold rounded-lg shadow-sm flex items-center"
                  >
                    <ShoppingBag size={14} className="mr-2" /> Edit Link
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center"
                  >
                    <CheckCircle size={14} className="mr-2" /> Tandai Checkout
                  </button>
                </>
              )}

              {request.status === REQUEST_STATUS.QUEUED && isRdpMode && (
                <>
                  <button
                    onClick={handleBackToReview}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center"
                  >
                    <Pencil size={14} className="mr-1" /> Kembali Review
                  </button>
                  <button
                    onClick={handleOpenBatchCheckoutWindow}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm flex items-center"
                  >
                    <ShoppingBag size={14} className="mr-2" /> Buka Checkout 24
                    Jam
                  </button>
                </>
              )}

              {[REQUEST_STATUS.PAID, REQUEST_STATUS.QUEUED].includes(
                request.status
              ) &&
                (!isRdpMode || request.status === REQUEST_STATUS.PAID) && (
                  <>
                    <button
                      onClick={handleMarkNotAvailable}
                      className="p-2 text-slate-400 hover:text-amber-700 rounded-lg"
                      title="Tandai tidak tersedia"
                    >
                      <XCircle size={16} />
                    </button>
                    <button
                      onClick={handleStartUpload}
                      className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg shadow-sm flex items-center"
                    >
                      <Play size={14} className="mr-2 fill-slate-700" /> Start
                      Upload
                    </button>
                  </>
                )}
              {request.status === REQUEST_STATUS.PROCESSING && (
                <>
                  <button
                    onClick={handleCancelUpload}
                    className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-medium mr-2 flex items-center"
                    title="Batal"
                  >
                    <XCircle size={16} className="mr-1" /> Batal
                  </button>
                  <button
                    onClick={handleMarkAsUploaded}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center animate-pulse"
                  >
                    <CheckCircle size={14} className="mr-2" /> Tandai Selesai
                  </button>
                </>
              )}
              {request.status === REQUEST_STATUS.UPLOADED && (
                <button
                  onClick={() => onApproveClick(request)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center"
                >
                  <FileCheck size={14} className="mr-2" /> Finalisasi Katalog
                </button>
              )}
            </div>
          </>
        )}

        {[REQUEST_STATUS.AVAILABLE, REQUEST_STATUS.NOT_AVAILABLE].includes(
          request.status
        ) && (
          <div className="text-xs text-slate-500">
            Status final tersimpan. Gunakan kode tracking untuk update pembeli.
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCard;
