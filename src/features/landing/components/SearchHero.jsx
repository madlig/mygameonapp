import React, { useRef, useEffect } from 'react';
import { Search, X, Cpu, Layers, HardDrive, Monitor, Laptop } from 'lucide-react';

const SPEC_FILTERS = [
  { id: 'all', label: 'Semua Game', icon: Layers },
  { id: 'low', label: 'Device Low Spek (RAM 4-8GB)', icon: Laptop },
  { id: 'mid', label: 'Device Menengah (GTX/RX)', icon: Monitor },
  { id: 'high', label: 'Device High-End (AAA)', icon: Cpu },
];

const SearchHero = ({
  searchQuery = '',
  onSearchChange,
  activeSpecFilter = 'all',
  onSpecFilterChange,
  totalGameCount = 1200,
}) => {
  const inputRef = useRef(null);

  // Global Ctrl + K / Cmd + K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section id="katalog" className="px-4 sm:px-8 pt-8 sm:pt-14 pb-8 max-w-4xl mx-auto text-center">
      {/* Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0E121A] text-slate-300 border border-white/10 text-xs font-medium mb-4 shadow-sm">
        <HardDrive size={13} className="text-emerald-400 shrink-0" />
        <span><strong className="text-white font-bold">{totalGameCount}+</strong> Judul Siap Download Direct Cloud Google Drive</span>
      </div>

      {/* Main Headline */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3 font-display">
        Cari Game PC Favoritmu.<br />
        <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
          Order via WhatsApp Tanpa Biaya Admin.
        </span>
      </h1>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
        Ketik nama game di bawah. Klik tombol WhatsApp untuk langsung terhubung dengan admin dan terima link Google Drive detik ini juga.
      </p>

      {/* Instant Search Bar */}
      <div className="max-w-2xl mx-auto relative mb-5">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
          <Search size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          placeholder="Ketik judul game (misal: Cyberpunk, GTA V, Sims 4, Elden Ring)..."
          className="w-full pl-11 pr-24 py-3.5 bg-[#090C12] border border-white/10 hover:border-white/20 focus:border-amber-400 rounded-2xl text-sm text-white placeholder:text-slate-500 outline-none transition-all shadow-xl font-medium"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange?.('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5"
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : (
            <span className="hidden sm:inline text-[10px] font-mono bg-white/5 text-slate-400 px-2 py-1 rounded-lg border border-white/10">
              Ctrl + K
            </span>
          )}
        </div>
      </div>

      {/* Quick Spec Filter Pills */}
      <div className="flex items-center gap-2 text-xs overflow-x-auto no-scrollbar py-1 sm:justify-center">
        <span className="text-xs text-slate-500 shrink-0 font-medium mr-1">Filter Spek:</span>
        {SPEC_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = activeSpecFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSpecFilterChange?.(f.id)}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shrink-0 text-xs transition-all ${
                isActive
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10 border border-amber-400'
                  : 'bg-[#0E121A] hover:bg-white/5 text-slate-300 border border-white/10'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-slate-950' : 'text-slate-400'} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default SearchHero;
