// src/features/landing/utils/hardwareEngine.js

export const CPU_OPTIONS = [
  { id: 'cpu_entry', label: 'Intel Celeron / Pentium / Core 2 Duo / AMD Athlon (Entry/Lawas)', score: 1.0, short: 'Celeron / Pentium / Athlon' },
  { id: 'cpu_old_mid', label: 'Intel Core i3 / Core i5 Generasi Lama (Gen 1 - 7) / AMD FX Series', score: 2.0, short: 'Core i3/i5 Lawas (Gen 1-7)' },
  { id: 'cpu_modern_mid', label: 'Intel Core i3 (Gen 8+) / Core i5 (Gen 8-10) / AMD Ryzen 3 & 5 (Gen 1-3)', score: 3.2, short: 'Core i3/i5 Modern / Ryzen 3/5' },
  { id: 'cpu_high', label: 'Intel Core i5 (Gen 11+) / Core i7 & i9 (Gen 8+) / AMD Ryzen 5 (Gen 5+) / Ryzen 7 & 9', score: 4.5, short: 'Core i5/i7/i9 High / Ryzen 7/9' },
  { id: 'cpu_ultra', label: 'Intel Core Ultra / Core Gen 13-14 High / AMD Ryzen 7000-9000 Series (Enthusiast)', score: 5.5, short: 'Core Gen 13-14 / Ryzen 7000+' },
  { id: 'cpu_apple', label: 'Apple Silicon (M1 / M2 / M3 / M4 / Pro / Max)', score: 4.5, short: 'Apple M-Series' },
];

export const RAM_OPTIONS = [
  { id: 4, label: '4 GB RAM', gb: 4, score: 1 },
  { id: 8, label: '8 GB RAM (Standar Pelajar/Kantor)', gb: 8, score: 2 },
  { id: 16, label: '16 GB RAM (Standar Gaming Modern)', gb: 16, score: 3 },
  { id: 32, label: '32 GB RAM atau Lebih (High-End / Kreator)', gb: 32, score: 4 },
];

export const GPU_OPTIONS = [
  { 
    id: 'gpu_onboard_old', 
    label: 'Intel HD Graphics 2000/3000/4000 (Onboard Sangat Lawas)', 
    score: 1.0, 
    vramGB: 0.5, 
    short: 'Intel HD Onboard Lawas',
    isDedicated: false 
  },
  { 
    id: 'gpu_onboard_standard', 
    label: 'Intel UHD 620/630 / AMD Radeon Vega 3/6 (Onboard Standar Pelajar/Kantor)', 
    score: 1.8, 
    vramGB: 1.0, 
    short: 'Intel UHD / Vega 3-6',
    isDedicated: false 
  },
  { 
    id: 'gpu_onboard_high', 
    label: 'Intel Iris Xe / AMD Radeon Vega 7/8 / Radeon 680M/780M / Intel Arc iGPU (Onboard Gaming Modern)', 
    score: 2.8, 
    vramGB: 2.0, 
    short: 'Iris Xe / Radeon 680M/780M',
    isDedicated: false 
  },
  { 
    id: 'gpu_entry_discrete', 
    label: 'NVIDIA GT 730 / GT 1030 / GeForce MX 150/250/350/450 / GTX 750 Ti', 
    score: 2.5, 
    vramGB: 2.0, 
    short: 'GeForce GT / MX / GTX 750 Ti',
    isDedicated: true 
  },
  { 
    id: 'gpu_mid_gtx', 
    label: 'NVIDIA GTX 1050 / GTX 1060 / GTX 1650 / GTX 1660 / AMD RX 570/580', 
    score: 3.6, 
    vramGB: 4.0, 
    short: 'GTX 1050/1650 / RX 580',
    isDedicated: true 
  },
  { 
    id: 'gpu_high_rtx', 
    label: 'NVIDIA RTX 2060 / RTX 3050 / RTX 3060 / AMD RX 6600 / Intel Arc A750', 
    score: 4.8, 
    vramGB: 6.0, 
    short: 'RTX 2060/3050/3060 / RX 6600',
    isDedicated: true 
  },
  { 
    id: 'gpu_flagship', 
    label: 'NVIDIA RTX 3070 / RTX 4060 / RTX 4070 / RTX 4080 / AMD RX 7700+ (High-End)', 
    score: 6.0, 
    vramGB: 8.0, 
    short: 'RTX 3070/4060+ (Flagship)',
    isDedicated: true 
  },
];

export const DEVICE_TYPES = [
  { id: 'laptop', label: 'Laptop / Notebook' },
  { id: 'pc', label: 'PC Desktop' },
];

export const AWAM_DEVICE_PRESETS = [
  {
    id: 'preset_student',
    title: 'Laptop Santai / Kuliah',
    subtitle: 'Asus Vivobook, Lenovo Ideapad, HP 14, Dell Inspiron',
    badge: 'Paling Umum',
    badgeColor: 'emerald',
    specs: {
      deviceType: 'laptop',
      cpuId: 'cpu_old_mid',
      ramGB: 8,
      gpuId: 'gpu_onboard_standard',
    },
    specsSummary: 'Core i3 / Ryzen 3 • RAM 8GB • Intel UHD / iGPU',
    description: 'Laptop standar untuk mengetik, kuliah, atau kantor tanpa kartu grafis gaming terpisah.',
  },
  {
    id: 'preset_modern_thin',
    title: 'Laptop Gaming Standar',
    subtitle: 'Asus TUF, Lenovo LOQ, Acer Nitro, HP Victus, GTX/RTX entry',
    badge: 'Populer',
    badgeColor: 'amber',
    specs: {
      deviceType: 'laptop',
      cpuId: 'cpu_modern_mid',
      ramGB: 16,
      gpuId: 'gpu_mid_gtx',
    },
    specsSummary: 'Core i5 / Ryzen 5 • RAM 16GB • GTX 1650 / RTX 2050/3050',
    description: 'Laptop gaming standar yang siap melibas mayoritas game populer dan setting menengah-tinggi.',
  },
  {
    id: 'preset_gaming',
    title: 'PC / Laptop Sultan',
    subtitle: 'ROG, Legion, Alienware, PC Rakitan RTX 4060 ke atas',
    badge: 'Monster',
    badgeColor: 'purple',
    specs: {
      deviceType: 'laptop',
      cpuId: 'cpu_high',
      ramGB: 16,
      gpuId: 'gpu_high_rtx',
    },
    specsSummary: 'Core i7/Ryzen 7 • RAM 16-32GB • RTX 4060/4070+',
    description: 'Perangkat monster dengan performa maksimal untuk grafis rata kanan ultra & ray tracing.',
  },
];

export const STORAGE_PROFILE_KEY = 'mygameon_user_pc_profile';

/**
 * Mencari GPU berdasarkan ID dengan backward compatibility untuk opsi lama
 */
function resolveGpuOption(gpuId) {
  if (!gpuId) return GPU_OPTIONS[2]; // Default Iris Xe
  const direct = GPU_OPTIONS.find((g) => g.id === gpuId);
  if (direct) return direct;
  // Aliasing ID versi lama
  if (gpuId === 'gpu_onboard_modern') return GPU_OPTIONS[2]; // gpu_onboard_high
  return GPU_OPTIONS[2];
}

/**
 * Mengklasifikasikan hardware pembeli ke dalam tier yang tepat
 */
export function classifyUserHardware({ cpuId, ramGB, gpuId, deviceType = 'laptop' }) {
  const cpu = CPU_OPTIONS.find((c) => c.id === cpuId) || CPU_OPTIONS[2];
  const ram = RAM_OPTIONS.find((r) => r.gb === Number(ramGB)) || RAM_OPTIONS[1];
  const gpu = resolveGpuOption(gpuId);

  let tier = 'low';
  let tierLabel = 'Device Low Spek';
  let badgeColor = 'emerald';
  let summary = 'Aman untuk game ringan, game klasik, indie, & emulator.';

  // Penentuan kelas cerdas V2
  if (!gpu.isDedicated && gpu.score < 2.5) {
    tier = 'low';
    tierLabel = 'Device Low Spek';
    badgeColor = 'emerald';
    summary = 'Cocok untuk game ringan (<15 GB), The Sims 4 standar, Stardew Valley, GTA San Andreas, & grafis 720p.';
  } else if (!gpu.isDedicated && gpu.score >= 2.5 && ram.gb >= 8) {
    tier = 'mid_igpu';
    tierLabel = 'Laptop iGPU Modern';
    badgeColor = 'amber';
    summary = 'Kuat untuk GTA V, The Sims 4 All Packs, Valorant, Genshin Impact, & game e-sport/mainstream pada 720p/1080p Normal.';
  } else if (gpu.isDedicated && gpu.score >= 4.5 && ram.gb >= 16 && cpu.score >= 4) {
    tier = 'high';
    tierLabel = 'Device High-End';
    badgeColor = 'purple';
    summary = 'Siap libas game AAA berat seperti Cyberpunk 2077, Black Myth Wukong, & RDR2 di setelan High/Ultra 60+ FPS.';
  } else {
    tier = 'mid';
    tierLabel = 'Device Menengah';
    badgeColor = 'amber';
    summary = 'Lancar untuk GTA V, The Sims 4 All Packs, FIFA, God of War, & game mainstream 15-50 GB.';
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
 * Menentukan profil beban spesifikasi game berdasarkan ukuran dan nama game
 */
export function determineGameRequirement(game) {
  // Jika game memiliki data spesifikasi resmi (misal disinkronkan dari Steam API / Firestore)
  if (game?.systemRequirements && typeof game.systemRequirements === 'object') {
    const sys = game.systemRequirements;
    const title = (game?.title || game?.name || '').toLowerCase();
    return {
      tier: sys.tier || 'medium',
      tierLabel: sys.tierLabel || 'Spesifikasi Resmi',
      minRamGB: Number(sys.minRamGB) || 8,
      minCpuScore: Number(sys.minCpuScore) || 2.0,
      minGpuScore: Number(sys.minGpuScore) || 2.0,
      minGpuDedicated: Boolean(sys.minGpuDedicated),
      minCpuLabel: sys.minCpuLabel || 'Intel Core i3 / AMD Ryzen 3',
      minGpuLabel: sys.minGpuLabel || 'NVIDIA GTX / Intel Iris Xe',
      isSims4: Boolean(sys.isSims4 || title.includes('sims 4') || title.includes('the sims')),
      isOfficial: true,
    };
  }

  const rawSize = game?.fileSizeBytes || game?.size || 0;
  const sizeGB = typeof rawSize === 'number' && rawSize > 0 
    ? rawSize / (1024 * 1024 * 1024) 
    : (typeof rawSize === 'string' && rawSize.toLowerCase().includes('gb') ? parseFloat(rawSize) : 20);

  const title = (game?.title || game?.name || '').toLowerCase();

  // Deteksi game remaster, remake, atau porting engine modern (Unreal Engine 4/5, RE Engine)
  const isDefinitiveOrRemaster = 
    title.includes('definitive') || 
    title.includes('remake') || 
    title.includes('remaster') || 
    title.includes('trilogy') ||
    title.includes('special edition') ||
    title.includes('enhanced edition') ||
    title.includes('unreal');

  // 1. Disambiguasi Khusus GTA San Andreas (Klasik 2004 vs Definitive Edition 2021)
  if (title.includes('san andreas')) {
    if (isDefinitiveOrRemaster) {
      return {
        tier: 'medium',
        tierLabel: 'Game Menengah (Unreal Engine 4)',
        minRamGB: 8,
        minCpuScore: 2.8,
        minGpuScore: 3.2,
        minGpuDedicated: true,
        minCpuLabel: 'Intel Core i5 Gen 8+ / AMD Ryzen 5',
        minGpuLabel: 'NVIDIA GTX 760 / GTX 1050 (VGA Dedicated)',
        isSims4: false,
      };
    }
    return {
      tier: 'light',
      tierLabel: 'Game Ringan Klasik (Enteng)',
      minRamGB: 4,
      minCpuScore: 1.0,
      minGpuScore: 1.0,
      minGpuDedicated: false,
      minCpuLabel: 'Intel Core 2 Duo / Celeron / Core i3',
      minGpuLabel: 'Intel HD Graphics / Semua VGA',
      isSims4: false,
    };
  }

  // 2. Seri The Sims
  if (title.includes('sims 1') || title.includes('sims 2')) {
    return {
      tier: 'light',
      tierLabel: 'Game Ringan Klasik',
      minRamGB: 4,
      minCpuScore: 1.0,
      minGpuScore: 1.0,
      minGpuDedicated: false,
      minCpuLabel: 'Intel Core 2 Duo / Core i3',
      minGpuLabel: 'Intel HD Graphics / Semua VGA',
      isSims4: false,
    };
  }

  if (title.includes('sims 4') || title.includes('the sims')) {
    return {
      tier: 'medium',
      tierLabel: 'Game Menengah (iGPU Ready)',
      minRamGB: 8,
      minCpuScore: 2.0,
      minGpuScore: 1.8,
      minGpuDedicated: false,
      minCpuLabel: 'Intel Core i3 / AMD Ryzen 3',
      minGpuLabel: 'Intel UHD / Iris Xe / Radeon Vega',
      isSims4: true,
    };
  }

  // 3. GTA V (Optimasinya sangat bersahabat di iGPU Iris Xe maupun kartu entry)
  if (title.includes('gta v') || title.includes('grand theft auto v') || title.includes('gta 5')) {
    return {
      tier: 'medium',
      tierLabel: 'Game Menengah Populer',
      minRamGB: 8,
      minCpuScore: 2.5,
      minGpuScore: 2.5,
      minGpuDedicated: false,
      minCpuLabel: 'Intel Core i3 Gen 8+ / Ryzen 3',
      minGpuLabel: 'Intel Iris Xe / GTX 750 Ti / GTX 1050',
      isSims4: false,
    };
  }

  // 4. Game Sangat Berat / AAA Grafis Tinggi
  if (
    title.includes('cyberpunk') ||
    title.includes('red dead') ||
    title.includes('tekken 8') ||
    title.includes('black myth') ||
    title.includes('wukong') ||
    title.includes('forza horizon') ||
    title.includes('god of war') ||
    title.includes('spiderman') ||
    title.includes('spider-man') ||
    title.includes('starfield') ||
    title.includes('alan wake 2') ||
    title.includes('ghost of tsushima') ||
    title.includes('the last of us') ||
    title.includes('hogwarts') ||
    title.includes('frostpunk 2') ||
    title.includes('dragons dogma 2') ||
    title.includes('resident evil 4 remake') ||
    title.includes('silent hill 2') ||
    title.includes('stalker 2') ||
    title.includes('hellblade') ||
    title.includes('senua') ||
    sizeGB >= 60
  ) {
    return {
      tier: 'ultra_heavy',
      tierLabel: 'Game Berat AAA',
      minRamGB: 16,
      minCpuScore: 3.8,
      minGpuScore: 4.0,
      minGpuDedicated: true,
      minCpuLabel: 'Intel Core i5 (Gen 10+) / Ryzen 5',
      minGpuLabel: 'NVIDIA GTX 1660 / RTX 3050 (VGA Dedicated)',
      isSims4: false,
    };
  }

  // 5. Game Menengah / Remaster / Modern 3D
  if (
    isDefinitiveOrRemaster ||
    sizeGB >= 12 ||
    title.includes('witcher') ||
    title.includes('fifa') ||
    title.includes('pes ') ||
    title.includes('football') ||
    title.includes('naruto') ||
    title.includes('assassin') ||
    title.includes('resident evil') ||
    title.includes('sekiro') ||
    title.includes('elden ring') ||
    title.includes('genshin') ||
    title.includes('valorant') ||
    title.includes('motogp') ||
    title.includes('call of duty') ||
    title.includes('duty') ||
    title.includes('generation zero') ||
    title.includes('lego horizon') ||
    title.includes('goat simulator') ||
    title.includes('farming simulator') ||
    title.includes('car mechanic simulator') ||
    title.includes('autobahn') ||
    title.includes('sledders') ||
    title.includes('tropico 6')
  ) {
    return {
      tier: 'medium',
      tierLabel: 'Game Menengah',
      minRamGB: 8,
      minCpuScore: 2.5,
      minGpuScore: 2.5,
      minGpuDedicated: false,
      minCpuLabel: 'Intel Core i3 / Core i5 / AMD Ryzen 3',
      minGpuLabel: 'Intel Iris Xe / NVIDIA GT 1030 / GTX 1050',
      isSims4: false,
    };
  }

  // 6. Game Ringan / Klasik / Indie (Aman untuk Intel HD Graphics / Laptop Pelajar)
  return {
    tier: 'light',
    tierLabel: 'Game Ringan Klasik',
    minRamGB: 4,
    minCpuScore: 1.0,
    minGpuScore: 1.0,
    minGpuDedicated: false,
    minCpuLabel: 'Intel Core 2 Duo / Celeron / Core i3',
    minGpuLabel: 'Intel HD Graphics / Semua VGA',
    isSims4: false,
  };
}

/**
 * Mesin Diagnosa "Can I Run It" V2:
 * Mengkalkulasi Kompatibilitas Komponen, Estimasi FPS 1080p/720p, Preset Grafik, dan Tips Optimasi
 */
export function runCanIRunIt(game, profile) {
  if (!game || !profile) {
    return null;
  }

  const req = determineGameRequirement(game);

  // 1. Head-to-Head Check per Komponen
  const cpuPass = profile.cpuScore >= req.minCpuScore;
  const ramPass = profile.ramGB >= req.minRamGB;
  const gpuPass = profile.gpuScore >= req.minGpuScore && (!req.minGpuDedicated || profile.isDedicatedGpu);

  const allPass = cpuPass && ramPass && gpuPass;
  const onlyGpuFail = cpuPass && ramPass && !gpuPass;
  const onlyRamFail = cpuPass && !ramPass && gpuPass;

  // 2. Kalkulasi Skor Rasio Kekuatan Hardware vs Beban Game (0 - 100%)
  const hardwarePower = (profile.gpuScore * 0.55) + (profile.cpuScore * 0.30) + (Math.min(profile.ramGB, 16) / 4 * 0.15);
  const demandPower = (req.minGpuScore * 0.55) + (req.minCpuScore * 0.30) + (Math.min(req.minRamGB, 16) / 4 * 0.15);
  const powerRatio = hardwarePower / demandPower;

  let scorePercent = Math.min(100, Math.max(15, Math.round(powerRatio * 70)));
  if (!gpuPass) scorePercent = Math.min(45, scorePercent);
  if (!ramPass) scorePercent = Math.max(20, scorePercent - 20);

  // 3. Estimasi FPS & Preset Grafik
  let fps1080p = { range: '60+ FPS', status: 'Sangat Mulus', preset: 'High / Ultra', color: 'emerald' };
  let fps720p = { range: '60+ FPS', status: 'Sangat Enteng', preset: 'High', color: 'emerald' };
  let performanceTier = 'ultra';
  let verdict = 'optimal';
  let headline = 'Lancar Maksimal di Laptop/PC Kamu!';
  let message = 'Spesifikasi device kamu sangat bertenaga untuk game ini. Siap dimainkan dengan grafik tinggi.';
  let badgeColor = 'emerald';

  if (allPass) {
    if (powerRatio >= 1.45) {
      performanceTier = 'ultra';
      verdict = 'optimal';
      headline = 'Lancar Maksimal (60+ FPS)!';
      message = 'Device kamu memiliki performa tinggi. Siap dimainkan di setelan High / Ultra secara mulus.';
      fps1080p = { range: '60+ FPS', status: 'Mulus Maksimal', preset: 'High / Ultra', color: 'emerald' };
      fps720p = { range: '90+ FPS', status: 'Super Enteng', preset: 'Ultra', color: 'emerald' };
      badgeColor = 'emerald';
    } else if (powerRatio >= 1.15) {
      performanceTier = 'high';
      verdict = 'optimal';
      headline = 'Lancar Mulus di 1080p!';
      message = 'Device kamu sangat mumpuni. Disarankan grafik Medium / High untuk FPS stabil 50-60+.';
      fps1080p = { range: '50 - 60 FPS', status: 'Lancar Stabil', preset: 'Medium / High', color: 'emerald' };
      fps720p = { range: '60+ FPS', status: 'Sangat Mulus', preset: 'High', color: 'emerald' };
      badgeColor = 'emerald';
    } else {
      performanceTier = 'medium';
      verdict = 'playable';
      headline = 'Lancar Dimainkan (Playable)!';
      message = 'Device kamu memenuhi spesifikasi minimum. Disarankan setelan grafis Default / Medium 1080p.';
      fps1080p = { range: '35 - 45 FPS', status: 'Cukup Nyaman', preset: 'Normal / Low', color: 'emerald' };
      fps720p = { range: '50 - 60 FPS', status: 'Lebih Mulus', preset: 'Medium', color: 'emerald' };
      badgeColor = 'emerald';
    }
  } else if (onlyGpuFail) {
    performanceTier = 'low';
    verdict = 'unsupported';
    headline = 'GPU / VGA Belum Memadai';
    message = `Game ini membutuhkan kartu grafis gaming (${req.minGpuLabel}), sedangkan laptopmu menggunakan ${profile.gpuShort}. Game kemungkinan besar akan patah-patah di 1080p.`;
    fps1080p = { range: '< 20 FPS', status: 'Patah-Patah', preset: 'Tidak Disarankan', color: 'rose' };
    fps720p = { range: '25 - 35 FPS', status: 'Batas Bawah', preset: 'Low + FSR', color: 'amber' };
    badgeColor = 'rose';
  } else if (onlyRamFail) {
    performanceTier = 'low';
    verdict = 'unsupported';
    headline = 'Kapasitas RAM Kurang';
    message = `Game ini membutuhkan RAM minimal ${req.minRamGB} GB, sedangkan laptop kamu saat ini memiliki ${profile.ramGB} GB RAM.`;
    fps1080p = { range: 'Stuttering', status: 'Sering Freeze', preset: 'Kurang RAM', color: 'rose' };
    fps720p = { range: 'Stuttering', status: 'Sering Freeze', preset: 'Kurang RAM', color: 'rose' };
    badgeColor = 'rose';
  } else {
    performanceTier = 'unsupported';
    verdict = 'unsupported';
    headline = 'Spek Belum Memadai';
    message = 'Device kamu belum memenuhi syarat minimum untuk memainkan game ini dengan nyaman.';
    fps1080p = { range: '< 15 FPS', status: 'Lag Berat', preset: 'Tidak Kuat', color: 'rose' };
    fps720p = { range: '< 20 FPS', status: 'Tidak Nyaman', preset: 'Tidak Kuat', color: 'rose' };
    badgeColor = 'rose';
  }

  // 4. Tips Optimasi Cerdas Berdasarkan Hardware & Game
  const tips = [];
  if (req.isSims4) {
    tips.push('Game The Sims 4 sangat optimal di device ini. Kamu bisa memasang All DLC dan koleksi Mods/CC dengan lancar.');
  }
  if (req.tier === 'ultra_heavy') {
    tips.push('Aktifkan fitur FSR (AMD) atau DLSS (NVIDIA) pada menu display di dalam game untuk mendongkrak performa hingga +20 FPS.');
  }
  if (!profile.isDedicatedGpu && profile.gpuId !== 'gpu_onboard_old') {
    tips.push('Pastikan laptopmu memakai RAM konfigurasi Dual-Channel (2 keping) agar performa kartu grafis bawaan meningkat hingga 35%.');
  }
  if (profile.ramGB === 8 && req.minRamGB >= 12) {
    tips.push('Disarankan menutup aplikasi lain seperti browser Chrome saat bermain agar RAM tidak habis.');
  }
  if (fps720p.range.includes('60') && fps1080p.range.includes('35')) {
    tips.push('Jika ingin gerakan gameplay ekstra mulus seperti konsol, kamu bisa menurunkan resolusi layar game ke 720p (1280x720).');
  }

  return {
    verdict,
    headline,
    message,
    badgeColor,
    isPlayable: allPass,
    scorePercent,
    performanceTier,
    fps1080p,
    fps720p,
    tips,
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
    gameTierLabel: req.tierLabel,
  };
}

