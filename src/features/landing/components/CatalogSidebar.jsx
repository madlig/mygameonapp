// src/features/landing/components/CatalogSidebar.jsx
//
// Sidebar Filter Modern ala Cyberspace Store yang disesuaikan untuk MyGameON:
// - Mode Desktop: Sticky sidebar di kolom kiri
// - Mode Mobile: Slide-over Drawer dengan backdrop blur
// - Filter: Genre, Kebutuhan Spek PC, dan Urutan (Sorting)

import React from 'react';
import { 
  Filter, RotateCcw, Swords, Shield, Tractor, Compass, 
  Coffee, Ghost, Gauge, Laptop, Monitor, Cpu, 
  ArrowDownUp, Check, X, Layers
} from 'lucide-react';

export const GENRE_OPTIONS = [
  { id: 'all', label: 'Semua Genre', icon: Layers },
  { id: 'action', label: 'Aksi & Petualangan', icon: Swords },
  { id: 'rpg', label: 'RPG', icon: Shield },
  { id: 'simulation', label: 'Simulasi & Tycoon', icon: Tractor },
  { id: 'open-world', label: 'Open World', icon: Compass },
  { id: 'indie', label: 'Indie & Santai', icon: Coffee },
  { id: 'horror', label: 'Horor & Thriller', icon: Ghost },
  { id: 'racing', label: 'Balapan & Olahraga', icon: Gauge },
];

export const SPEC_OPTIONS = [
  { id: 'all', label: 'Semua Spek PC', icon: Monitor, hint: 'Semua ukuran' },
  { id: 'low', label: 'Device Low Spek', icon: Laptop, hint: '< 15 GB (RAM 4-8GB)' },
  { id: 'mid', label: 'Device Menengah', icon: Monitor, hint: '15 - 50 GB (GTX 1650+)' },
  { id: 'high', label: 'Device High-End (AAA)', icon: Cpu, hint: '> 50 GB (RTX / AAA)' },
];

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Paling Populer' },
  { id: 'name-asc', label: 'Nama (A - Z)' },
  { id: 'size-desc', label: 'Ukuran Terbesar (GB)' },
  { id: 'size-asc', label: 'Ukuran Terkecil (GB)' },
];

const CatalogSidebar = ({
  selectedGenre = 'all',
  onSelectGenre,
  selectedSpec = 'all',
  onSelectSpec,
  sortBy = 'featured',
  onSelectSort,
  onResetFilters,
  hasActiveFilters = false,
  genreCounts = {},
  totalCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const content = (
    <div className="flex flex-col gap-6 text-slate-200">
      
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
            <Filter size={16} />
          </div>
          <span className="font-bold text-sm tracking-wide text-white">Filter Katalog</span>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-semibold px-2 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Section 1: Genre / Kategori */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
          <span>Kategori & Genre</span>
        </div>
        <div className="space-y-1">
          {GENRE_OPTIONS.map((g) => {
            const Icon = g.icon;
            const isSelected = selectedGenre === g.id;
            const count = g.id === 'all' ? totalCount : (genreCounts[g.id] ?? 0);

            return (
              <button
                key={g.id}
                onClick={() => {
                  onSelectGenre(g.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/10'
                    : 'hover:bg-white/5 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon size={14} className={isSelected ? 'text-slate-950' : 'text-slate-400'} />
                  <span className="truncate">{g.label}</span>
                </div>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-black/20 text-slate-950 font-black'
                        : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Kebutuhan Spek PC */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">
          <span>Kebutuhan Spek PC</span>
        </div>
        <div className="space-y-1.5">
          {SPEC_OPTIONS.map((s) => {
            const Icon = s.icon;
            const isSelected = selectedSpec === s.id;

            return (
              <button
                key={s.id}
                onClick={() => {
                  onSelectSpec(s.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex flex-col px-3 py-2 rounded-xl text-xs transition-all text-left border ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-[#0E131E]/60 border-white/5 hover:border-white/10 text-slate-300 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <Icon size={13} className={isSelected ? 'text-emerald-400' : 'text-slate-400'} />
                    <span>{s.label}</span>
                  </div>
                  {isSelected && <Check size={13} className="text-emerald-400" />}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 font-mono pl-5">
                  {s.hint}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Urutan (Sort By) */}
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
          <ArrowDownUp size={12} />
          <span>Urutkan Tampilan</span>
        </div>
        <div className="grid grid-cols-1 gap-1">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = sortBy === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  onSelectSort(opt.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all text-left ${
                  isSelected
                    ? 'bg-white/10 text-white font-bold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );

  return (
    <>
      {/* 1. Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 shrink-0">
        <div className="sticky top-24 bg-[#090C12] border border-white/10 rounded-2xl p-4 xl:p-5 shadow-xl max-h-[calc(100vh-7rem)] overflow-y-auto custom-scrollbar">
          {content}
        </div>
      </aside>

      {/* 2. Mobile Slide-over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-over Panel */}
          <div className="relative ml-auto w-full max-w-xs bg-[#090C12] border-l border-white/10 h-full p-5 overflow-y-auto flex flex-col justify-between shadow-2xl z-10">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="font-extrabold text-sm text-white">Filter & Urutan</span>
                <button
                  onClick={onCloseMobile}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {content}
            </div>

            <div className="pt-6 mt-6 border-t border-white/10">
              <button
                onClick={onCloseMobile}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20"
              >
                Terapkan Filter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CatalogSidebar;

