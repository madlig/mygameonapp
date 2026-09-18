import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, Cpu, Layers, HardDrive, Monitor, Laptop, Gauge, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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
    <section className="relative px-4 sm:px-8 pt-8 sm:pt-14 pb-10 max-w-5xl mx-auto text-center overflow-hidden">
      {/* Subtle Background Glow Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Eyebrow Badge (Amber Gaming Outline) */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-wider mb-5 shadow-sm">
        <Zap size={13} className="text-amber-400 fill-amber-400" />
        <span>Download Cepat & Garansi 100% Jalan</span>
      </div>

      {/* 2. Main Headline */}
      <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4 font-display max-w-3xl mx-auto">
        Main Game PC Tanpa Pusing Spek <br className="hidden sm:inline" />
        <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
          & Ribet Install
        </span>
      </h1>

      {/* 3. Subheadline */}
      <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mb-7 leading-relaxed font-medium">
        Cari game favoritmu, cek apakah laptopmu kuat, dan dapatkan game siap main bergaransi penuh. Dipandu langsung oleh admin berpengalaman sampai jalan lancar.
      </p>

      {/* 4. Dual Hero Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
        <Link
          to="/katalog"
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-400/20 active:scale-95"
        >
          <span>Jelajahi Katalog Lengkap</span>
          <ArrowRight size={16} className="stroke-[2.5]" />
        </Link>
        <a
          href="#cek-spek"
          className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#0E121A] hover:bg-white/10 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all border border-white/15 active:scale-95"
        >
          <Gauge size={16} className="text-amber-400" />
          <span>Cek Spek Laptopmu</span>
        </a>
      </div>


      {/* 6. Instant Search Bar & Spec Filters (Integrated with #katalog anchor) */}
      <div id="katalog" className="pt-2">
        <div className="text-center mb-4">
          <h2 className="text-base sm:text-xl font-extrabold text-white tracking-tight">
            Katalog Game Populer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cari game favoritmu atau gunakan filter spek laptop di bawah
          </p>
        </div>

        <div className="max-w-2xl mx-auto relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
            <Search size={18} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Cari game... contoh: GTA V, Sims 4, Resident Evil, Cyberpunk..."
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
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs py-1">
          <span className="text-xs text-slate-500 font-medium mr-1">Pilihan Spek:</span>
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
      </div>
    </section>
  );
};

export default SearchHero;
