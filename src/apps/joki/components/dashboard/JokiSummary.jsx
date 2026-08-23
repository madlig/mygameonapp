import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Users, Play, Pause, CheckCircle2, DollarSign, Calendar, Filter } from 'lucide-react';

const DATE_PRESETS = [
  { id: 'ALL', label: 'Semua' },
  { id: 'TODAY', label: 'Hari Ini' },
  { id: 'YESTERDAY', label: 'Kemarin' },
  { id: 'WEEK', label: '7 Hari' },
  { id: 'MONTH', label: 'Bulan Ini' },
  { id: 'CUSTOM', label: 'Custom' },
];

const JokiSummary = () => {
  const { 
    customers, 
    streamerMode, 
    isAdmin,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    isWithinDateFilter 
  } = useJoki();

  // Hidden if not admin or if streamer mode is turned on
  if (!isAdmin || streamerMode) return null;

  const active = customers.filter(c => !c.finished);
  const running = active.filter(c => !c.paused);
  const paused = active.filter(c => c.paused);
  
  // Filtered finished transactions based on active date range
  const filteredFinished = customers.filter(c => c.finished && isWithinDateFilter(c.finishedTime || c.createdAt));
  
  // Revenue calculation based on active date filter:
  // (Active billings always count + finished billings matching the date filter)
  const filteredCustomersForRevenue = dateFilter === 'ALL' 
    ? customers 
    : customers.filter(c => isWithinDateFilter(c.finishedTime || c.createdAt));

  const revenue = filteredCustomersForRevenue.reduce((total, customer) => total + Number(customer.price || 0), 0);

  const formatRupiah = (value) => {
    return "Rp " + Number(value).toLocaleString("id-ID");
  };

  const getFilterLabel = () => {
    const p = DATE_PRESETS.find(p => p.id === dateFilter);
    return p ? p.label : 'Semua';
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
      label: `Selesai (${getFilterLabel()})`,
      value: filteredFinished.length,
      icon: CheckCircle2,
      color: 'text-accent-cyan',
      bg: 'bg-accent-cyan/10',
      border: 'border-accent-cyan/20',
    },
    {
      label: `Omset (${getFilterLabel()})`,
      value: formatRupiah(revenue),
      icon: DollarSign,
      color: 'text-accent-yellow',
      bg: 'bg-accent-yellow/10',
      border: 'border-accent-yellow/20',
      highlight: true,
    },
  ];

  return (
    <div className="mb-4">
      {/* Date Filter Toolbar */}
      <div className="bg-bg-surface/80 border border-border-default rounded-xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold text-text-tertiary px-1 flex items-center gap-1">
            <Filter size={12} className="text-accent-yellow" />
            <span>Filter Omset & Transaksi:</span>
          </span>
          {DATE_PRESETS.map((preset) => {
            const isSelected = dateFilter === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setDateFilter(preset.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-accent-yellow text-bg-primary shadow-sm shadow-accent-yellow/20'
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

      {/* 5 Summary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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
    </div>
  );
};

export default JokiSummary;
