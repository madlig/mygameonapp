import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { CheckCircle2, History, Download, Calendar, Filter } from 'lucide-react';

// Format date ONLY (Tanpa waktu/jam) sesuai permintaan user
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

// Clean helper to strictly display Basic or VIP
const getCleanService = (service) => {
  if (!service) return 'Basic';
  return service.toString().toUpperCase().includes('VIP') ? 'VIP' : 'Basic';
};

// Clean helper to strictly display Slot Badge
const getCleanSlot = (customer) => {
  const isVIP = getCleanService(customer.service) === 'VIP' || customer.slot === 'VIP';
  if (isVIP) return 'VIP';
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
    addToast
  } = useJoki();

  if (!isAdmin || streamerMode) return null;

  // Filter finished transactions by date range
  const filteredFinished = customers
    .filter(c => c.finished && isWithinDateFilter(c.finishedTime || c.createdAt))
    .sort((a, b) => (b.finishedTime || b.createdAt || 0) - (a.finishedTime || a.createdAt || 0));

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

  return (
    <div className="mt-7">
      {/* Header & Date Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-4 rounded-full bg-accent-purple" />
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary m-0 flex items-center gap-1.5">
            <History size={16} className="text-accent-purple" />
            <span>Riwayat Joki Selesai (Lunas)</span>
          </h3>
          <span className="text-xs font-semibold text-text-faint ml-2">
            ({filteredFinished.length} data)
          </span>
        </div>

        {/* Action: Export CSV Button */}
        <button
          onClick={handleExportCSV}
          title="Download laporan riwayat transaksi ke file CSV/Excel"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-cyan/15 hover:bg-accent-cyan/25 border border-accent-cyan/30 text-accent-cyan font-bold text-xs transition-all cursor-pointer shadow-sm w-fit"
        >
          <Download size={13} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Date Range Filter Bar */}
      <div className="bg-bg-surface/80 border border-border-default rounded-xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-text-tertiary px-1 flex items-center gap-1">
            <Filter size={12} className="text-accent-purple" />
            <span>Filter Tanggal:</span>
          </span>
          {DATE_PRESETS.map((preset) => {
            const isSelected = dateFilter === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setDateFilter(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-purple text-white shadow-sm shadow-accent-purple/20'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Range Picker */}
        {dateFilter === 'CUSTOM' && (
          <div className="flex items-center gap-1.5 bg-bg-primary p-1.5 rounded-lg border border-border-subtle">
            <Calendar size={12} className="text-accent-cyan" />
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="bg-bg-surface border border-border-default rounded px-2 py-0.5 text-xs text-text-primary outline-none"
            />
            <span className="text-text-dim">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="bg-bg-surface border border-border-default rounded px-2 py-0.5 text-xs text-text-primary outline-none"
            />
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
                {/* TANGGAL SELESAI DI PALING KIRI SETELAH NO (HANYA TANGGAL TANPA JAM) */}
                <th className="py-3 px-3.5">Tanggal Selesai</th>
                <th className="py-3 px-3.5">Username Roblox</th>
                <th className="py-3 px-3.5">Akun TikTok</th>
                {/* LAYANAN DAN SLOT BERSEBELAHAN */}
                <th className="py-3 px-3 text-center">Layanan</th>
                <th className="py-3 px-3 text-center">Slot</th>
                <th className="py-3 px-3 text-center">Durasi</th>
                <th className="py-3 px-3.5 text-center">Harga (Lunas)</th>
                <th className="py-3 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-medium">
              {filteredFinished.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-10 text-center text-text-dim">
                    Belum ada riwayat joki pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                filteredFinished.map((customer, index) => {
                  const cleanService = getCleanService(customer.service);
                  const isVIP = cleanService === 'VIP';
                  const cleanSlot = getCleanSlot(customer);

                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      {/* No */}
                      <td className="py-3 px-3 text-center text-text-faint font-mono">
                        {index + 1}
                      </td>

                      {/* Tanggal Selesai (HANYA TANGGAL) */}
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
                          isVIP 
                            ? 'text-accent-yellow bg-accent-yellow/15 border border-accent-yellow/30' 
                            : 'text-accent-purple-light bg-accent-purple/15 border border-accent-purple/30'
                        }`}>
                          {cleanService}
                        </span>
                      </td>

                      {/* Slot (Bersebelahan dengan Layanan) */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded text-[10.5px] font-extrabold font-mono ${
                          isVIP
                            ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30'
                            : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                        }`}>
                          {cleanSlot === 'VIP' ? '👑 VIP' : `SLOT ${cleanSlot}`}
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryTable;
