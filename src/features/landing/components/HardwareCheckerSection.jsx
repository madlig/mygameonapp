// src/features/landing/components/HardwareCheckerSection.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Laptop, Monitor, Zap, Gamepad2, CheckCircle2, XCircle, 
  HelpCircle, ChevronDown, ChevronUp, ArrowRight, ArrowUpRight, 
  Sparkles, RefreshCw, Cpu, HardDrive, Check, Search, X
} from 'lucide-react';
import Fuse from 'fuse.js';
import { 
  POPULAR_CPUS, 
  POPULAR_GPUS, 
  cleanDxdiagString, 
  evaluateHardwareTier,
  getTopTierGames,
  TIER_TOP_GAMES
} from '../data/hardwareCatalog';
import { useDeviceProfile } from '../hooks/useDeviceProfile';
import WhatsAppIcon from '../../../components/common/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../../config/integrations';

const RAM_OPTIONS = [
  { gb: 4, label: '4 GB', note: 'Standar Low' },
  { gb: 8, label: '8 GB', note: 'Paling Umum', isPopular: true },
  { gb: 16, label: '16 GB', note: 'Lega / Gaming', isPopular: true },
  { gb: 32, label: '32 GB+', note: 'Sultan' },
];

const QUICK_PRESETS = [
  {
    label: '💻 Laptop Santai / Kuliah',
    cpuId: 'intel_i3_gen10',
    ram: 8,
    gpuId: 'intel_uhd_std',
  },
  {
    label: '🎮 Laptop Gaming Standar',
    cpuId: 'intel_i5_gen10',
    ram: 16,
    gpuId: 'nv_gtx_1650',
  },
  {
    label: '🚀 PC / Laptop Sultan',
    cpuId: 'intel_i7_gen12',
    ram: 16,
    gpuId: 'nv_rtx_4060',
  },
];

const HardwareCheckerSection = ({ games = [], onSelectGame }) => {
  const navigate = useNavigate();
  const { 
    profile, 
    isConfigured, 
    saveProfile, 
    resetProfile, 
    filterRecommendedOnly, 
    toggleFilterRecommended 
  } = useDeviceProfile();

  const [showDxdiagGuide, setShowDxdiagGuide] = useState(false);

  // Form states
  const [cpuQuery, setCpuQuery] = useState('');
  const [selectedCpu, setSelectedCpu] = useState(null);
  const [isCpuDropdownOpen, setIsCpuDropdownOpen] = useState(false);

  const [ramGB, setRamGB] = useState(8);

  const [gpuQuery, setGpuQuery] = useState('');
  const [selectedGpu, setSelectedGpu] = useState(null);
  const [isGpuDropdownOpen, setIsGpuDropdownOpen] = useState(false);

  const cpuContainerRef = useRef(null);
  const gpuContainerRef = useRef(null);
  const cpuInputRef = useRef(null);
  const gpuInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (cpuContainerRef.current && !cpuContainerRef.current.contains(e.target)) {
        setIsCpuDropdownOpen(false);
      }
      if (gpuContainerRef.current && !gpuContainerRef.current.contains(e.target)) {
        setIsGpuDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Form starts clean without auto-prefill so placeholders are clearly visible.
  // When user chooses a preset or selects CPU & GPU, diagnosis will compute.

  // Fuse.js Index for CPU
  const cpuFuse = useMemo(() => {
    return new Fuse(POPULAR_CPUS, {
      keys: ['label', 'keywords', 'short'],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, []);

  // Fuse.js Index for GPU
  const gpuFuse = useMemo(() => {
    return new Fuse(POPULAR_GPUS, {
      keys: ['label', 'keywords', 'short'],
      threshold: 0.35,
      ignoreLocation: true,
    });
  }, []);

  // CPU suggestions
  const cpuSuggestions = useMemo(() => {
    const cleaned = cleanDxdiagString(cpuQuery).trim();
    if (!cleaned || cleaned.length < 2) {
      return POPULAR_CPUS.slice(0, 6);
    }
    const results = cpuFuse.search(cleaned);
    return results.slice(0, 6).map((r) => r.item);
  }, [cpuQuery, cpuFuse]);

  // GPU suggestions
  const gpuSuggestions = useMemo(() => {
    const cleaned = cleanDxdiagString(gpuQuery).trim();
    if (!cleaned || cleaned.length < 2) {
      return POPULAR_GPUS.slice(0, 6);
    }
    const results = gpuFuse.search(cleaned);
    return results.slice(0, 6).map((r) => r.item);
  }, [gpuQuery, gpuFuse]);

  // Live evaluated diagnosis (Hanya muncul saat CPU & GPU sudah dipilih atau Quick Preset diklik)
  const diagnosis = useMemo(() => {
    if (!selectedCpu || !selectedGpu) return null;

    const evalResult = evaluateHardwareTier({
      cpuObj: selectedCpu,
      ramGB,
      gpuObj: selectedGpu,
    });

    return {
      ...evalResult,
      cpuObj: selectedCpu,
      gpuObj: selectedGpu,
    };
  }, [selectedCpu, selectedGpu, ramGB]);

  // Top 5 Game yang memenuhi minimum requirement hardware terpilih (bersumber riil dari Firestore)
  const top5Games = useMemo(() => {
    if (!diagnosis) return [];
    return getTopTierGames(games, diagnosis, diagnosis.tier);
  }, [diagnosis, games]);

  // Commit changes to global profile whenever user selects CPU, RAM, and GPU
  const handleApplySpecs = (cpu, ram, gpu) => {
    if (!cpu || !gpu) return;
    const evaluated = evaluateHardwareTier({ cpuObj: cpu, ramGB: ram, gpuObj: gpu });
    saveProfile({
      cpuId: cpu.id,
      cpuLabel: cpu.label,
      cpuShort: cpu.short,
      cpuScore: cpu.score,
      ramGB: ram,
      ramLabel: `${ram} GB RAM`,
      ramScore: ram >= 16 ? 4.5 : ram >= 8 ? 3.0 : 1.5,
      gpuId: gpu.id,
      gpuLabel: gpu.label,
      gpuShort: gpu.short,
      gpuScore: gpu.score,
      isDedicatedGpu: gpu.isDedicated,
      deviceType: 'laptop',
      tier: evaluated.tier,
      tierLabel: evaluated.tierLabel,
      badgeColor: evaluated.badgeColor,
      summary: evaluated.summary,
    });
  };

  const handleSelectCpu = (item) => {
    setSelectedCpu(item);
    setCpuQuery(item.label);
    setIsCpuDropdownOpen(false);
    if (selectedGpu) {
      handleApplySpecs(item, ramGB, selectedGpu);
    }
  };

  const handleSelectGpu = (item) => {
    setSelectedGpu(item);
    setGpuQuery(item.label);
    setIsGpuDropdownOpen(false);
    if (selectedCpu) {
      handleApplySpecs(selectedCpu, ramGB, item);
    }
  };

  const handleSelectRam = (val) => {
    setRamGB(val);
    if (selectedCpu && selectedGpu) {
      handleApplySpecs(selectedCpu, val, selectedGpu);
    }
  };

  const handleQuickPreset = (preset) => {
    const cpu = POPULAR_CPUS.find((c) => c.id === preset.cpuId) || POPULAR_CPUS[7];
    const gpu = POPULAR_GPUS.find((g) => g.id === preset.gpuId) || POPULAR_GPUS[2];
    setSelectedCpu(cpu);
    setCpuQuery(cpu.label);
    setRamGB(preset.ram);
    setSelectedGpu(gpu);
    setGpuQuery(gpu.label);
    handleApplySpecs(cpu, preset.ram, gpu);
  };

  const handleReset = () => {
    setSelectedCpu(null);
    setCpuQuery('');
    setSelectedGpu(null);
    setGpuQuery('');
    setRamGB(8);
    resetProfile();
  };

  // Filter and direct to full catalog page
  const handleViewCompatibleGames = () => {
    if (selectedCpu && selectedGpu) {
      handleApplySpecs(selectedCpu, ramGB, selectedGpu);
    }
    toggleFilterRecommended(true);
    navigate('/katalog?filter=my-device');
  };

  // WhatsApp consultation
  const waConsultUrl = buildWhatsAppUrl({
    text: `Halo Admin MyGameON, saya mau konsultasi spek laptop:\n- Processor: ${selectedCpu?.label || cpuQuery || 'Belum diisi'}\n- RAM: ${ramGB} GB\n- VGA/Kartu Grafis: ${selectedGpu?.label || gpuQuery || 'Belum diisi'}\nApakah dijamin kuat dan lancar main game PC min?`,
  });

  return (
    <section id="cek-spek" className="px-4 sm:px-8 py-12 max-w-5xl mx-auto scroll-mt-20">
      
      {/* Box Utama dengan Dark Glassmorphism */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#0F1422] via-[#0B0E17] to-[#07090F] border border-amber-400/30 p-6 sm:p-10 shadow-2xl overflow-hidden">
        
        {/* Glow Ambient */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-black uppercase tracking-wider mb-3 shadow-sm">
            <Zap size={14} className="text-emerald-400 fill-emerald-400" />
            <span>Fitur Rekomendasi Device</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-2 font-display">
            Kuat Main Apa Ya?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Ketik prosesor dan kartu grafis laptopmu di bawah. Sistem pintar kami akan langsung menganalisa kelancaran dan menampilkan game yang cocok tanpa pusing istilah teknis.
          </p>
        </div>

        {/* 2. Quick Presets Bar (Pilihan 1-Klik untuk yang tidak mau ngetik) */}
        <div className="mb-6 relative z-10 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1">Atau pilih cepat:</span>
          {QUICK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold transition-all active:scale-95"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 3. Panduan dxdiag Ringkas (Collapsible) */}
        <div className="mb-8 relative z-10">
          <button
            type="button"
            onClick={() => setShowDxdiagGuide(!showDxdiagGuide)}
            className="w-full text-left p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <HelpCircle size={16} className="text-amber-400 shrink-0" />
              <span>Belum tahu spek laptopmu? Klik di sini untuk panduan cek 5 detik via <strong>dxdiag</strong></span>
            </div>
            {showDxdiagGuide ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showDxdiagGuide && (
            <div className="p-4 sm:p-5 mt-2 rounded-2xl bg-[#080B12] border border-white/10 text-xs text-slate-300 space-y-3 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-black text-amber-400 block mb-1">Langkah 1:</span>
                  <p className="leading-relaxed">
                    Tekan tombol <strong>Windows + R</strong> di keyboard secara bersamaan.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-black text-amber-400 block mb-1">Langkah 2:</span>
                  <p className="leading-relaxed">
                    Ketik <code className="bg-white/10 px-1.5 py-0.5 rounded text-amber-300 font-mono">dxdiag</code> lalu tekan <strong>Enter</strong>.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="font-black text-amber-400 block mb-1">Langkah 3:</span>
                  <p className="leading-relaxed">
                    Salin teks pada baris <strong>Processor</strong>, <strong>Memory (RAM)</strong>, dan tab <strong>Display</strong> ke form di bawah!
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                💡 <em>Tips: Cukup copy-paste langsung teks yang ada di dxdiag, sistem pintar kami otomatis mengenali serinya.</em>
              </p>
            </div>
          )}
        </div>

        {/* 4. Form Pintar: 3 Input Sederhana */}
        <div className="space-y-5 relative z-30 bg-[#07090F]/80 p-5 sm:p-7 rounded-2xl border border-white/10">
          
          {/* Input 1: Processor (CPU) dengan Autocomplete */}
          <div ref={cpuContainerRef} className={`relative ${isCpuDropdownOpen ? 'z-30' : 'z-20'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Cpu size={14} className="text-amber-400" />
                <span>1. Processor / CPU:</span>
              </label>
              {selectedCpu && (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} strokeWidth={3} /> Terpilih: {selectedCpu.short}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                ref={cpuInputRef}
                type="text"
                value={cpuQuery}
                onChange={(e) => {
                  setCpuQuery(e.target.value);
                  setSelectedCpu(null);
                  setIsCpuDropdownOpen(true);
                }}
                onFocus={() => setIsCpuDropdownOpen(true)}
                placeholder="Contoh: Intel Core i5-1135G7, AMD Ryzen 5 5600H, Celeron N4020..."
                className="w-full bg-[#0D121F] border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors"
              />
              {cpuQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setCpuQuery('');
                    setSelectedCpu(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions CPU */}
            {isCpuDropdownOpen && cpuSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0C101A] border border-amber-400/30 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-black/80 z-50 max-h-60 overflow-y-auto p-1.5 divide-y divide-white/5 backdrop-blur-xl">
                {cpuSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCpu(item)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div>
                      <span className="text-white font-bold block group-hover:text-amber-400">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Seri: {item.short}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-slate-300">
                      {item.tier === 'high' ? 'High-End' : item.tier === 'mid' ? 'Menengah' : 'Standar'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input 2: Kapasitas RAM (Pill 1-Klik) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <HardDrive size={14} className="text-amber-400" />
                <span>2. Kapasitas RAM:</span>
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Aktif: <strong className="text-white">{ramGB} GB</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {RAM_OPTIONS.map((r) => {
                const isSelected = ramGB === r.gb;
                return (
                  <button
                    key={r.gb}
                    type="button"
                    onClick={() => handleSelectRam(r.gb)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-amber-400/15 border-amber-400 text-amber-300 font-black shadow-md shadow-amber-400/10 ring-1 ring-amber-400/30'
                        : 'bg-[#0D121F] border-white/10 hover:border-white/20 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-extrabold">{r.label}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">{r.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input 3: Kartu Grafis / VGA (GPU) dengan Autocomplete */}
          <div ref={gpuContainerRef} className={`relative ${isGpuDropdownOpen ? 'z-30' : 'z-10'}`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Gamepad2 size={14} className="text-amber-400" />
                <span>3. Kartu Grafis (VGA / GPU dari Tab Display):</span>
              </label>
              {selectedGpu && (
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <Check size={12} strokeWidth={3} /> Terpilih: {selectedGpu.short}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                ref={gpuInputRef}
                type="text"
                value={gpuQuery}
                onChange={(e) => {
                  setGpuQuery(e.target.value);
                  setSelectedGpu(null);
                  setIsGpuDropdownOpen(true);
                }}
                onFocus={() => setIsGpuDropdownOpen(true)}
                placeholder="Contoh: Intel UHD Graphics, Iris Xe, GTX 1650, RTX 3050..."
                className="w-full bg-[#0D121F] border border-white/15 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-colors"
              />
              {gpuQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setGpuQuery('');
                    setSelectedGpu(null);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions GPU */}
            {isGpuDropdownOpen && gpuSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0C101A] border border-amber-400/30 rounded-2xl shadow-2xl shadow-black/80 ring-1 ring-black/80 z-50 max-h-60 overflow-y-auto p-1.5 divide-y divide-white/5 backdrop-blur-xl">
                {gpuSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectGpu(item)}
                    className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between text-xs transition-colors group"
                  >
                    <div>
                      <span className="text-white font-bold block group-hover:text-amber-400">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Tipe: {item.isDedicated ? 'Dedicated Gaming GPU' : 'Integrated (iGPU)'}
                      </span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      item.isDedicated ? 'bg-purple-500/15 text-purple-300' : 'bg-emerald-500/15 text-emerald-300'
                    }`}>
                      {item.isDedicated ? 'Dedicated' : 'Onboard'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* 5. HASIL DIAGNOSA INSTAN (Card Hasil Otomatis) */}
        {diagnosis && (
          <div className="mt-6 p-5 sm:p-7 rounded-2xl bg-[#080C14] border border-amber-400/40 relative z-10 shadow-xl space-y-4 animate-in fade-in duration-300">
            
            {/* Header Hasil */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Kategori Perangkat Anda:
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    {diagnosis.tierLabel}
                  </h3>
                </div>
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw size={12} />
                <span>Ulangi / Ganti Spek</span>
              </button>
            </div>

            {/* Headline */}
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-amber-300">
                {diagnosis.headline}
              </h4>
            </div>

            {/* Top 5 Game yang Memenuhi Syarat (List Tabel Tanpa Border) */}
            <div className="pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Gamepad2 size={14} className="text-amber-400" />
                  <span>Top 5 Game Populer yang Kuat di Spek Ini:</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 w-fit">
                  100% Minimum Requirements Terpenuhi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border-none">
                  <thead>
                    <tr className="text-[10px] uppercase font-bold text-slate-500 border-b border-white/5">
                      <th className="py-2 px-2.5 w-8 font-mono">#</th>
                      <th className="py-2 px-2.5">Judul Game (Katalog Resmi)</th>
                      <th className="py-2 px-2.5">Ukuran</th>
                      <th className="py-2 px-2.5">Estimasi Kelancaran</th>
                      <th className="py-2 px-2.5 text-right">Opsi Pembelian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03] text-xs">
                    {top5Games.map((game, idx) => (
                      <tr 
                        key={game.id || idx} 
                        onClick={() => onSelectGame?.(game.rawGame || game)}
                        className="hover:bg-white/[0.06] cursor-pointer transition-all group"
                      >
                        <td className="py-2.5 px-2.5 font-mono text-slate-500 text-xs font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="text-white font-bold block group-hover:text-amber-400 transition-colors">
                            {game.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {game.genre}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-slate-400 text-xs whitespace-nowrap">
                          {game.size}
                        </td>
                        <td className="py-2.5 px-2.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-[11px] border border-emerald-500/20">
                            <Check size={11} strokeWidth={3} />
                            {game.performance}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectGame?.(game.rawGame || game);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400 text-amber-400 hover:text-slate-950 font-bold text-[11px] transition-all border border-amber-400/25 shadow-sm"
                          >
                            <span>Detail & Beli</span>
                            <ArrowUpRight size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Specs Highlight & Preset Advice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                <span className="text-slate-400 text-[11px] block">Rekomendasi Setelan Layar:</span>
                <strong className="text-white font-bold text-sm">{diagnosis.recommendedPreset}</strong>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs">
                <span className="text-slate-400 text-[11px] block">Estimasi Kecepatan (FPS):</span>
                <strong className="text-emerald-400 font-bold text-sm">{diagnosis.fpsOverview}</strong>
              </div>
            </div>

            {/* Dual CTA Konversi */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleViewCompatibleGames}
                className="w-full sm:flex-1 py-3.5 px-5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-400/20 active:scale-95"
              >
                <Sparkles size={16} />
                <span>Lihat lengkap game yang sesuai dengan spek saya</span>
                <ArrowUpRight size={16} className="stroke-[2.5]" />
              </button>

              <a
                href={waConsultUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto py-3.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>Tanya Admin di WA</span>
              </a>
            </div>

          </div>
        )}

      </div>
    </section>
  );
};

export default HardwareCheckerSection;
