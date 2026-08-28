import React, { useState } from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { 
  CheckCircle2, 
  History, 
  Download, 
  Search, 
  DollarSign,
  Clock,
  Crown,
  Key,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
  Trophy
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
    deleteJokiCustomer,
    addToast
  } = useJoki();

  // Tab State: 'RECORDS' | 'LEADERBOARD'
  const [activeTab, setActiveTab] = useState('RECORDS');
  const [historySearch, setHistorySearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [credentialCustomer, setCredentialCustomer] = useState(null);
  const PAGE_SIZE = 10;

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

  // Leaderboard Calculation (Aggregated from ALL finished history)
  const customerAggregates = {};
  customers.filter(c => c.finished).forEach(c => {
    const key = (c.username || c.name || 'Anonymous').trim();
    if (!key) return;

    if (!customerAggregates[key]) {
      customerAggregates[key] = {
        username: key,
        tiktokName: c.tiktokName || '',
        totalOrders: 0,
        totalDuration: 0,
        totalSpent: 0,
        vvipCount: 0,
        vipCount: 0,
        basicCount: 0,
        lastOrderedAt: c.finishedTime || c.createdAt || 0
      };
    }
    customerAggregates[key].totalOrders += 1;
    customerAggregates[key].totalDuration += Number(c.duration || 0);
    customerAggregates[key].totalSpent += Number(c.price || 0);
    if (c.tiktokName && !customerAggregates[key].tiktokName) {
      customerAggregates[key].tiktokName = c.tiktokName;
    }
    const srv = getCleanService(c.service);
    if (srv === 'VVIP') customerAggregates[key].vvipCount += 1;
    else if (srv === 'VIP') customerAggregates[key].vipCount += 1;
    else customerAggregates[key].basicCount += 1;
    if ((c.finishedTime || c.createdAt || 0) > customerAggregates[key].lastOrderedAt) {
      customerAggregates[key].lastOrderedAt = c.finishedTime || c.createdAt || 0;
    }
  });

  const leaderboardList = Object.values(customerAggregates)
    .sort((a, b) => b.totalDuration - a.totalDuration || b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent);

  // Delete Finished History Row
  const handleDeleteHistory = async (customer) => {
    const name = customer.username || customer.name;
    if (window.confirm(`Hapus transaksi riwayat ${name}? Transaksi ini akan dihapus permanen dari rekap omset.`)) {
      try {
        await deleteJokiCustomer(customer.id);
        addToast(`✓ Riwayat transaksi ${name} berhasil dihapus.`, 'info');
      } catch (err) {
        console.error(err);
        addToast('Gagal menghapus riwayat transaksi.', 'error');
      }
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredFinished.length === 0) {
      addToast('Tidak ada data riwayat untuk diexport.', 'info');
      return;
    }

    const headers = ["No", "Tanggal Selesai", "Username Roblox", "Akun TikTok", "Layanan", "Slot", "Durasi (Jam)", "Harga (Rp)", "Status"];
    const rows = filteredFinished.map((c, idx) => [
      idx + 1,
      formatDateOnly(c.finishedTime || c.createdAt),
      `"${(c.username || c.name || '').replace(/"/g, '""')}"`,
      `"${(c.tiktokName || '-').replace(/"/g, '""')}"`,
      getCleanService(c.service),
      getCleanSlot(c),
      Number(c.duration || 0).toFixed(1),
      Number(c.price || 0),
      c.stopped ? 'STOPPED' : 'SELESAI (LUNAS)'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Joki_${activeWorkspace?.name || 'Kadal_Gaming'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Laporan CSV berhasil didownload!', 'success');
  };

  const handleResetCustomDates = () => {
    setCustomStartDate('');
    setCustomEndDate('');
    setDateFilter('ALL');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header with Tab Switcher & Export */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-bg-surface/80 backdrop-blur-md p-4 rounded-2xl border border-border-default shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple shrink-0">
            <History size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-white m-0 tracking-tight flex items-center gap-2">
              <span>Pusat Riwayat & Loyalitas</span>
            </h2>
            <p className="text-[11px] text-text-muted m-0">
              Laporan transaksi selesai dan papan peringkat pelanggan terloyal
            </p>
          </div>
        </div>

        {/* Tab Switcher & Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-bg-primary rounded-xl border border-border-default">
            <button
              type="button"
              onClick={() => setActiveTab('RECORDS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'RECORDS'
                  ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/20'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <History size={13} />
              <span>Riwayat ({filteredFinished.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('LEADERBOARD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'LEADERBOARD'
                  ? 'bg-accent-yellow text-black shadow-md shadow-accent-yellow/20'
                  : 'text-text-secondary hover:text-white'
              }`}
            >
              <Crown size={13} />
              <span>👑 Top Sultan ({leaderboardList.length})</span>
            </button>
          </div>

          {activeTab === 'RECORDS' && isAdmin && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 text-accent-cyan border border-accent-cyan/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Download size={13} />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: RIWAYAT TRANSAKSI TAB */}
      {activeTab === 'RECORDS' && (
        <div className="space-y-4">
          {/* Summary Metric Cards (Admin Mode) */}
          {isAdmin && !streamerMode && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-bg-surface/90 border border-accent-yellow/25 rounded-2xl p-3.5 shadow-sm">
                <div className="text-[10px] font-black uppercase text-accent-yellow flex items-center gap-1 mb-1">
                  <DollarSign size={13} />
                  <span>Total Omset Selesai</span>
                </div>
                <div className="text-lg font-black font-mono text-accent-yellow">
                  {formatRupiah(totalOmsetValid)}
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">Dari transaksi lunas valid</div>
              </div>

              <div className="bg-bg-surface/90 border border-border-default rounded-2xl p-3.5 shadow-sm">
                <div className="text-[10px] font-black uppercase text-text-tertiary flex items-center gap-1 mb-1">
                  <CheckCircle2 size={13} className="text-accent-green" />
                  <span>Total Order Selesai</span>
                </div>
                <div className="text-lg font-black font-mono text-white">
                  {totalSuccessCount} Akun
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">{basicCount} Basic • {vipCount} VIP • {vvipCount} VVIP</div>
              </div>

              <div className="bg-bg-surface/90 border border-border-default rounded-2xl p-3.5 shadow-sm">
                <div className="text-[10px] font-black uppercase text-text-tertiary flex items-center gap-1 mb-1">
                  <Clock size={13} className="text-accent-cyan" />
                  <span>Total Jam Main</span>
                </div>
                <div className="text-lg font-black font-mono text-accent-cyan">
                  {totalPlaytimeHours.toFixed(1)} Jam
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">Akumulasi bermain live</div>
              </div>

              <div className="bg-bg-surface/90 border border-border-default rounded-2xl p-3.5 shadow-sm">
                <div className="text-[10px] font-black uppercase text-text-tertiary flex items-center gap-1 mb-1">
                  <Sparkles size={13} className="text-rose-400" />
                  <span>Order VIP / VVIP</span>
                </div>
                <div className="text-lg font-black font-mono text-rose-400">
                  {vvipCount + vipCount} Akun
                </div>
                <div className="text-[10px] text-text-dim mt-0.5">{vvipCount} VVIP (10k) • {vipCount} VIP (6k)</div>
              </div>
            </div>
          )}

          {/* Filter & Search Bar */}
          <div className="bg-bg-surface/90 border border-border-default rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            {/* Date Preset Filter Chips */}
            <div className="flex flex-wrap items-center gap-1">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setDateFilter(preset.id);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    dateFilter === preset.id
                      ? 'bg-accent-purple text-white shadow font-extrabold'
                      : 'bg-white/5 text-text-secondary hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
              <input
                type="text"
                placeholder="Cari username / TikTok / slot..."
                value={historySearch}
                onChange={(e) => {
                  setHistorySearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#151821] border border-border-default rounded-xl py-1.5 pl-8 pr-3 text-xs text-white outline-none focus:border-accent-purple/50"
              />
            </div>
          </div>

          {/* Table View */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[900px]">
                <thead>
                  <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[10.5px] font-black uppercase tracking-wider">
                    <th className="py-3 px-3 text-center w-10">No</th>
                    <th className="py-3 px-3.5">Tanggal Selesai</th>
                    <th className="py-3 px-3.5">Username Roblox</th>
                    <th className="py-3 px-3.5">Akun TikTok</th>
                    <th className="py-3 px-3 text-center">Layanan</th>
                    <th className="py-3 px-3 text-center">Slot</th>
                    <th className="py-3 px-3 text-center">Durasi</th>
                    <th className="py-3 px-3.5 text-center">Harga</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3 text-center w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs font-medium">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="py-12 text-center text-text-dim">
                        {historySearch 
                          ? `Tidak ditemukan transaksi dengan kata kunci "${historySearch}".`
                          : 'Belum ada riwayat transaksi pada filter ini.'}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((customer, index) => {
                      const cleanService = getCleanService(customer.service);
                      const isVVIP = cleanService === 'VVIP';
                      const isVIP = !isVVIP && cleanService === 'VIP';
                      const cleanSlot = getCleanSlot(customer);
                      const globalIndex = startIndex + index + 1;

                      return (
                        <tr 
                          key={customer.id} 
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          {/* No */}
                          <td className="py-3 px-3 text-center text-text-dim font-mono">
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
                              <span>{customer.stopped ? 'STOPPED' : 'SELESAI'}</span>
                            </span>
                          </td>

                          {/* Actions: Brankas & Hapus (Tanpa Tombol Joki Lagi) */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Brankas */}
                              <button
                                type="button"
                                onClick={() => setCredentialCustomer(customer)}
                                title="Buka data login di brankas"
                                className="p-1.5 rounded-lg bg-bg-primary hover:bg-accent-green/20 text-accent-green border border-border-default hover:border-accent-green/30 transition-all cursor-pointer"
                              >
                                <Key size={12} />
                              </button>

                              {/* Hapus Riwayat Transaksi */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHistory(customer)}
                                  title="Hapus riwayat transaksi ini"
                                  className="p-1.5 rounded-lg bg-bg-primary hover:bg-accent-red/20 text-text-dim hover:text-accent-red border border-border-default hover:border-accent-red/30 transition-all cursor-pointer"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-bg-primary/90 border-t border-border-default flex items-center justify-between text-xs">
                <span className="text-text-dim">
                  Halaman <strong className="text-white">{validCurrentPage}</strong> dari <strong className="text-white">{totalPages}</strong> ({filteredFinished.length} data)
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={validCurrentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <button
                    type="button"
                    disabled={validCurrentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: LEADERBOARD TOP PELANGGAN SULTAN TAB */}
      {activeTab === 'LEADERBOARD' && (
        <div className="space-y-4">
          {/* Top 3 Podium Cards */}
          {leaderboardList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* JUARA 2 (Silver) */}
              {leaderboardList[1] && (
                <div className="bg-gradient-to-b from-slate-400/10 to-bg-surface border border-slate-400/30 rounded-3xl p-4 text-center shadow-lg relative order-2 md:order-1">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-slate-400/20 border border-slate-400/40 flex items-center justify-center text-slate-300 font-black text-sm mb-2 shadow">
                    🥈 #2
                  </div>
                  <h4 className="text-base font-black text-white m-0 truncate">
                    {leaderboardList[1].username}
                  </h4>
                  <div className="text-xs text-slate-300 font-bold mt-0.5">
                    {leaderboardList[1].tiktokName ? `@${leaderboardList[1].tiktokName}` : 'Sultan Perak'}
                  </div>
                  <div className="mt-3 py-2 px-3 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-text-dim block">Total Order</span>
                      <strong className="text-white">{leaderboardList[1].totalOrders}x</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dim block">Jam Main</span>
                      <strong className="text-slate-300">{leaderboardList[1].totalDuration.toFixed(1)} Jam</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* JUARA 1 (Gold Crown) */}
              {leaderboardList[0] && (
                <div className="bg-gradient-to-b from-accent-yellow/20 via-accent-yellow/5 to-bg-surface border-2 border-accent-yellow/50 rounded-3xl p-5 text-center shadow-2xl shadow-accent-yellow/10 relative order-1 md:order-2 scale-[1.03]">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-accent-yellow text-black font-black text-[10px] uppercase tracking-wider flex items-center gap-1 shadow-lg">
                    <Crown size={12} />
                    <span>Sultan Utama Live</span>
                  </div>
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-accent-yellow/25 border-2 border-accent-yellow/50 flex items-center justify-center text-accent-yellow font-black text-base mb-2 shadow-lg">
                    🥇 #1
                  </div>
                  <h3 className="text-lg font-black text-white m-0 truncate">
                    {leaderboardList[0].username}
                  </h3>
                  <div className="text-xs text-accent-yellow font-bold mt-0.5">
                    {leaderboardList[0].tiktokName ? `@${leaderboardList[0].tiktokName}` : '👑 Sultan of the Stream'}
                  </div>
                  <div className="mt-3 py-2 px-3 rounded-2xl bg-accent-yellow/10 border border-accent-yellow/25 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-accent-yellow/80 block">Total Order</span>
                      <strong className="text-white text-sm">{leaderboardList[0].totalOrders}x Order</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-accent-yellow/80 block">Total Jam Main</span>
                      <strong className="text-accent-yellow text-sm">{leaderboardList[0].totalDuration.toFixed(1)} Jam</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* JUARA 3 (Bronze) */}
              {leaderboardList[2] && (
                <div className="bg-gradient-to-b from-amber-700/15 to-bg-surface border border-amber-600/30 rounded-3xl p-4 text-center shadow-lg relative order-3">
                  <div className="w-10 h-10 mx-auto rounded-2xl bg-amber-700/20 border border-amber-600/40 flex items-center justify-center text-amber-400 font-black text-sm mb-2 shadow">
                    🥉 #3
                  </div>
                  <h4 className="text-base font-black text-white m-0 truncate">
                    {leaderboardList[2].username}
                  </h4>
                  <div className="text-xs text-amber-400 font-bold mt-0.5">
                    {leaderboardList[2].tiktokName ? `@${leaderboardList[2].tiktokName}` : 'Sultan Perunggu'}
                  </div>
                  <div className="mt-3 py-2 px-3 rounded-2xl bg-white/5 border border-white/5 grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-text-dim block">Total Order</span>
                      <strong className="text-white">{leaderboardList[2].totalOrders}x</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-dim block">Jam Main</span>
                      <strong className="text-amber-400">{leaderboardList[2].totalDuration.toFixed(1)} Jam</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-3 bg-bg-primary/90 border-b border-border-default flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy size={14} className="text-accent-yellow" />
                <span>Peringkat Pelanggan Terloyal</span>
              </span>
              <span className="text-[10.5px] font-mono text-text-dim">
                Total {leaderboardList.length} Customer
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left min-w-[700px]">
                <thead>
                  <tr className="bg-bg-primary/50 border-b border-border-default text-text-tertiary text-[10.5px] font-black uppercase tracking-wider">
                    <th className="py-3 px-4 text-center w-14">Rank</th>
                    <th className="py-3 px-4">Username Roblox</th>
                    <th className="py-3 px-4">Akun TikTok</th>
                    <th className="py-3 px-4 text-center">Total Order</th>
                    <th className="py-3 px-4 text-center">Total Durasi</th>
                    <th className="py-3 px-4 text-right">Layanan Terbanyak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs font-medium font-mono">
                  {leaderboardList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-text-dim font-sans">
                        Belum ada data pelanggan joki yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    leaderboardList.map((item, idx) => (
                      <tr 
                        key={item.username} 
                        className={`hover:bg-white/[0.02] transition-colors ${
                          idx === 0 ? 'bg-accent-yellow/[0.04]' : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-3 px-4 text-center">
                          {idx === 0 ? (
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-accent-yellow text-black font-black text-xs shadow">
                              🥇 #1
                            </span>
                          ) : idx === 1 ? (
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-400 text-black font-black text-xs shadow">
                              🥈 #2
                            </span>
                          ) : idx === 2 ? (
                            <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-700 text-white font-black text-xs shadow">
                              🥉 #3
                            </span>
                          ) : (
                            <span className="font-bold text-text-dim text-xs font-mono">
                              #{idx + 1}
                            </span>
                          )}
                        </td>

                        {/* Roblox Username */}
                        <td className="py-3 px-4 font-bold font-sans text-sm text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{item.username}</span>
                            {item.totalOrders >= 5 && (
                              <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-accent-yellow/20 text-accent-yellow border border-accent-yellow/30">
                                👑 SULTAN
                              </span>
                            )}
                          </div>
                        </td>

                        {/* TikTok Account */}
                        <td className="py-3 px-4 font-sans text-text-muted">
                          {item.tiktokName ? (
                            <span className="text-accent-cyan font-bold">@{item.tiktokName}</span>
                          ) : (
                            <span className="text-text-dim">-</span>
                          )}
                        </td>

                        {/* Total Order */}
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-white px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                            {item.totalOrders}x Order
                          </span>
                        </td>

                        {/* Total Duration */}
                        <td className="py-3 px-4 text-center font-bold text-accent-cyan">
                          {item.totalDuration.toFixed(1)} Jam
                        </td>

                        {/* Breakdown */}
                        <td className="py-3 px-4 text-right font-sans text-[11px] text-text-muted">
                          {item.vvipCount > 0 && <span className="text-rose-400 mr-1.5 font-bold">💎 {item.vvipCount} VVIP</span>}
                          {item.vipCount > 0 && <span className="text-accent-yellow mr-1.5 font-bold">👑 {item.vipCount} VIP</span>}
                          {item.basicCount > 0 && <span className="text-text-secondary font-bold">🎮 {item.basicCount} Basic</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Credential Modal for Viewing Password/Email */}
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
