import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Layers, Flame, ArrowUpDown } from 'lucide-react';

const JokiToolbar = () => {
  const { filter, setFilter, sortBy, setSortBy } = useJoki();

  const filters = [
    { key: 'ALL', label: 'SEMUA' },
    { key: 'RUNNING', label: '▶ RUNNING' },
    { key: 'PAUSED', label: '⏸ PAUSED' },
  ];

  const sortOptions = [
    { key: 'SHORTEST_TIME', label: '⏳ Sisa Waktu', icon: Flame },
    { key: 'SLOT', label: '🎰 Slot' },
    { key: 'NAME', label: '🔤 Nama' },
  ];

  return (
    <div className="bg-bg-surface/90 backdrop-blur-md border border-border-default border-b-0 rounded-t-3xl p-3 md:p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
      {/* Title & Filter Tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-text-primary">
          <div className="w-6 h-6 rounded-lg bg-accent-purple/15 border border-accent-purple/30 flex items-center justify-center text-accent-purple">
            <Layers size={13} />
          </div>
          <span>Billing Aktif (Live Slots)</span>
        </div>

        {/* Filter Status Tabs */}
        <div className="flex items-center gap-1 bg-bg-primary p-1 rounded-xl border border-border-default shadow-inner">
          {filters.map((tab) => {
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-accent-purple text-white shadow-sm shadow-accent-purple/25 scale-[1.02]'
                    : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sorting Tabs Section */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-extrabold text-text-tertiary flex items-center gap-1">
          <ArrowUpDown size={12} className="text-accent-cyan" />
          <span>Urutkan:</span>
        </span>

        <div className="flex items-center gap-1 bg-bg-primary p-1 rounded-xl border border-border-default shadow-inner">
          {sortOptions.map((opt) => {
            const isSelected = sortBy === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSortBy(opt.key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? opt.key === 'SHORTEST_TIME'
                      ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/40 shadow-sm'
                      : 'bg-white/10 text-white border border-border-subtle shadow-sm'
                    : 'text-text-muted hover:text-text-primary hover:bg-white/5 border border-transparent'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default JokiToolbar;
