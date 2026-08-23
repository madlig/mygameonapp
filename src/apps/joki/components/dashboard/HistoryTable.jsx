import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { CheckCircle2, History } from 'lucide-react';

const formatDateTime = (timestamp) => {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleString("id-ID", {
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit", 
    minute: "2-digit", 
    second: "2-digit", 
    hour12: false
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

const HistoryTable = () => {
  const { customers, streamerMode, isAdmin } = useJoki();

  if (!isAdmin || streamerMode) return null;

  const finished = customers
    .filter(c => c.finished)
    .sort((a, b) => (b.finishedTime || b.createdAt || 0) - (a.finishedTime || a.createdAt || 0));

  return (
    <div className="mt-7">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-2 h-4 rounded-full bg-accent-purple" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-text-primary m-0 flex items-center gap-1.5">
          <History size={16} className="text-accent-purple" />
          <span>Riwayat Joki Selesai (Lunas)</span>
        </h3>
        <span className="text-xs font-semibold text-text-faint ml-auto">
          {finished.length} transaksi selesai
        </span>
      </div>

      <div className="bg-bg-surface border border-border-default rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[950px]">
            <thead>
              <tr className="bg-bg-primary/90 border-b border-border-default text-text-tertiary text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3 px-3.5 text-center w-10">No</th>
                <th className="py-3 px-3.5 text-center">Slot</th>
                <th className="py-3 px-3.5">Username Roblox</th>
                <th className="py-3 px-3.5">Akun TikTok</th>
                <th className="py-3 px-3.5 text-center">Layanan</th>
                <th className="py-3 px-3.5 text-center">Durasi</th>
                <th className="py-3 px-3.5 text-center">Harga (Lunas)</th>
                <th className="py-3 px-3.5 text-center">Mulai</th>
                <th className="py-3 px-3.5 text-center">Selesai / Stop</th>
                <th className="py-3 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs font-medium">
              {finished.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-10 text-center text-text-dim">
                    Belum ada riwayat joki yang selesai.
                  </td>
                </tr>
              ) : (
                finished.map((customer, index) => {
                  const cleanService = getCleanService(customer.service);
                  const isVIP = cleanService === 'VIP';
                  const cleanSlot = getCleanSlot(customer);

                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center text-text-faint font-mono">
                        {index + 1}
                      </td>

                      {/* Slot */}
                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-flex items-center justify-center min-w-[28px] px-1.5 py-0.5 rounded text-[10.5px] font-extrabold font-mono ${
                          isVIP
                            ? 'bg-accent-yellow/10 text-accent-yellow border border-accent-yellow/30'
                            : 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30'
                        }`}>
                          {cleanSlot === 'VIP' ? '👑 VIP' : `SLOT ${cleanSlot}`}
                        </span>
                      </td>
                      
                      <td className="py-3 px-3.5 font-bold text-text-primary">
                        {customer.username || customer.name}
                      </td>

                      <td className="py-3 px-3.5 text-text-muted">
                        {customer.tiktokName ? `@${customer.tiktokName}` : '-'}
                      </td>

                      <td className="py-3 px-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold uppercase ${
                          isVIP 
                            ? 'text-accent-yellow bg-accent-yellow/15 border border-accent-yellow/30' 
                            : 'text-accent-purple-light bg-accent-purple/15 border border-accent-purple/30'
                        }`}>
                          {cleanService}
                        </span>
                      </td>

                      <td className="py-3 px-3.5 text-center text-text-secondary font-mono">
                        {formatDuration(customer.duration)}
                      </td>

                      <td className="py-3 px-3.5 text-center font-bold text-accent-yellow font-mono">
                        {formatRupiah(customer.price)}
                      </td>

                      <td className="py-3 px-3.5 text-center text-text-tertiary font-mono">
                        {formatDateTime(customer.startTime)}
                      </td>

                      <td className="py-3 px-3.5 text-center text-text-tertiary font-mono">
                        {formatDateTime(customer.finishedTime)}
                      </td>

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
