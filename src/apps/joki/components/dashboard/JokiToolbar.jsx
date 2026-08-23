import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Layers } from 'lucide-react';

const JokiToolbar = () => {
  const { filter, setFilter } = useJoki();

  const filters = [
    { key: 'ALL', label: 'SEMUA' },
    { key: 'RUNNING', label: '▶ RUNNING' },
    { key: 'PAUSED', label: '⏸ PAUSED' },
  ];

  return (
    <div className="bg-bg-surface/90 backdrop-blur-md border border-border-default border-b-0 rounded-t-2xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
      {/* Title */}
      <div className="flex items-center gap-2 font-extrabold text-xs uppercase tracking-wider text-text-primary">
        <Layers size={15} className="text-accent-purple" />
        <span>Billing Aktif (Live Slots)</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-bg-primary p-1 rounded-xl border border-border-default">
        {filters.map((tab) => {
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-accent-purple text-white shadow-md shadow-accent-purple/20'
                  : 'text-text-tertiary hover:text-text-primary hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default JokiToolbar;
