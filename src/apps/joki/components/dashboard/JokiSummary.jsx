import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Users, Play, Pause, Clock, DollarSign } from 'lucide-react';

const JokiSummary = () => {
  const { customers, queue, streamerMode, isAdmin } = useJoki();

  // Hidden if not admin or if streamer mode is turned on
  if (!isAdmin || streamerMode) return null;

  const active = customers.filter(c => !c.finished);
  const running = active.filter(c => !c.paused);
  const paused = active.filter(c => c.paused);
  
  // Total Playtime Jam Billing Aktif
  const totalActiveHours = active.reduce((sum, c) => sum + Number(c.duration || 0), 0);
  const vipActiveCount = active.filter(c => (c.service || '').toUpperCase().includes('VIP') || c.slot === 'VIP').length;
  const basicActiveCount = active.filter(c => !(c.service || '').toUpperCase().includes('VIP') && c.slot !== 'VIP').length;

  // Estimasi Omset Berjalan (Active billing + Antrean pending)
  const activeRevenue = active.reduce((total, c) => total + Number(c.price || 0), 0);
  const queueRevenue = (queue || []).reduce((total, q) => total + Number(q.price || 0), 0);
  const estimatedInProgressRevenue = activeRevenue + queueRevenue;

  const formatRupiah = (value) => {
    return "Rp " + Number(value || 0).toLocaleString("id-ID");
  };

  const cards = [
    {
      label: 'Total Joki Aktif',
      value: `${active.length} Akun`,
      icon: Users,
      color: 'text-accent-purple-light',
      bg: 'bg-accent-purple/10',
      border: 'border-accent-purple/20',
      subtext: `${active.length}/7 Slot Live Terisi`
    },
    {
      label: 'Running (Aktif)',
      value: `${running.length} Akun`,
      icon: Play,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
      border: 'border-accent-green/20',
      subtext: 'Billing berjalan live'
    },
    {
      label: 'Paused (Jeda)',
      value: `${paused.length} Akun`,
      icon: Pause,
      color: 'text-accent-orange',
      bg: 'bg-accent-orange/10',
      border: 'border-accent-orange/20',
      subtext: 'Durasi waktu aman'
    },
    {
      label: 'Total Jam Main Aktif',
      value: `${totalActiveHours.toFixed(1)} Jam`,
      icon: Clock,
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
      border: 'border-accent-cyan/20',
      subtext: `${vipActiveCount} VIP • ${basicActiveCount} Basic`
    },
    {
      label: 'Estimasi Omset Berjalan',
      value: formatRupiah(estimatedInProgressRevenue),
      icon: DollarSign,
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10',
      border: 'border-accent-yellow/20',
      highlight: true,
      subtext: `${active.length} Aktif + ${queue.length} Antrean`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isHighlight = card.highlight;

        return (
          <div
            key={index}
            className={`bg-bg-surface/90 backdrop-blur-md border border-border-default rounded-2xl p-4 transition-all duration-200 hover:border-border-muted ${
              isHighlight ? 'col-span-2 md:col-span-1 border-accent-yellow/25 shadow-lg shadow-accent-yellow/5' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[10.5px] font-extrabold uppercase tracking-wider text-text-tertiary truncate">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.bg} ${card.border} border ${card.color} shrink-0`}>
                <Icon size={14} />
              </div>
            </div>
            <div className={`text-lg md:text-xl font-black tracking-tight font-mono ${isHighlight ? 'text-accent-yellow' : 'text-text-primary'}`}>
              {card.value}
            </div>
            {card.subtext && (
              <span className="text-[10px] text-text-dim font-bold block mt-0.5">
                {card.subtext}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default JokiSummary;
