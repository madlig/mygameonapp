import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  ShoppingBagIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

const formatCurrency = (n) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n || 0);

const timeAgo = (date) => {
  if (!date) return '';
  const d = date?.toDate ? date.toDate() : new Date(date);
  const seconds = Math.floor((new Date() - d) / 1000);
  if (seconds < 60) return 'Baru saja';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}h lalu`;
  return `${Math.floor(days / 30)}bln lalu`;
};

export const DirectOrdersTable = ({
  orders = [],
  onSelectOrder,
  onUpdateStatus,
}) => {
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending_verification' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyEmail = (orderId, email, e) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWaLink = (order) => {
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

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchStatus =
        filterStatus === 'all' || order.status === filterStatus;
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        (order.invoiceId && order.invoiceId.toLowerCase().includes(q)) ||
        (order.buyerName && order.buyerName.toLowerCase().includes(q)) ||
        (order.buyerEmail && order.buyerEmail.toLowerCase().includes(q)) ||
        (order.buyerPhone && order.buyerPhone.toLowerCase().includes(q)) ||
        (order.items &&
          order.items.some((item) =>
            item.title?.toLowerCase().includes(q)
          ));
      return matchStatus && matchQuery;
    });
  }, [orders, filterStatus, searchQuery]);

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === 'pending_verification').length,
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => o.status === 'completed').length,
    [orders]
  );

  return (
    <div className="rounded-xl border border-[#2A2F39] bg-[#1A1F27] overflow-hidden shadow-lg">
      {/* Header Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[#2A2F39] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111317]/50">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFD100]/15 border border-[#FFD100]/30 grid place-items-center">
              <ShoppingBagIcon className="w-4 h-4 text-[#FFD100]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F3F4F6] uppercase tracking-wider flex items-center gap-2">
                Pesanan Web Langsung (QRIS Checkout)
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                    {pendingCount} Baru
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#7E8796] mt-0.5">
                Kelola pesanan instan dari pembeli web, verifikasi struk, dan kirim akses Google Drive
              </p>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Tabs */}
          <div className="flex items-center bg-[#111317] p-1 rounded-lg border border-[#2A2F39]">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#2A2F39] text-[#FFD100]'
                  : 'text-[#7E8796] hover:text-[#F3F4F6]'
              }`}
            >
              Semua ({orders.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending_verification')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filterStatus === 'pending_verification'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-[#7E8796] hover:text-[#F3F4F6]'
              }`}
            >
              <ClockIcon className="w-3.5 h-3.5" />
              Menunggu ({pendingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                filterStatus === 'completed'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-[#7E8796] hover:text-[#F3F4F6]'
              }`}
            >
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Selesai ({completedCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <MagnifyingGlassIcon className="w-4 h-4 text-[#7E8796] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari invoice / nama / email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#111317] border border-[#2A2F39] rounded-lg text-xs text-[#F3F4F6] placeholder-[#7E8796] focus:outline-none focus:border-[#FFD100]/60 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      {filteredOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#2A2F39] bg-[#111317]/70 text-[11px] font-bold text-[#7E8796] uppercase tracking-wider">
                <th className="py-3 px-4">Invoice & Waktu</th>
                <th className="py-3 px-4">Data Pembeli (Drive Email)</th>
                <th className="py-3 px-4">Item Pesanan</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4 text-center">Bukti Bayar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2F39]/60 text-xs">
              {filteredOrders.map((order) => {
                const isCompleted = order.status === 'completed';
                const hasProof =
                  order.paymentProofUrl &&
                  order.paymentProofUrl !== 'offline_preview';

                return (
                  <tr
                    key={order.id || order.invoiceId}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-[#202632] transition-colors cursor-pointer group"
                  >
                    {/* Invoice & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono font-bold text-[#FFD100] group-hover:underline">
                        {order.invoiceId}
                      </div>
                      <div className="text-[11px] text-[#7E8796] mt-0.5">
                        {timeAgo(order.createdAt)}
                      </div>
                    </td>

                    {/* Buyer Info */}
                    <td className="py-3.5 px-4 min-w-[200px]">
                      <div className="font-semibold text-[#F3F4F6]">
                        {order.buyerName}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-[#C8CFDA] font-mono truncate max-w-[180px]">
                          {order.buyerEmail}
                        </span>
                        <button
                          onClick={(e) =>
                            handleCopyEmail(order.id, order.buyerEmail, e)
                          }
                          title="Salin Email Google Drive"
                          className="p-1 rounded bg-[#111317] border border-[#2A2F39] text-[#7E8796] hover:text-[#FFD100] hover:border-[#FFD100]/50 transition-colors flex-shrink-0"
                        >
                          {copiedId === order.id ? (
                            <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[11px] text-[#7E8796] mt-0.5">
                        WA:{' '}
                        <a
                          href={`https://wa.me/${(order.buyerPhone || '').replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#FFD100] hover:underline"
                        >
                          {order.buyerPhone}
                        </a>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="space-y-1">
                        {(order.items || []).slice(0, 2).map((item, idx) => (
                          <div
                            key={idx}
                            className="text-[11px] text-[#C8CFDA] truncate"
                            title={item.title}
                          >
                            • {item.title}
                          </div>
                        ))}
                        {(order.items || []).length > 2 && (
                          <span className="text-[10px] text-[#7E8796] font-medium">
                            +{(order.items || []).length - 2} game lainnya
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-sm text-emerald-400">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </td>

                    {/* Payment Proof Thumbnail */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {hasProof ? (
                        <div className="inline-flex relative group/thumb">
                          <img
                            src={order.paymentProofUrl}
                            alt="Bukti"
                            className="w-10 h-10 object-cover rounded-lg border border-[#2A2F39] bg-[#111317]"
                          />
                          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <EyeIcon className="w-4 h-4 text-[#FFD100]" />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#7E8796] italic bg-[#111317] px-2 py-1 rounded border border-[#2A2F39]/50">
                          {order.paymentProofUrl === 'offline_preview'
                            ? 'Offline'
                            : 'Tanpa Struk'}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
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
                            Menunggu
                          </>
                        )}
                      </span>
                    </td>

                    {/* Quick Actions */}
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WA Link Button */}
                        <a
                          href={getWaLink(order)}
                          target="_blank"
                          rel="noreferrer"
                          title="Buka WA & Kirim Pesan Akses Drive"
                          className="p-1.5 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] transition-colors"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        </a>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => {
                            const next = isCompleted
                              ? 'pending_verification'
                              : 'completed';
                            onUpdateStatus(order.id, next);
                          }}
                          title={
                            isCompleted
                              ? 'Buka kembali status pesanan'
                              : 'Tandai selesai (Akses Drive telah dikirim)'
                          }
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isCompleted
                              ? 'bg-[#2A2F39] text-[#7E8796] hover:text-[#F3F4F6] border-[#373E4D]'
                              : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/40'
                          }`}
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>

                        {/* View Detail Modal Button */}
                        <button
                          onClick={() => onSelectOrder(order)}
                          title="Lihat Detail Lengkap & Foto"
                          className="p-1.5 rounded-lg bg-[#2A2F39] hover:bg-[#373E4D] text-[#C8CFDA] hover:text-[#FFD100] transition-colors"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 px-4">
          <ShoppingBagIcon className="w-10 h-10 mx-auto text-[#7E8796] opacity-40 mb-3" />
          <h3 className="text-sm font-bold text-[#F3F4F6]">
            {orders.length === 0
              ? 'Belum ada pesanan web langsung'
              : 'Tidak ada pesanan yang sesuai filter'}
          </h3>
          <p className="text-xs text-[#7E8796] mt-1 max-w-sm mx-auto">
            {orders.length === 0
              ? 'Pesanan QRIS checkout dari web akan otomatis muncul di sini secara real-time.'
              : 'Coba ganti filter status atau kata kunci pencarian Anda.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default DirectOrdersTable;
