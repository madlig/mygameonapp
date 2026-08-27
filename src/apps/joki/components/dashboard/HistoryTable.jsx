import React, { useState } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  CheckCircle2, 
  History, 
  Download, 
  Calendar, 
  Filter, 
  Search, 
  X, 
  RotateCcw, 
  DollarSign,
  Clock,
  Crown,
  Key,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import CredentialModal from '../modals/CredentialModal';

// Format date ONLY (Tanpa waktu/jam)
const formatDateOnly = (timestamp) => {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric", 
    month: "short", 
    year: "numeric"
  });
};

const formatDuration = (hours) => {
  const totalMinutes = Math.round(Number(hours) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}j ${m}m`;
  if (h > 0) return `${h} Jam`;
  return `${m} Menit`;
};

const formatRupiah = (value) => {
  return "Rp " + Number(value || 0).toLocaleString("id-ID");
};

// Clean helper to strictly display Basic, VIP, or VVIP
const getCleanService = (service) => {
  if (!service) return 'Basic';
  const s = service.toString().toUpperCase();
  if (s.includes('VVIP')) return 'VVIP';
  if (s.includes('VIP')) return 'VIP';
  return 'Basic';
};

// Clean helper to strictly display Slot Badge
const getCleanSlot = (customer) => {
  const srv = getCleanService(customer.service);
  if (srv === 'VVIP' || customer.slot === 'VVIP') return 'VVIP';
  if (srv === 'VIP' || customer.slot === 'VIP') return 'VIP';
  return customer.slot || '1';
};

const DATE_PRESETS = [
  { id: 'ALL', label: 'Semua Waktu' },
  { id: 'TODAY', label: 'Hari Ini' },
  { id: 'YESTERDAY', label: 'Kemarin' },
  { id: 'WEEK', label: '7 Hari Terakhir' },
  { id: 'MONTH', label: 'Bulan Ini' },
  { id: 'CUSTOM', label: 'Custom Tanggal' },
];

const HistoryTable = () => {
  const { 
    customers, 
    streamerMode, 
    isAdmin,
    activeWorkspace,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isWithinDateFilter,
    addJokiQueue,
    addToast
  } = useJoki();

  const [historySearch, setHistorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [credentialCustomer, setCredentialCustomer] = useState(null);
  const PAGE_SIZE = 10;

  if (!isAdmin || streamerMode) return null;

  // Filter finished transactions by Search Query & Date Filter
  const filteredFinished = customers
    .filter(c => {
      if (!c.finished) return false;
      
      // Date filter check
      const dateMatch = isWithinDateFilter(c.finishedTime || c.createdAt);
      if (!dateMatch) return false;

      // Search query check
      if (!historySearch.trim()) return true;
      const q = historySearch.toLowerCase().trim();
      const cleanService = getCleanService(c.service).toLowerCase();
      const cleanSlot = getCleanSlot(c).toString().toLowerCase();
      const username = (c.username || c.name || '').toLowerCase();
      const tiktok = (c.tiktokName || '').toLowerCase();

      return (
        username.includes(q) ||
        tiktok.includes(q) ||
        cleanService.includes(q) ||
        cleanSlot.includes(q)
      );
    })
    .sort((a, b) => (b.finishedTime || b.createdAt || 0) - (a.finishedTime || a.createdAt || 0));

  // 4 Core Financial & Operational Metrics (Computed ONLY from valid finished history)
  const totalOmsetValid = filteredFinished.reduce((sum, c) => sum + Number(c.price || 0), 0);
  const totalSuccessCount = filteredFinished.length;
  const totalPlaytimeHours = filteredFinished.reduce((sum, c) => sum + Number(c.duration || 0), 0);
  const vvipCount = filteredFinished.filter(c => getCleanService(c.service) === 'VVIP').length;
  const vipCount = filteredFinished.filter(c => getCleanService(c.service) === 'VIP').length;
  const basicCount = totalSuccessCount - vvipCount - vipCount;

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredFinished.length / PAGE_SIZE));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * PAGE_SIZE;
  const paginatedData = filteredFinished.slice(startIndex, startIndex + PAGE_SIZE);

  // Quick Re-Order (Joki Ulang) Handler
  const handleQuickReorder = async (customer) => {
    try {
      const dur = Number(customer.duration || 1);
      const srv = getCleanService(customer.service);
      const rate = srv === 'VVIP' ? 10000 : (srv === 'VIP' ? 6000 : 4000);
      const price = Math.round(dur * rate);

      await addJokiQueue({
        username: customer.username || customer.name,
        tiktokName: customer.tiktokName || '',
        passwordRoblox: customer.passwordRoblox || '',
        emailRoblox: customer.emailRoblox || '',
        service: srv,
        duration: dur,
        price: price,
        paymentStatus: 'Lunas',
        createdAt: Date.now()
      });

      addToast(`✓ ${customer.username || customer.name} (${srv}) berhasil masuk antrean baru (Joki Ulang)!`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Gagal melakukan joki ulang.', 'error');
    }
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (filteredFinished.length === 0) {
      addToast('Tidak ada data riwayat untuk diexport.', 'info');
      return;
    }

    const headers = [
      "No",
      "Tanggal Selesai",
      "Username Roblox",
      "Akun TikTok",
      "Layanan",
      "Slot",
      "Durasi (Jam)",
      "Harga (Rp)",
      "Status"
    ];

    const rows = filteredFinished.map((c, idx) => [
      idx + 1,
      formatDateOnly(c.finishedTime || c.createdAt),
      c.username || c.name || '-',
      c.tiktokName ? `@${c.tiktokName}` : '-',
      getCleanService(c.service),
      getCleanSlot(c),
      Number(c.duration || 1).toFixed(2),
      Number(c.price || 0),
      c.stopped ? "STOPPED" : "SELESAI (LUNAS)"
    ]);

    const csvContent = [headers]
      .concat(rows)
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `riwayat-joki-${activeWorkspace.id}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast('File CSV berhasil didownload!', 'success');
  };

  const handleResetCustomDates = () => {
    setCustomStartDate('');
    setCustomEndDate('');
  };

  return (
    <div className="mt-8 space-y-4">
      
      {/* 4 INSIGHT METRIC CARDS (VALID REVENUE & HISTORY ANALYTICS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Total Omset Valid */}
        <div className="p-4 rounded-2xl bg-bg-surface/90 border border-accent-yellow/30 shadow-lg shadow-accent-yellow/5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-text-tertiary">
              Total Omset Valid
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent-yellow/15 border border-accent-yellow/30 flex items-center justify-center text-accent-yellow">
              <DollarSign size={14} />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-accent-yellow">
            {formatRupiah(totalOmsetValid)}
          </div>
          <span className="text-[10px] text-text-dim font-bold block mt-0.5">
            Uang Riil Selesai (Lunas)
          </span>
        </div>

        {/* 2. Total Transaksi Sukses */}
        <div className="p-4 rounded-2xl bg-bg-surface/90 border border-border-default">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-text-tertiary">
              Transaksi Sukses
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent-green/15 border border-accent-green/30 flex items-center justify-center text-accent-green">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-text-primary">
            {totalSuccessCount} <span className="text-sm text-text-dim font-normal">Order</span>
          </div>
          <span className="text-[10px] text-text-dim font-bold block mt-0.5">
            Akun selesai dimainkan
          </span>
        </div>

        {/* 3. Total Jam Main (Playtime) */}
        <div className="p-4 rounded-2xl bg-bg-surface/90 border border-border-default">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-text-tertiary">
              Total Jam Joki
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan">
              <Clock size={14} />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-accent-cyan">
            {totalPlaytimeHours.toFixed(1)} <span className="text-sm text-text-dim font-normal">Jam</span>
          </div>
          <span className="text-[10px] text-text-dim font-bold block mt-0.5">
            Total jam terbang AFK
          </span>
        </div>

        {/* 4. Proporsi Layanan */}
        <div className="p-4 rounded-2xl bg-bg-surface/90 border border-border-default">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-text-tertiary">
              Proporsi Layanan
            </span>
            <div className="w-7 h-7 rounded-lg bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple-light">
              <Crown size={14} />
            </div>
          </div>
          <div className="text-sm font-black font-mono text-text-primary flex items-center gap-2 pt-0.5">
            <span className="text-accent-yellow">{vipCount} VIP</span>
            <span className="text-text-faint">•</span>
            <span className="text-accent-purple-light">{basicCount} Basic</span>
          </div>
          <span className="text-[10px] text-text-dim font-bold block mt-1">
            Rasio order penonton
          </span>
        </div>
      </div>

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 rounded-full bg-accent-purple" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary m-0 flex items-center gap-1.5">
            <History size={16} className="text-accent-purple" />
            <span>Riwayat Transaksi Joki Selesai</span>
          </h3>
          <span className="text-xs font-semibold text-text-faint ml-1">
            ({filteredFinished.length} data)
          </span>
        </div>

        {/* Search Input on History Table */}
        <div className="relative w-full md:w-[280px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint" />
          <input
            type="text"
            className="w-full bg-bg-surface border border-border-default rounded-xl py-2 pl-9 pr-8 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors shadow-sm"
            placeholder="Cari di riwayat transaksi..."
            value={historySearch}
            onChange={(e) => {
              setHistorySearch(e.target.value);
              setCurrentPage(1);
            }}
          />
          {historySearch && (
            <button
              onClick={() => {
                setHistorySearch('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary p-0.5"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Date Range Presets Toolbar */}
      <div className="bg-bg-surface/90 border border-border-default rounded-2xl p-3 space-y-2.5 shadow-md">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-extrabold text-text-tertiary px-1 flex items-center gap-1">
            <Filter size={13} className="text-accent-purple" />
            <span>Filter Periode:</span>
          </span>
          {DATE_PRESETS.map((preset) => {
            const isSelected = dateFilter === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setDateFilter(preset.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/20 scale-105'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-border-subtle hover:border-border-muted'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Polished Custom Date Range Picker */}
        {dateFilter === 'CUSTOM' && (
          <div className="p-3.5 bg-bg-primary/95 rounded-xl border border-accent-purple/30 flex flex-wrap items-center gap-3 animate-slide-in shadow-inner">
            {/* Start Date */}
            <div 
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input && input.showPicker) input.showPicker();
              }}
              className="flex items-center gap-2 bg-bg-surface hover:bg-white/[0.04] border border-border-default hover:border-accent-cyan/50 rounded-xl px-3 py-2 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-6 h-6 rounded-lg bg-accent-cyan/15 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan shrink-0">
                <Calendar size={13} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary">Dari Tanggal:</div>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="bg-transparent text-xs text-text-primary font-bold font-mono outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-90 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>
            </div>

            <span className="text-text-dim font-bold text-xs">➔</span>

            {/* End Date */}
            <div 
              onClick={(e) => {
                const input = e.currentTarget.querySelector('input');
                if (input && input.showPicker) input.showPicker();
              }}
              className="flex items-center gap-2 bg-bg-surface hover:bg-white/[0.04] border border-border-default hover:border-accent-cyan/50 rounded-xl px-3 py-2 transition-all cursor-pointer shadow-sm group"
            >
              <div className="w-6 h-6 rounded-lg bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple-light shrink-0">
                <Calendar size={13} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-text-tertiary">Sampai Tanggal:</div>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ colorScheme: 'dark' }}
                  className="bg-transparent text-xs text-text-primary font-bold font-mono outline-none cursor-pointer [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-90 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                />
              </div>
            </div>

            {/* Reset Button */}
            {(customStartDate || customEndDate) && (
              <button
                type="button"
                onClick={handleResetCustomDates}
                className="flex items-center gap-1.5 text-xs font-bold text-text-dim hover:text-accent-red px-3 py-2 rounded-xl hover:bg-accent-red/10 border border-transparent hover:border-accent-red/20 transition-all ml-auto cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset Tanggal</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Table Wrapper */}
      <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[950px]">
            <thead>
              <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">No</th>
                <th className="py-3 px-3.5">Tanggal Selesai</th>
                <th className="py-3 px-3.5">Username Roblox</th>
                <th className="py-3 px-3.5">Akun TikTok</th>
                <th className="py-3 px-3 text-center">Layanan</th>
                <th className="py-3 px-3 text-center">Slot</th>
                <th className="py-3 px-3 text-center">Durasi</th>
                <th className="py-3 px-3.5 text-center">Harga (Lunas)</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3 text-center w-36">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-medium">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-text-dim">
                    {historySearch 
                      ? `Tidak ditemukan transaksi dengan kata kunci "${historySearch}".`
                      : 'Belum ada riwayat transaksi pada filter tanggal ini.'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((customer, index) => {
                  const cleanService = getCleanService(customer.service);
                  const isVIP = cleanService === 'VIP';
                  const cleanSlot = getCleanSlot(customer);
                  const globalIndex = startIndex + index + 1;

                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-text-faint font-mono">
                        {globalIndex}
                      </td>

                      {/* Tanggal Selesai */}
                      <td className="py-3 px-3.5 text-text-secondary font-mono font-bold">
                        {formatDateOnly(customer.finishedTime || customer.createdAt)}
                      </td>
                      
                      {/* Roblox Username */}
                      <td className="py-3 px-3.5 font-bold text-text-primary">
                        <span className="font-extrabold text-sm tracking-tight text-white">
                          {customer.username || customer.name}
                        </span>
                      </td>

                      {/* TikTok Account */}
                      <td className="py-3 px-3.5 text-text-muted">
                        {customer.tiktokName ? `@${customer.tiktokName}` : '-'}
                      </td>

                      {/* Layanan */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${
                          isVVIP
                            ? 'text-rose-400 bg-rose-500/15 border border-rose-500/40 shadow-sm shadow-rose-500/10'
                            : isVIP 
                            ? 'text-accent-yellow bg-accent-yellow/15 border border-accent-yellow/30' 
                            : 'text-accent-purple-light bg-accent-purple/15 border border-accent-purple/30'
                        }`}>
                          {isVVIP ? '💎 VVIP' : (isVIP ? '👑 VIP' : cleanService)}
                        </span>
                      </td>

                      {/* Slot */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded text-[10.5px] font-extrabold font-mono ${
                          cleanSlot === 'VVIP'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                            : cleanSlot === 'VIP'
                            ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30'
                            : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                        }`}>
                          {cleanSlot === 'VVIP' ? '💎 VVIP' : (cleanSlot === 'VIP' ? '👑 VIP' : `SLOT ${cleanSlot}`)}
                        </span>
                      </td>

                      {/* Durasi */}
                      <td className="py-3 px-3 text-center text-text-secondary font-mono">
                        {formatDuration(customer.duration)}
                      </td>

                      {/* Harga */}
                      <td className="py-3 px-3.5 text-center font-bold text-accent-yellow font-mono">
                        {formatRupiah(customer.price)}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          customer.stopped 
                            ? 'bg-accent-red/15 text-accent-red border border-accent-red/30' 
                            : 'bg-accent-green/15 text-accent-green border border-accent-green/30'
                        }`}>
                          <CheckCircle2 size={11} />
                          {customer.stopped ? 'STOPPED' : 'SELESAI (LUNAS)'}
                        </span>
                      </td>

                      {/* Actions: Joki Ulang & Brankas */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Re-Order */}
                          <button
                            type="button"
                            onClick={() => handleQuickReorder(customer)}
                            title="Joki Ulang (Masukkan ke antrian baru otomatis)"
                            className="px-2 py-1 rounded-lg bg-accent-purple/15 hover:bg-accent-purple/25 text-accent-purple-light border border-accent-purple/30 text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw size={11} />
                            <span>Joki Lagi</span>
                          </button>

                          {/* Brankas */}
                          <button
                            type="button"
                            onClick={() => setCredentialCustomer(customer)}
                            title="Buka data login di brankas"
                            className="p-1.5 rounded-lg bg-bg-primary hover:bg-accent-green/20 text-accent-green border border-border-default hover:border-accent-green/30 transition-all cursor-pointer"
                          >
                            <Key size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION TOOLBAR (10 ITEMS PER PAGE) */}
        {filteredFinished.length > 0 && (
          <div className="p-3 bg-bg-primary/95 border-t border-border-default flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-text-muted font-medium">
              Menampilkan <strong className="text-white">{startIndex + 1}</strong> - <strong className="text-white">{Math.min(startIndex + PAGE_SIZE, filteredFinished.length)}</strong> dari <strong className="text-white">{filteredFinished.length}</strong> transaksi
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={validCurrentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-bg-surface border border-border-default text-xs font-bold text-text-secondary hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} />
                <span>Sebelumnya</span>
              </button>

              <span className="px-3 py-1 text-xs font-mono font-bold text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 rounded-xl">
                {validCurrentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={validCurrentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="px-3 py-1.5 rounded-xl bg-bg-surface hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-bg-surface border border-border-default text-xs font-bold text-text-secondary hover:text-white transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Selanjutnya</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: Export CSV Button */}
      {filteredFinished.length > 0 && (
        <div className="flex justify-end pt-1">
          <button
            onClick={handleExportCSV}
            title="Download riwayat transaksi terfilter ke format CSV"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/35 text-accent-cyan font-black text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-accent-cyan/10"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
        </div>
      )}

      {/* Credential Popover Modal */}
      {credentialCustomer && (
        <CredentialModal
          customer={credentialCustomer}
          onClose={() => setCredentialCustomer(null)}
        />
      )}
    </div>
  );
};

export default HistoryTable;
