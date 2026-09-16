// src/features/landing/utils/hardwareEngine.js

export const CPU_OPTIONS = [
  { id: 'cpu_entry', label: 'Intel Celeron / Pentium / Core 2 Duo / AMD Athlon', score: 1, short: 'Celeron / Pentium / Athlon' },
  { id: 'cpu_old_mid', label: 'Intel Core i3 / Core i5 Generasi Lama (Gen 1 - 7)', score: 2, short: 'Core i3/i5 Lawas' },
  { id: 'cpu_modern_mid', label: 'Intel Core i3 (Gen 8+) / Core i5 (Gen 8-10) / AMD Ryzen 3 & 5 (Gen 1-3)', score: 3, short: 'Core i3/i5 Modern / Ryzen 3/5' },
  { id: 'cpu_high', label: 'Intel Core i5 (Gen 11+) / Core i7 / Core i9 / AMD Ryzen 5 (Gen 5+) / Ryzen 7 & 9', score: 4, short: 'Core i5/i7/i9 High / Ryzen 7/9' },
  { id: 'cpu_apple', label: 'Apple Silicon (M1 / M2 / M3 / M4)', score: 4, short: 'Apple M1/M2/M3' },
];

export const RAM_OPTIONS = [
  { id: 4, label: '4 GB RAM', gb: 4, score: 1 },
  { id: 8, label: '8 GB RAM (Standar Pelajar/Kantor)', gb: 8, score: 2 },
  { id: 16, label: '16 GB RAM (Standar Gaming)', gb: 16, score: 3 },
  { id: 32, label: '32 GB RAM atau Lebih (High-End)', gb: 32, score: 4 },
];

export const GPU_OPTIONS = [
  { 
    id: 'gpu_onboard_old', 
    label: 'Intel HD Graphics 3000/4000 (Onboard Lawas)', 
    score: 1, 
    vramGB: 0.5, 
    short: 'Intel HD Onboard Lawas',
    isDedicated: false 
  },
  { 
    id: 'gpu_onboard_modern', 
    label: 'Intel UHD / Iris Xe / AMD Radeon Vega (Onboard Modern)', 
    score: 2, 
    vramGB: 1.5, 
    short: 'Intel UHD / Iris Xe / Vega Onboard',
    isDedicated: false 
  },
  { 
    id: 'gpu_entry_discrete', 
    label: 'NVIDIA GT 730 / GT 1030 / GeForce MX 250/350/450', 
    score: 2.5, 
    vramGB: 2, 
    short: 'NVIDIA GT / MX Series (Entry)',
    isDedicated: true 
  },
  { 
    id: 'gpu_mid_gtx', 
    label: 'NVIDIA GTX 1050 / GTX 1650 / GTX 1660 / AMD RX 570/580', 
    score: 3.5, 
    vramGB: 4, 
    short: 'GTX 1050/1650/1660 / RX 580',
    isDedicated: true 
  },
  { 
    id: 'gpu_high_rtx', 
    label: 'NVIDIA RTX 2060 / RTX 3050 / RTX 3060 / AMD RX 6600', 
    score: 4.5, 
    vramGB: 6, 
    short: 'RTX 2060/3050/3060 / RX 6600',
    isDedicated: true 
  },
  { 
    id: 'gpu_flagship', 
    label: 'NVIDIA RTX 3070 / RTX 4060 / RTX 4070 ke atas', 
    score: 5.5, 
    vramGB: 8, 
    short: 'RTX 3070/4060+ (Flagship)',
    isDedicated: true 
  },
];

export const DEVICE_TYPES = [
  { id: 'laptop', label: 'Laptop / Notebook' },
  { id: 'pc', label: 'PC Desktop' },
];

export const STORAGE_PROFILE_KEY = 'mygameon_user_pc_profile';

/**
 * Mengklasifikasikan hardware pembeli ke dalam tier yang tepat
 */
export function classifyUserHardware({ cpuId, ramGB, gpuId, deviceType = 'laptop' }) {
  const cpu = CPU_OPTIONS.find((c) => c.id === cpuId) || CPU_OPTIONS[1];
  const ram = RAM_OPTIONS.find((r) => r.gb === Number(ramGB)) || RAM_OPTIONS[1];
  const gpu = GPU_OPTIONS.find((g) => g.id === gpuId) || GPU_OPTIONS[1];

  let tier = 'low';
  let tierLabel = 'Device Low Spek';
  let badgeColor = 'emerald';
  let summary = 'Aman untuk game ringan, game klasik, indie, & emulator.';

  // Penentuan kelas cerdas
  if (!gpu.isDedicated || ram.gb <= 8 || gpu.score <= 2.5) {
    tier = 'low';
    tierLabel = 'Device Low Spek';
    badgeColor = 'emerald';
    summary = 'Cocok untuk game ringan (<15 GB), The Sims 4 standar, Stardew Valley, GTA San Andreas, & grafis 720p.';
  } else if (gpu.score >= 4.5 && ram.gb >= 16 && cpu.score >= 4) {
    tier = 'high';
    tierLabel = 'Device High-End';
    badgeColor = 'purple';
    summary = 'Siap libas game AAA berat seperti Cyberpunk 2077, Black Myth Wukong, & RDR2 di setelan High/Ultra 60+ FPS.';
  } else {
    tier = 'mid';
    tierLabel = 'Device Menengah';
    badgeColor = 'amber';
    summary = 'Lancar untuk GTA V, The Sims 4 All Packs, FIFA, Valorant, Genshin Impact, & game mainstream 15-50 GB.';
  }

  return {
    cpuId: cpu.id,
    cpuLabel: cpu.label,
    cpuShort: cpu.short,
    cpuScore: cpu.score,

    ramGB: ram.gb,
    ramLabel: ram.label,
    ramScore: ram.score,

    gpuId: gpu.id,
    gpuLabel: gpu.label,
    gpuShort: gpu.short,
    gpuScore: gpu.score,
    isDedicatedGpu: gpu.isDedicated,

    deviceType,
    tier,
    tierLabel,
    badgeColor,
    summary,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Menjalankan uji diagnosa "Can I Run It" secara head-to-head untuk game tertentu
 */
export function runCanIRunIt(game, profile) {
  if (!game || !profile) {
    return null;
  }

  const rawSize = game.fileSizeBytes || game.size || 0;
  const sizeGB = typeof rawSize === 'number' && rawSize > 0 
    ? rawSize / (1024 * 1024 * 1024) 
    : (typeof rawSize === 'string' && rawSize.toLowerCase().includes('gb') ? parseFloat(rawSize) : 20);

  const title = (game.title || game.name || '').toLowerCase();

  // 1. Tentukan kebutuhan minimum game
  let req = {
    minRamGB: 4,
    minCpuScore: 1,
    minGpuScore: 1,
    minGpuDedicated: false,
    minCpuLabel: 'Intel Core 2 Duo / Core i3',
    minGpuLabel: 'Intel HD Graphics 4000',
    tier: 'low',
  };

  // Game Berat AAA
  if (
    sizeGB >= 50 ||
    title.includes('cyberpunk') ||
    title.includes('red dead') ||
    title.includes('tekken 8') ||
    title.includes('black myth') ||
    title.includes('forza horizon') ||
    title.includes('god of war') ||
    title.includes('spiderman') ||
    title.includes('spider-man') ||
    title.includes('starfield') ||
    title.includes('alan wake 2')
  ) {
    req = {
      minRamGB: 12,
      minCpuScore: 3.5,
      minGpuScore: 3.5,
      minGpuDedicated: true,
      minCpuLabel: 'Intel Core i5 (Gen 8+) / Ryzen 5',
      minGpuLabel: 'NVIDIA GTX 1060 / GTX 1650 (VGA Dedicated)',
      tier: 'high',
    };
  } 
  // Game Menengah
  else if (
    sizeGB >= 15 ||
    title.includes('sims 4') ||
    title.includes('gta v') ||
    title.includes('witcher') ||
    title.includes('fifa') ||
    title.includes('pes ') ||
    title.includes('naruto') ||
    title.includes('assassin')
  ) {
    req = {
      minRamGB: 8,
      minCpuScore: 2.5,
      minGpuScore: 2.5,
      minGpuDedicated: false,
      minCpuLabel: 'Intel Core i3 / Core i5 / AMD Ryzen 3',
      minGpuLabel: 'Intel Iris Xe / NVIDIA GT 1030 / GTX 1050',
      tier: 'mid',
    };
  }

  // 2. Head-to-Head Check per Komponen
  const cpuPass = profile.cpuScore >= req.minCpuScore;
  const ramPass = profile.ramGB >= req.minRamGB;
  const gpuPass = profile.gpuScore >= req.minGpuScore && (!req.minGpuDedicated || profile.isDedicatedGpu);

  // 3. Rumuskan Hasil Diagnosa
  const allPass = cpuPass && ramPass && gpuPass;
  const onlyGpuFail = cpuPass && ramPass && !gpuPass;
  const onlyRamFail = cpuPass && !ramPass && gpuPass;

  let verdict = 'optimal';
  let headline = 'Lancar di Laptop/PC Kamu!';
  let message = 'Spesifikasi device kamu memenuhi kebutuhan minimum game ini. Siap dimainkan tanpa kendala.';
  let badgeColor = 'emerald';

  if (allPass) {
    if (profile.tier === 'high' || (profile.gpuScore >= 4.5 && profile.ramGB >= 16)) {
      verdict = 'optimal';
      headline = 'Lancar Maksimal (60+ FPS)!';
      message = 'Device kamu memiliki performa tinggi untuk game ini. Bisa disetel di grafik Medium/High secara mulus.';
      badgeColor = 'emerald';
    } else {
      verdict = 'playable';
      headline = 'Lancar Dimainkan!';
      message = 'Device kamu memenuhi spesifikasi minimum. Disarankan setelan grafis Default / 1080p.';
      badgeColor = 'emerald';
    }
  } else if (onlyGpuFail) {
    verdict = 'unsupported';
    headline = 'GPU / VGA Belum Memadai (Bisa Lag)';
    message = `Game ini butuh kartu grafis gaming (${req.minGpuLabel}), sedangkan device kamu menggunakan ${profile.gpuShort}. Game kemungkinan besar akan patah-patah atau drop FPS.`;
    badgeColor = 'rose';
  } else if (onlyRamFail) {
    verdict = 'unsupported';
    headline = 'Kapasitas RAM Kurang';
    message = `Game ini membutuhkan RAM minimal ${req.minRamGB} GB, sedangkan laptop kamu saat ini memiliki ${profile.ramGB} GB RAM.`;
    badgeColor = 'rose';
  } else {
    verdict = 'unsupported';
    headline = 'Spek Belum Memadai';
    message = 'Device kamu belum memenuhi syarat minimum untuk memainkan game ini dengan nyaman.';
    badgeColor = 'rose';
  }

  return {
    verdict,
    headline,
    message,
    badgeColor,
    isPlayable: allPass,
    checks: {
      cpu: {
        pass: cpuPass,
        user: profile.cpuShort || profile.cpuLabel,
        req: req.minCpuLabel,
      },
      ram: {
        pass: ramPass,
        user: `${profile.ramGB} GB RAM`,
        req: `${req.minRamGB} GB RAM`,
      },
      gpu: {
        pass: gpuPass,
        user: profile.gpuShort || profile.gpuLabel,
        req: req.minGpuLabel,
      },
    },
    gameTier: req.tier,
  };
}
