import React from 'react';
import { useJoki } from '../../contexts/JokiContext';
import { Search, X } from 'lucide-react';

const JokiToolbar = () => {
  const { searchQuery, setSearchQuery, filter, setFilter } = useJoki();

  const filters = [
    { key: 'ALL', label: 'SEMUA' },
    { key: 'RUNNING', label: 'RUNNING' },
    { key: 'PAUSED', label: 'PAUSED' },
  ];

  return (
    <div className="bg-bg-surface/90 backdrop-blur-md border border-border-default border-b-0 rounded-t-2xl p-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
      {/* Search Input */}
      <div className="relative w-full sm:w-[320px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-faint" />
        <input
          type="text"
          className="w-full bg-bg-primary border border-border-default rounded-xl py-2 pl-9 pr-8 text-xs text-text-primary placeholder:text-text-faint outline-none focus:border-accent-purple/50 transition-colors"
          placeholder="Cari username Roblox / TikTok..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-primary p-0.5"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-bg-primary p-1 rounded-xl border border-border-default w-fit">
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
