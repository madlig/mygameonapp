// src/features/landing/components/CatalogHardwareBanner.jsx
import React, { useState } from 'react';
import { Laptop, Settings2, Check, Sparkles, Filter, ChevronRight } from 'lucide-react';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
import DeviceProfileModal from './DeviceProfileModal';

const CatalogHardwareBanner = ({
  filterRecommendedOnly = false,
  onToggleFilterRecommended,
  className = '',
}) => {
  const { profile, isConfigured, resetProfile } = useDeviceProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className={`bg-[#0B0F17] border border-white/10 rounded-2xl p-3.5 sm:p-4 shadow-lg ${className}`}>
        
        {/* State A: Belum Diatur */}
        {!isConfigured ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
                <Laptop size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-white tracking-tight">
                    Can I Run It Checker
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30 uppercase tracking-wider">
                    Baru
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Input spek Processor, RAM, & VGA kamu untuk dapat rekomendasi game yang dijamin lancar dimainkan.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-amber-400/20 active:scale-95 shrink-0"
            >
              <Sparkles size={13} />
              <span>Input Spek Device Saya</span>
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          /* State B: Sudah Terdaftar */
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            
            {/* Info Device */}
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                profile.badgeColor === 'emerald'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : profile.badgeColor === 'amber'
                  ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                  : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
              }`}>
                <Laptop size={18} />
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-white">
                    {profile.cpuShort} • {profile.ramGB}GB RAM • {profile.gpuShort}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border ${
                    profile.badgeColor === 'emerald'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : profile.badgeColor === 'amber'
                      ? 'bg-amber-400/15 border-amber-400/30 text-amber-400'
                      : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                  }`}>
                    {profile.tierLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {profile.summary}
                </p>
              </div>
            </div>

            {/* Aksi & Toggle Rekomendasi */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <button
                type="button"
                onClick={() => onToggleFilterRecommended(!filterRecommendedOnly)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  filterRecommendedOnly
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md shadow-emerald-500/20 font-black'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                  filterRecommendedOnly ? 'bg-slate-950 border-slate-950 text-emerald-400' : 'border-slate-500'
                }`}>
                  {filterRecommendedOnly && <Check size={11} strokeWidth={3} />}
                </div>
                <span>Hanya Rekomendasi untuk Laptop Saya</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors shrink-0"
                title="Ubah spesifikasi hardware"
              >
                <Settings2 size={16} />
              </button>
            </div>

          </div>
        )}

      </div>

      <DeviceProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CatalogHardwareBanner;
