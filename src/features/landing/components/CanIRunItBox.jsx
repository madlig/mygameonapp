// src/features/landing/components/CanIRunItBox.jsx
import React, { useState } from 'react';
import { 
  Laptop, CheckCircle2, XCircle, AlertTriangle, 
  Settings2, ArrowRight, Sparkles, Monitor, Tv, 
  Gauge, Lightbulb, Zap, ArrowUpRight 
} from 'lucide-react';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
import DeviceProfileModal from './DeviceProfileModal';

const CanIRunItBox = ({ game }) => {
  const { profile, isConfigured, checkGame } = useDeviceProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!game) return null;

  const result = isConfigured ? checkGame(game) : null;
  const title = game.title || game.name || 'Game ini';

  // Helper untuk warna bar speedometer
  const getScoreColor = (score) => {
    if (score >= 80) return 'from-emerald-500 to-teal-400 text-emerald-400';
    if (score >= 55) return 'from-amber-500 to-yellow-400 text-amber-400';
    return 'from-rose-500 to-red-500 text-rose-400';
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-[#070A0F] p-4 space-y-3.5">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
              <Laptop size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white tracking-tight block">
                  Can I Run It V2 — Estimasi FPS & Resolusi
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-400/15 text-amber-400 border border-amber-400/30 uppercase">
                  Engine V2
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {isConfigured 
                  ? `Device: ${profile.deviceType === 'laptop' ? 'Laptop' : 'PC'} (${profile.tierLabel})`
                  : 'Cek apakah laptop/PC kamu kuat memainkan game ini sebelum membeli'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-bold transition-all"
          >
            <Settings2 size={13} className="text-amber-400" />
            <span>{isConfigured ? 'Ubah Spek' : 'Input Spek Laptop'}</span>
          </button>
        </div>

        {/* State A: Spek Device Belum Diinput */}
        {!isConfigured ? (
          <div className="py-3 px-3.5 rounded-xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-slate-200">
                Belum yakin laptopmu kuat untuk {title}?
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Masukkan tipe Processor, RAM, & VGA kamu dalam 3 klik untuk diagnosa FPS & resolusi instan.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="shrink-0 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-400/20 active:scale-95"
            >
              <Sparkles size={14} />
              <span>Tes Spek Laptop Saya</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* State B: Hasil Diagnosa Lengkap V2 */
          <div className="space-y-3">
            
            {/* 1. Visual Performance Score Bar */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Gauge size={14} className={getScoreColor(result?.scorePercent).split(' ')[1]} />
                  <span className="font-bold text-slate-300">Skor Kelancaran Hardware:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-black text-sm ${getScoreColor(result?.scorePercent).split(' ')[1]}`}>
                    {result?.scorePercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    ({result?.gameTierLabel || 'Standar Game'})
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div 
                  className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(result?.scorePercent).split(' ')[0]} transition-all duration-500`}
                  style={{ width: `${result?.scorePercent || 0}%` }}
                />
              </div>
            </div>

            {/* 2. Verdict Card */}
            <div className={`p-3 rounded-xl border flex items-start gap-3 ${
              result?.verdict === 'optimal'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : result?.verdict === 'playable'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              {result?.isPlayable ? (
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle size={20} className="text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="text-xs sm:text-sm font-black text-white">
                    {result?.headline}
                  </h4>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                    result?.isPlayable ? 'bg-emerald-500 text-black' : 'bg-rose-500 text-white'
                  }`}>
                    {result?.isPlayable ? 'Bisa Dimainkan' : 'Tidak Disarankan'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">
                  {result?.message}
                </p>
              </div>
            </div>

            {/* 3. Estimasi Resolusi & FPS Cards (NEW V2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              
              {/* Resolusi 1080p Card */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Monitor size={14} className="text-amber-400" />
                    <span className="font-bold text-[11px] uppercase tracking-wider">1080p Full HD</span>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    result?.fps1080p.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {result?.fps1080p.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base sm:text-lg font-black text-white">
                    {result?.fps1080p.range}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Grafik: <strong className="text-slate-200">{result?.fps1080p.preset}</strong>
                  </span>
                </div>
              </div>

              {/* Resolusi 720p Card */}
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Tv size={14} className="text-cyan-400" />
                    <span className="font-bold text-[11px] uppercase tracking-wider">720p HD (Hemat Daya)</span>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                    result?.fps720p.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' : 
                    result?.fps720p.color === 'amber' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {result?.fps720p.status}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-base sm:text-lg font-black text-white">
                    {result?.fps720p.range}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Grafik: <strong className="text-slate-200">{result?.fps720p.preset}</strong>
                  </span>
                </div>
              </div>

            </div>

            {/* 4. Component-by-Component Comparison Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              
              {/* CPU Check */}
              <div className={`p-2.5 rounded-xl border ${
                result?.checks.cpu.pass ? 'bg-white/5 border-white/10' : 'bg-rose-500/5 border-rose-500/30'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Processor</span>
                  {result?.checks.cpu.pass ? (
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  ) : (
                    <XCircle size={13} className="text-rose-400" />
                  )}
                </div>
                <p className="font-bold text-white truncate" title={result?.checks.cpu.user}>
                  {result?.checks.cpu.user}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  Min: {result?.checks.cpu.req}
                </p>
              </div>

              {/* RAM Check */}
              <div className={`p-2.5 rounded-xl border ${
                result?.checks.ram.pass ? 'bg-white/5 border-white/10' : 'bg-rose-500/5 border-rose-500/30'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">RAM Memory</span>
                  {result?.checks.ram.pass ? (
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  ) : (
                    <XCircle size={13} className="text-rose-400" />
                  )}
                </div>
                <p className="font-bold text-white">
                  {result?.checks.ram.user}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Min: {result?.checks.ram.req}
                </p>
              </div>

              {/* GPU Check */}
              <div className={`p-2.5 rounded-xl border ${
                result?.checks.gpu.pass ? 'bg-white/5 border-white/10' : 'bg-rose-500/5 border-rose-500/30'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">VGA / GPU</span>
                  {result?.checks.gpu.pass ? (
                    <CheckCircle2 size={13} className="text-emerald-400" />
                  ) : (
                    <XCircle size={13} className="text-rose-400" />
                  )}
                </div>
                <p className="font-bold text-white truncate" title={result?.checks.gpu.user}>
                  {result?.checks.gpu.user}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                  Min: {result?.checks.gpu.req}
                </p>
              </div>

            </div>

            {/* 5. Smart Optimization Tips (NEW V2) */}
            {Array.isArray(result?.tips) && result.tips.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-400/[0.04] border border-amber-400/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                  <Lightbulb size={14} className="shrink-0" />
                  <span>Tips Optimasi & Rekomendasi Setting:</span>
                </div>
                <ul className="text-[11px] text-slate-300 space-y-1 pl-5 list-disc leading-relaxed">
                  {result.tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 6. Smart Fallback CTA untuk Device Tidak Kuat (NEW V2) */}
            {!result?.isPlayable && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
                <div>
                  <p className="text-xs font-bold text-white">
                    Device kamu kurang kuat untuk {title}?
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Tenang, temukan ratusan game seru lainnya yang dijamin lancar di spesifikasi kamu!
                  </p>
                </div>
                <a
                  href="/catalog"
                  className="shrink-0 px-3.5 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-purple-500/20"
                >
                  <span>Lihat Game Ringan</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            )}

          </div>
        )}

      </div>

      {/* Hardware Profile Setup Modal */}
      <DeviceProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default CanIRunItBox;

