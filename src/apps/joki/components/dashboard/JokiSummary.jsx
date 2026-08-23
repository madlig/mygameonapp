import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Users, Play, Pause, CheckCircle2, DollarSign } from 'lucide-react';

const JokiSummary = () => {
  const { customers, streamerMode, isAdmin } = useJoki();

  // Hidden if not admin or if streamer mode is turned on
  if (!isAdmin || streamerMode) return null;

  const active = customers.filter(c => !c.finished);
  const running = active.filter(c => !c.paused);
  const paused = active.filter(c => c.paused);
  const finished = customers.filter(c => c.finished);
  
  // Total Omset for this Penjoki workspace
  const revenue = customers.reduce((total, customer) => total + Number(customer.price || 0), 0);

  const formatRupiah = (value) => {
    return "Rp " + Number(value || 0).toLocaleString("id-ID");
  };

  const cards = [
    {
      label: 'Total Joki Aktif',
      value: active.length,
      icon: Users,
      color: 'text-accent-purple-light',
      bg: 'bg-accent-purple/10',
      border: 'border-accent-purple/20',
    },
    {
      label: 'Running (Aktif)',
      value: running.length,
      icon: Play,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
      border: 'border-accent-green/20',
    },
    {
      label: 'Paused (Jeda)',
      value: paused.length,
      icon: Pause,
      color: 'text-accent-orange',
      bg: 'bg-accent-orange/10',
      border: 'border-accent-orange/20',
    },
    {
      label: 'Total Selesai',
      value: finished.length,
      icon: CheckCircle2,
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
      border: 'border-accent-cyan/20',
    },
    {
      label: 'Total Omset',
      value: formatRupiah(revenue),
      icon: DollarSign,
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10',
      border: 'border-accent-yellow/20',
      highlight: true,
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
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary truncate">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.bg} ${card.border} border ${card.color} shrink-0`}>
                <Icon size={14} />
              </div>
            </div>
            <div className={`text-xl md:text-2xl font-black tracking-tight ${isHighlight ? 'text-accent-yellow' : 'text-text-primary'}`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default JokiSummary;
