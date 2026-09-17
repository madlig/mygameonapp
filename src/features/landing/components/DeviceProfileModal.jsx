// src/features/landing/components/DeviceProfileModal.jsx
import React, { useState, useEffect } from 'react';
import { 
  X, Laptop, Monitor, Cpu, HardDrive, Check, Sparkles, AlertCircle 
} from 'lucide-react';
import { 
  CPU_OPTIONS, 
  RAM_OPTIONS, 
  GPU_OPTIONS, 
  DEVICE_TYPES, 
  classifyUserHardware 
} from '../utils/hardwareEngine';
import { useDeviceProfile } from '../hooks/useDeviceProfile';

const DeviceProfileModal = ({ isOpen, onClose, onSaved }) => {
  const { profile, saveProfile } = useDeviceProfile();

  const [deviceType, setDeviceType] = useState('laptop');
  const [cpuId, setCpuId] = useState('cpu_modern_mid');
  const [ramGB, setRamGB] = useState(8);
  const [gpuId, setGpuId] = useState('gpu_onboard_modern');

  // Load existing profile if any
  useEffect(() => {
    if (profile) {
      if (profile.deviceType) setDeviceType(profile.deviceType);
      if (profile.cpuId) setCpuId(profile.cpuId);
      if (profile.ramGB) setRamGB(profile.ramGB);
      if (profile.gpuId) setGpuId(profile.gpuId);
    }
  }, [profile, isOpen]);

  // Prevent background scrolling
  useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Live preview of classification
  const preview = classifyUserHardware({ cpuId, ramGB, gpuId, deviceType });

  const handleSave = (e) => {
    e.preventDefault();
    const saved = saveProfile({ cpuId, ramGB, gpuId, deviceType });
    if (onSaved) onSaved(saved);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-[#0B0F17] border border-white/15 rounded-3xl p-5 sm:p-7 shadow-2xl z-10 text-slate-100 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
              <Laptop size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Can I Run It — Atur Spek Device Kamu
              </h2>
              <p className="text-xs text-slate-400">
                Masukkan spesifikasi komputermu untuk diagnosa & rekomendasi game otomatis:
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="space-y-5 pt-4">
          
          {/* 1. Tipe Device */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              1. Tipe Perangkat
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {DEVICE_TYPES.map((t) => {
                const isSelected = deviceType === t.id;
                const Icon = t.id === 'laptop' ? Laptop : Monitor;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDeviceType(t.id)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Icon size={15} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Processor (CPU) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              2. Processor (CPU)
            </label>
            <select
              value={cpuId}
              onChange={(e) => setCpuId(e.target.value)}
              className="w-full bg-[#070A0F] border border-white/15 focus:border-amber-400 text-xs sm:text-sm text-white rounded-xl py-2.5 px-3 outline-none transition-all"
            >
              {CPU_OPTIONS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#070A0F] text-white">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Kapasitas RAM */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              3. Kapasitas RAM
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RAM_OPTIONS.map((r) => {
                const isSelected = ramGB === r.gb;
                return (
                  <button
                    key={r.gb}
                    type="button"
                    onClick={() => setRamGB(r.gb)}
                    className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-black shadow-md'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <span>{r.gb} GB</span>
                    <span className="text-[10px] opacity-75 font-normal">RAM</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Kartu Grafis (GPU / VGA) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              4. Kartu Grafis (VGA / GPU)
            </label>
            <select
              value={gpuId}
              onChange={(e) => setGpuId(e.target.value)}
              className="w-full bg-[#070A0F] border border-white/15 focus:border-amber-400 text-xs sm:text-sm text-white rounded-xl py-2.5 px-3 outline-none transition-all"
            >
              {GPU_OPTIONS.map((g) => (
                <option key={g.id} value={g.id} className="bg-[#070A0F] text-white">
                  {g.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
              *Jika laptopmu tidak memiliki stiker NVIDIA GeForce / AMD Radeon diskrit, pilih <em>Intel Iris Xe / Radeon 680M/780M</em> (laptop modern/gaming iGPU) atau <em>Intel UHD / Vega</em> (laptop standar kantor/pelajar).
            </p>
          </div>

          {/* Live Classification Result Box */}
          <div className="p-4 rounded-2xl bg-[#070A0F] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Kelas Terdeteksi:</span>
              <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border uppercase tracking-wider ${
                preview.badgeColor === 'emerald'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : preview.badgeColor === 'amber'
                  ? 'bg-amber-400/15 border-amber-400/30 text-amber-400'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
              }`}>
                {preview.tierLabel}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {preview.summary}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-95"
            >
              <Check size={16} strokeWidth={3} />
              <span>Simpan Spek & Aktifkan Diagnosa</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default DeviceProfileModal;
