// src/features/landing/data/hardwareCatalog.js
/**
 * Kamus Data Hardware Cerdas MyGameON
 * Berisi daftar CPU dan GPU paling populer di Indonesia dengan scoring performa.
 * Berjalan 100% Client-side (Zero database read, Zero API cost, 0ms latency).
 */

export const POPULAR_CPUS = [
  // --- Intel Celeron & Pentium (Entry Low) ---
  { id: 'intel_c_n4000', label: 'Intel Celeron N4000 / N4020', short: 'Celeron N4020', score: 1.2, tier: 'low', keywords: 'n4000 n4020 celeron' },
  { id: 'intel_c_n4500', label: 'Intel Celeron N4500 / N5100', short: 'Celeron N4500', score: 1.5, tier: 'low', keywords: 'n4500 n5100 celeron' },
  { id: 'intel_c_n100', label: 'Intel Processor N100 / N200', short: 'Intel N100', score: 2.2, tier: 'low', keywords: 'n100 n200 intel processor' },
  { id: 'intel_p_g5400', label: 'Intel Pentium Gold G5400 / G6400', short: 'Pentium Gold', score: 2.0, tier: 'low', keywords: 'pentium gold g5400 g6400' },
  { id: 'intel_c_j4125', label: 'Intel Celeron J4125', short: 'Celeron J4125', score: 1.6, tier: 'low', keywords: 'j4125 celeron' },

  // --- Intel Core i3 Series ---
  { id: 'intel_i3_gen4', label: 'Intel Core i3 Gen 4/5 (i3-4130 / i3-5005U)', short: 'Core i3 Gen 4', score: 1.8, tier: 'low', keywords: 'i3 4130 4005u 5005u gen 4 5' },
  { id: 'intel_i3_gen6', label: 'Intel Core i3 Gen 6/7 (i3-6100 / i3-7100U)', short: 'Core i3 Gen 7', score: 2.1, tier: 'low', keywords: 'i3 6100 7100u 7020u gen 6 7' },
  { id: 'intel_i3_gen8', label: 'Intel Core i3 Gen 8 (i3-8100 / i3-8130U / i3-8145U)', short: 'Core i3 Gen 8', score: 2.5, tier: 'mid', keywords: 'i3 8100 8130u 8145u gen 8' },
  { id: 'intel_i3_gen10', label: 'Intel Core i3 Gen 10 (i3-1005G1 / i3-10100)', short: 'Core i3 Gen 10', score: 2.8, tier: 'mid', keywords: 'i3 1005g1 10100 10105 10110u gen 10' },
  { id: 'intel_i3_gen11', label: 'Intel Core i3 Gen 11 (i3-1115G4 / i3-1125G4)', short: 'Core i3 Gen 11', score: 3.2, tier: 'mid', keywords: 'i3 1115g4 1125g4 gen 11' },
  { id: 'intel_i3_gen12', label: 'Intel Core i3 Gen 12 (i3-1215U / i3-12100)', short: 'Core i3 Gen 12', score: 3.7, tier: 'mid', keywords: 'i3 1215u 12100 1220p gen 12' },
  { id: 'intel_i3_gen13', label: 'Intel Core i3 Gen 13/14 (i3-1315U / i3-13100)', short: 'Core i3 Gen 13', score: 4.0, tier: 'mid', keywords: 'i3 1315u 13100 14100 gen 13 14' },

  // --- Intel Core i5 Series ---
  { id: 'intel_i5_gen3', label: 'Intel Core i5 Gen 3/4 (i5-3470 / i5-4460 / i5-4200U)', short: 'Core i5 Gen 3/4', score: 2.2, tier: 'low', keywords: 'i5 3470 4460 4200u 4210u gen 3 4' },
  { id: 'intel_i5_gen6', label: 'Intel Core i5 Gen 6/7 (i5-6400 / i5-7200U / i5-7400)', short: 'Core i5 Gen 6/7', score: 2.6, tier: 'mid', keywords: 'i5 6400 6500 7200u 7400 7300hq gen 6 7' },
  { id: 'intel_i5_gen8', label: 'Intel Core i5 Gen 8 (i5-8250U / i5-8400 / i5-8300H)', short: 'Core i5 Gen 8', score: 3.2, tier: 'mid', keywords: 'i5 8250u 8265u 8400 8300h gen 8' },
  { id: 'intel_i5_gen10', label: 'Intel Core i5 Gen 10 (i5-1035G1 / i5-10400 / i5-10300H)', short: 'Core i5 Gen 10', score: 3.6, tier: 'mid', keywords: 'i5 1035g1 1035g4 10400 10300h 10210u gen 10' },
  { id: 'intel_i5_gen11', label: 'Intel Core i5 Gen 11 (i5-1135G7 / i5-11400 / i5-11400H)', short: 'Core i5 Gen 11', score: 4.0, tier: 'high', keywords: 'i5 1135g7 11400 11400h 11300h gen 11' },
  { id: 'intel_i5_gen12', label: 'Intel Core i5 Gen 12 (i5-1235U / i5-12450H / i5-12400)', short: 'Core i5 Gen 12', score: 4.4, tier: 'high', keywords: 'i5 1235u 12450h 12500h 12400 gen 12' },
  { id: 'intel_i5_gen13', label: 'Intel Core i5 Gen 13/14 (i5-13420H / i5-13500H / i5-13400)', short: 'Core i5 Gen 13', score: 4.7, tier: 'high', keywords: 'i5 13420h 13500h 13400 14400 gen 13 14' },

  // --- Intel Core i7 Series ---
  { id: 'intel_i7_gen4', label: 'Intel Core i7 Gen 4/6/7 (i7-4770 / i7-6700 / i7-7700HQ)', short: 'Core i7 Gen 4-7', score: 3.0, tier: 'mid', keywords: 'i7 4770 4790 6700 7700 7700hq gen 4 6 7' },
  { id: 'intel_i7_gen8', label: 'Intel Core i7 Gen 8/9 (i7-8750H / i7-9750H / i7-8700)', short: 'Core i7 Gen 8/9', score: 3.8, tier: 'high', keywords: 'i7 8750h 9750h 8700 9700 gen 8 9' },
  { id: 'intel_i7_gen10', label: 'Intel Core i7 Gen 10 (i7-10750H / i7-10700)', short: 'Core i7 Gen 10', score: 4.1, tier: 'high', keywords: 'i7 10750h 10700 1065g7 gen 10' },
  { id: 'intel_i7_gen11', label: 'Intel Core i7 Gen 11 (i7-11800H / i7-1165G7)', short: 'Core i7 Gen 11', score: 4.4, tier: 'high', keywords: 'i7 11800h 1165g7 11700 gen 11' },
  { id: 'intel_i7_gen12', label: 'Intel Core i7 Gen 12 (i7-12700H / i7-12650H / i7-12700)', short: 'Core i7 Gen 12', score: 4.8, tier: 'high', keywords: 'i7 12700h 12650h 12700 gen 12' },
  { id: 'intel_i7_gen13', label: 'Intel Core i7 Gen 13/14 (i7-13700H / i7-13650HX / i7-14700)', short: 'Core i7 Gen 13/14', score: 5.0, tier: 'high', keywords: 'i7 13700h 13650hx 14700 14700hx gen 13 14' },

  // --- Intel Core Ultra ---
  { id: 'intel_ultra_5', label: 'Intel Core Ultra 5 (125H / 135H)', short: 'Core Ultra 5', score: 4.6, tier: 'high', keywords: 'core ultra 5 125h 135h ultra5' },
  { id: 'intel_ultra_7', label: 'Intel Core Ultra 7 (155H / 165H)', short: 'Core Ultra 7', score: 4.9, tier: 'high', keywords: 'core ultra 7 155h 165h ultra7' },

  // --- AMD Athlon & Entry ---
  { id: 'amd_athlon_3000', label: 'AMD Athlon 3000G / 3050U / Silver 3050e', short: 'Athlon 3000G', score: 1.7, tier: 'low', keywords: 'athlon 3000g 3050u 200ge silver' },

  // --- AMD Ryzen 3 Series ---
  { id: 'amd_r3_gen12', label: 'AMD Ryzen 3 1200 / 2200G / 3200U', short: 'Ryzen 3 2200G/3200U', score: 2.3, tier: 'low', keywords: 'ryzen 3 1200 2200g 3200u r3' },
  { id: 'amd_r3_gen3', label: 'AMD Ryzen 3 3100 / 3300X / 4300U', short: 'Ryzen 3 3100/4300U', score: 2.9, tier: 'mid', keywords: 'ryzen 3 3100 3300x 4300u 5300u' },
  { id: 'amd_r3_gen5', label: 'AMD Ryzen 3 5300U / 7320U', short: 'Ryzen 3 5300U/7320U', score: 3.3, tier: 'mid', keywords: 'ryzen 3 5300u 7320u mendocino' },

  // --- AMD Ryzen 5 Series ---
  { id: 'amd_r5_gen12', label: 'AMD Ryzen 5 1600 / 2600 / 2400G / 3500U', short: 'Ryzen 5 2600/3500U', score: 2.9, tier: 'mid', keywords: 'ryzen 5 1600 2600 2400g 3500u 3550h' },
  { id: 'amd_r5_gen3', label: 'AMD Ryzen 5 3600 / 4500U / 4600H', short: 'Ryzen 5 3600/4600H', score: 3.6, tier: 'mid', keywords: 'ryzen 5 3600 3600x 4500u 4600h 4600g' },
  { id: 'amd_r5_gen5', label: 'AMD Ryzen 5 5500U / 5600H / 5600G / 5600X', short: 'Ryzen 5 5500U/5600X', score: 4.1, tier: 'high', keywords: 'ryzen 5 5500u 5600h 5600g 5600x 5600' },
  { id: 'amd_r5_gen6', label: 'AMD Ryzen 5 6600H / 7535HS / 7530U', short: 'Ryzen 5 6600H/7535HS', score: 4.4, tier: 'high', keywords: 'ryzen 5 6600h 7535hs 7530u 7640hs' },
  { id: 'amd_r5_gen7', label: 'AMD Ryzen 5 7600 / 7600X / 8600G', short: 'Ryzen 5 7600/8600G', score: 4.7, tier: 'high', keywords: 'ryzen 5 7600 7600x 8600g' },

  // --- AMD Ryzen 7 Series ---
  { id: 'amd_r7_gen23', label: 'AMD Ryzen 7 2700 / 3700X / 3750H / 4700U', short: 'Ryzen 7 3700X', score: 3.7, tier: 'high', keywords: 'ryzen 7 2700 3700x 3750h 4700u 4800h' },
  { id: 'amd_r7_gen5', label: 'AMD Ryzen 7 5700U / 5800H / 5700X / 5800X', short: 'Ryzen 7 5700U/5800H', score: 4.4, tier: 'high', keywords: 'ryzen 7 5700u 5800h 5700x 5800x' },
  { id: 'amd_r7_gen67', label: 'AMD Ryzen 7 6800H / 7735HS / 7840HS / 7700X', short: 'Ryzen 7 7735HS/7840HS', score: 4.8, tier: 'high', keywords: 'ryzen 7 6800h 7735hs 7840hs 7700x 8845hs' },
];

export const POPULAR_GPUS = [
  // --- Intel Integrated Graphics (iGPU) ---
  { id: 'intel_hd_legacy', label: 'Intel HD Graphics 4000 / 520 / 530', short: 'Intel HD Graphics', score: 1.5, isDedicated: false, tier: 'low', keywords: 'intel hd graphics 4000 520 530 4400 4600' },
  { id: 'intel_uhd_entry', label: 'Intel UHD Graphics 600 / 605 / 610', short: 'Intel UHD 600/605', score: 1.4, isDedicated: false, tier: 'low', keywords: 'uhd 600 605 610 celeron' },
  { id: 'intel_uhd_std', label: 'Intel UHD Graphics 620 / 630 / UHD 730', short: 'Intel UHD Graphics', score: 2.0, isDedicated: false, tier: 'low', keywords: 'uhd 620 630 uhd 730 uhd 770 intel uhd' },
  { id: 'intel_iris_xe', label: 'Intel Iris Xe Graphics (G7 / 80EU / 96EU)', short: 'Intel Iris Xe', score: 2.8, isDedicated: false, tier: 'mid_igpu', keywords: 'iris xe iris plus intel iris g7 96eu 80eu' },
  { id: 'intel_arc_igpu', label: 'Intel Arc Graphics (Core Ultra iGPU)', short: 'Intel Arc iGPU', score: 3.3, isDedicated: false, tier: 'mid_igpu', keywords: 'intel arc graphics core ultra igpu' },

  // --- AMD Integrated Graphics (APU) ---
  { id: 'amd_vega_low', label: 'AMD Radeon Vega 3 / Radeon Graphics (Athlon/Ryzen 3)', short: 'Radeon Vega 3', score: 1.8, isDedicated: false, tier: 'low', keywords: 'vega 3 radeon graphics amd ryzen 3' },
  { id: 'amd_vega_mid', label: 'AMD Radeon Vega 6 / Vega 7 / Vega 8 (Ryzen 5/7)', short: 'Radeon Vega 7/8', score: 2.7, isDedicated: false, tier: 'mid_igpu', keywords: 'vega 6 vega 7 vega 8 radeon vega ryzen 5 ryzen 7' },
  { id: 'amd_rdna_igpu', label: 'AMD Radeon 680M / 780M (RDNA 2/3 APU)', short: 'Radeon 680M/780M', score: 3.4, isDedicated: false, tier: 'mid_igpu', keywords: '680m 780m rdna radeon 680m 780m' },

  // --- NVIDIA Entry & Laptop Multipurpose (MX Series & GT) ---
  { id: 'nv_gt_730', label: 'NVIDIA GeForce GT 710 / GT 730 / GT 1030', short: 'GeForce GT 730/1030', score: 1.8, isDedicated: true, tier: 'low', keywords: 'gt 710 gt 730 gt 1030 geforce gt' },
  { id: 'nv_mx_150', label: 'NVIDIA GeForce MX130 / MX150 / MX230 / MX250', short: 'GeForce MX150/250', score: 2.4, isDedicated: true, tier: 'low', keywords: 'mx110 mx130 mx150 mx230 mx250 geforce mx' },
  { id: 'nv_mx_350', label: 'NVIDIA GeForce MX330 / MX350 / MX450 / MX550', short: 'GeForce MX350/450', score: 2.8, isDedicated: true, tier: 'mid_igpu', keywords: 'mx330 mx350 mx450 mx550' },

  // --- NVIDIA GTX Gaming Series ---
  { id: 'nv_gtx_750', label: 'NVIDIA GeForce GTX 750 Ti / GTX 960', short: 'GTX 750 Ti / 960', score: 2.7, isDedicated: true, tier: 'low', keywords: 'gtx 750 gtx 750 ti gtx 960 gtx 950' },
  { id: 'nv_gtx_1050', label: 'NVIDIA GeForce GTX 1050 / GTX 1050 Ti', short: 'GTX 1050 / 1050 Ti', score: 3.2, isDedicated: true, tier: 'mid', keywords: 'gtx 1050 gtx 1050 ti 1050ti' },
  { id: 'nv_gtx_1060', label: 'NVIDIA GeForce GTX 1060 (3GB / 6GB) / GTX 1070', short: 'GTX 1060 6GB', score: 3.7, isDedicated: true, tier: 'mid', keywords: 'gtx 1060 gtx 1070 1060 6gb' },
  { id: 'nv_gtx_1650', label: 'NVIDIA GeForce GTX 1650 / GTX 1650 Ti (4GB)', short: 'GTX 1650 4GB', score: 3.6, isDedicated: true, tier: 'mid', keywords: 'gtx 1650 gtx 1650 ti 1650ti gtx1650' },
  { id: 'nv_gtx_1660', label: 'NVIDIA GeForce GTX 1660 / GTX 1660 Super / Ti (6GB)', short: 'GTX 1660 Super', score: 4.0, isDedicated: true, tier: 'mid', keywords: 'gtx 1660 1660 super 1660 ti 1660ti' },

  // --- NVIDIA RTX Gaming Series (Modern & Monster) ---
  { id: 'nv_rtx_2050', label: 'NVIDIA GeForce RTX 2050 (4GB Laptop)', short: 'RTX 2050 4GB', score: 3.7, isDedicated: true, tier: 'mid', keywords: 'rtx 2050 rtx2050' },
  { id: 'nv_rtx_2060', label: 'NVIDIA GeForce RTX 2060 / 2060 Super (6GB/8GB)', short: 'RTX 2060', score: 4.2, isDedicated: true, tier: 'high', keywords: 'rtx 2060 2060 super' },
  { id: 'nv_rtx_3050', label: 'NVIDIA GeForce RTX 3050 / 3050 Ti (4GB/6GB/8GB)', short: 'RTX 3050', score: 4.1, isDedicated: true, tier: 'mid', keywords: 'rtx 3050 rtx 3050 ti 3050ti rtx3050' },
  { id: 'nv_rtx_3060', label: 'NVIDIA GeForce RTX 3060 / 3060 Ti (8GB/12GB)', short: 'RTX 3060 12GB', score: 4.6, isDedicated: true, tier: 'high', keywords: 'rtx 3060 rtx 3060 ti 3060ti rtx3060' },
  { id: 'nv_rtx_4050', label: 'NVIDIA GeForce RTX 4050 (6GB Laptop)', short: 'RTX 4050 6GB', score: 4.5, isDedicated: true, tier: 'high', keywords: 'rtx 4050 rtx4050' },
  { id: 'nv_rtx_4060', label: 'NVIDIA GeForce RTX 4060 / 4060 Ti (8GB/16GB)', short: 'RTX 4060', score: 4.8, isDedicated: true, tier: 'high', keywords: 'rtx 4060 rtx 4060 ti 4060ti rtx4060' },
  { id: 'nv_rtx_4070', label: 'NVIDIA GeForce RTX 4070 / 4080 / 4090', short: 'RTX 4070/4080+', score: 5.0, isDedicated: true, tier: 'high', keywords: 'rtx 4070 rtx 4080 rtx 4090' },

  // --- AMD Radeon Dedicated Gaming Series ---
  { id: 'amd_rx_550', label: 'AMD Radeon RX 550 / RX 560', short: 'Radeon RX 550', score: 2.6, isDedicated: true, tier: 'low', keywords: 'rx 550 rx 560 radeon rx' },
  { id: 'amd_rx_570', label: 'AMD Radeon RX 570 / RX 580 / RX 590 (4GB/8GB)', short: 'Radeon RX 570/580', score: 3.6, isDedicated: true, tier: 'mid', keywords: 'rx 570 rx 580 rx 590 rx580' },
  { id: 'amd_rx_6500', label: 'AMD Radeon RX 6400 / RX 6500 XT', short: 'Radeon RX 6500 XT', score: 3.5, isDedicated: true, tier: 'mid', keywords: 'rx 6400 rx 6500 rx 6500 xt' },
  { id: 'amd_rx_6600', label: 'AMD Radeon RX 6600 / RX 6600 XT (8GB)', short: 'Radeon RX 6600', score: 4.4, isDedicated: true, tier: 'high', keywords: 'rx 6600 rx 6600 xt rx6600' },
  { id: 'amd_rx_7600', label: 'AMD Radeon RX 7600 / RX 7700 XT', short: 'Radeon RX 7600+', score: 4.7, isDedicated: true, tier: 'high', keywords: 'rx 7600 rx 7700 rx 7800' },
];

/**
 * Pembersih pintar teks dxdiag yang di-copy-paste pembeli
 * Contoh: "11th Gen Intel(R) Core(TM) i5-1135G7 @ 2.40GHz (8 CPUs), ~2.4GHz" -> "i5-1135G7"
 */
export function cleanDxdiagString(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/\b(Processor|Card name|Display Memory|Dedicated Memory|Shared Memory|Current Mode):/gi, '')
    .replace(/\(R\)|\(TM\)|\(tm\)/gi, '')
    .replace(/CPU\s*@\s*[\d\.]+GHz/gi, '')
    .replace(/@\s*[\d\.]+GHz/gi, '')
    .replace(/\(\d+\s*CPUs?\)/gi, '')
    .replace(/,\s*~[\d\.]+GHz/gi, '')
    .replace(/Microsoft Basic Display Adapter/gi, '')
    .trim();
}

/**
 * Evaluasi Tier Perangkat Pengguna
 */
export function evaluateHardwareTier({ cpuObj, ramGB = 8, gpuObj }) {
  const cScore = cpuObj?.score || 2.5;
  const gScore = gpuObj?.score || 2.0;
  const isDedicated = Boolean(gpuObj?.isDedicated);
  const ramNum = Number(ramGB) || 8;

  // 1. Laptop Standar / Kantor / Pelajar
  if (!isDedicated && gScore < 2.4 && ramNum <= 8) {
    return {
      tier: 'low',
      tierLabel: 'Laptop Standar / Pelajar',
      badgeColor: 'emerald',
      playablePercent: 45,
      headline: 'Aman untuk Game Ringan, Indie, & Emulator',
      summary: 'Kuat untuk game ringan grafis 720p/Normal seperti The Sims 4 (Base), Stardew Valley, GTA San Andreas, Need for Speed lawas, dan game kasual.',
      recommendedPreset: '720p Low/Medium',
      fpsOverview: '30 - 60 FPS',
      filterQuery: 'low',
    };
  }

  // 2. Laptop iGPU Modern (Iris Xe / Vega 7/8 / Ryzen 5+)
  if (!isDedicated && (gScore >= 2.4 || cScore >= 3.2) && ramNum >= 8) {
    return {
      tier: 'mid_igpu',
      tierLabel: 'Laptop iGPU Modern',
      badgeColor: 'amber',
      playablePercent: 78,
      headline: 'Kuat untuk 78% Game Populer (Termasuk GTA V & Sims 4 All Packs)',
      summary: 'Sangat lancar memainkan GTA V, The Sims 4 All DLCs + Mod, Genshin Impact, Valorant, PES/eFootball, dan game era PS4 pada setelan 720p/1080p Normal.',
      recommendedPreset: '720p/1080p Normal',
      fpsOverview: '40 - 60 FPS',
      filterQuery: 'mid',
    };
  }

  // 3. Laptop/PC Gaming Monster (RTX 3060+, RTX 4060+, RX 6600+)
  if (isDedicated && gScore >= 4.2 && cScore >= 3.8 && ramNum >= 16) {
    return {
      tier: 'high',
      tierLabel: 'PC / Laptop Gaming Sultan',
      badgeColor: 'purple',
      playablePercent: 99,
      headline: 'Monster Gaming — Siap Libas 99% Game Berat Rata Kanan',
      summary: 'Dapat melibas game AAA terberat seperti Cyberpunk 2077, Black Myth Wukong, RDR2, dan Hogwarts Legacy di setelan High/Ultra 60+ FPS.',
      recommendedPreset: '1080p/1440p High-Ultra',
      fpsOverview: '60 - 120 FPS',
      filterQuery: 'high',
    };
  }

  // 4. Laptop Gaming Standar (GTX 1050/1650, RTX 2050/3050, RX 570/580)
  return {
    tier: 'mid',
    tierLabel: 'Laptop Gaming Standar',
    badgeColor: 'amber',
    playablePercent: 90,
    headline: 'Lancar Siap Main untuk Mayoritas Game PC Populer',
    summary: 'Siap melibas 90% game PC modern seperti GTA V, FIFA/FC 24, God of War, Spider-Man, The Sims 4 All Packs, & Tekken 8 di setelan 1080p Medium/High.',
    recommendedPreset: '1080p Medium/High',
    fpsOverview: '50 - 75 FPS',
    filterQuery: 'mid',
  };
}

/**
 * Prioritas Pencocokan Game Populer Resmi MyGameON per Tier Hardware
 * Mengacu pada dokumen riil di Firestore games collection
 */
export const TIER_GAME_CRITERIA = {
  low: [
    // 1. Classic GTA San Andreas (Original 2004 - 3.64 GB - 100% Ringan di Intel HD Graphics)
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t.includes('san andreas') && !t.includes('definitive');
    },
    // 2. Need For Speed Most Wanted (Black Edition - 2.15 GB)
    (g) => (g.title || g.name || '').toLowerCase().includes('most wanted'),
    // 3. Stardew Valley (0.77 GB)
    (g) => (g.title || g.name || '').toLowerCase().includes('stardew valley'),
    // 4. The Sims 1 / 2 Legacy Collection
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t.includes('the sims 2') || t.includes('the sims 1');
    },
    // 5. Game Dev Tycoon / Plants vs Zombie / Undertale
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t.includes('game dev tycoon') || t.includes('plants vs zombie') || t.includes('undertale') || t.includes('overcooked');
    },
  ],
  mid_igpu: [
    // 1. The Sims 4 (Main game / All DLCs)
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t === 'the sims 4' || t.startsWith('the sims 4');
    },
    // 2. Grand Theft Auto V
    (g) => (g.title || g.name || '').toLowerCase().includes('grand theft auto v'),
    // 3. Naruto Ultimate Ninja Storm 4
    (g) => (g.title || g.name || '').toLowerCase().includes('naruto ultimate ninja storm 4'),
    // 4. Tomb Raider GOTY
    (g) => (g.title || g.name || '').toLowerCase().includes('tomb raider goty'),
    // 5. Age of Empire 3 / PC Building Simulator 2
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t.includes('age of empire 3') || t.includes('pc building simulator 2') || t.includes('car dealer simulator');
    },
  ],
  mid: [
    // 1. Grand Theft Auto V
    (g) => (g.title || g.name || '').toLowerCase().includes('grand theft auto v'),
    // 2. God of War (PC Edition)
    (g) => (g.title || g.name || '').toLowerCase() === 'god of war',
    // 3. FIFA 23
    (g) => (g.title || g.name || '').toLowerCase().includes('fifa 23'),
    // 4. GTA San Andreas Definitive Edition (Membutuhkan GPU Dedicated / GTX 1650+)
    (g) => (g.title || g.name || '').toLowerCase().includes('san andreas definitive'),
    // 5. Marvel's Spider-Man Remastered
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t.includes('spider-man remastered') || t.includes('spiderman remastered') || t.includes('resident evil 3');
    },
  ],
  high: [
    // 1. Cyberpunk 2077
    (g) => (g.title || g.name || '').toLowerCase().includes('cyberpunk 2077'),
    // 2. God of War Ragnarok
    (g) => (g.title || g.name || '').toLowerCase().includes('god of war ragnarok'),
    // 3. Marvel's Spider Man 2
    (g) => {
      const t = (g.title || g.name || '').toLowerCase();
      return t.includes('spider man 2') || t.includes('spiderman 2');
    },
    // 4. Elden Ring
    (g) => (g.title || g.name || '').toLowerCase() === 'elden ring',
    // 5. Resident Evil 4 Remake
    (g) => (g.title || g.name || '').toLowerCase().includes('resident evil 4 remake'),
  ],
};

/**
 * Fallback jika Firestore belum selesai fetch
 */
export const TIER_TOP_GAMES = {
  high: [
    { title: 'Cyberpunk 2077: Ultimate Edition', genre: 'Action · Open World', size: '94 GB', performance: '1080p/1440p High 60+ FPS' },
    { title: 'God of War Ragnarok', genre: 'Action · Adventure', size: '103 GB', performance: '1080p High 60 FPS' },
    { title: 'Marvels Spider Man 2', genre: 'Action · Superhero', size: '119 GB', performance: '1080p Ultra 60+ FPS' },
    { title: 'Elden Ring', genre: 'Souls-like · RPG', size: '75 GB', performance: '1080p High 60 FPS' },
    { title: 'Resident Evil 4 Remake', genre: 'Action · Survival Horror', size: '68 GB', performance: '1080p Ultra 60 FPS' },
  ],
  mid: [
    { title: 'Grand Theft Auto V', genre: 'Action · Open World', size: '112 GB', performance: '1080p High 60 FPS' },
    { title: 'God of War', genre: 'Action · Adventure', size: '42 GB', performance: '1080p High 60 FPS' },
    { title: 'FIFA 23', genre: 'Olahraga · Sepakbola', size: '52 GB', performance: '1080p High 60 FPS' },
    { title: 'Grand Theft Auto San Andreas Definitive Edition', genre: 'Action · Open World', size: '19 GB', performance: '1080p Medium/High 60 FPS' },
    { title: 'Marvels Spider-Man Remastered', genre: 'Action · Superhero', size: '52 GB', performance: '1080p Medium 50-60 FPS' },
  ],
  mid_igpu: [
    { title: 'The Sims 4', genre: 'Simulasi · Kehidupan', size: '76 GB', performance: '1080p Normal 50-60 FPS' },
    { title: 'Grand Theft Auto V', genre: 'Action · Open World', size: '112 GB', performance: '720p/1080p Normal 45-55 FPS' },
    { title: 'Naruto Ultimate Ninja Storm 4', genre: 'Action · Anime', size: '40 GB', performance: '1080p Lancar 60 FPS' },
    { title: 'Tomb Raider GOTY', genre: 'Action · Adventure', size: '5.5 GB', performance: '1080p Medium 60 FPS' },
    { title: 'Age of Empire 3', genre: 'Strategi · Sejarah', size: '42 GB', performance: '720p Normal 50 FPS' },
  ],
  low: [
    { title: 'Grand Theft Auto San Andreas', genre: 'Action · Klasik', size: '3.6 GB', performance: '1080p Maksimal 60 FPS' },
    { title: 'Need For Speed Most Wanted Black Edition', genre: 'Balapan · Legendaris', size: '2.2 GB', performance: 'Lancar Maksimal 60 FPS' },
    { title: 'Stardew Valley', genre: 'Cozy · Pertanian · Indie', size: '0.8 GB', performance: 'Sangat Enteng 60 FPS' },
    { title: 'The Sims 2 Legacy Collection', genre: 'Simulasi · Santai', size: '6.9 GB', performance: '720p/1080p Lancar 60 FPS' },
    { title: 'Game Dev Tycoon', genre: 'Simulasi · Bisnis', size: '0.4 GB', performance: 'Lancar Stabil 60 FPS' },
  ],
};

/**
 * Mengambil Top 5 Game dari koleksi asli Firestore
 * Memastikan game 100% tersedia di katalog MyGameON
 */
export function getTopTierGames(games = [], profile = null, tier = 'mid') {
  if (!Array.isArray(games) || games.length === 0) {
    return TIER_TOP_GAMES[tier] || TIER_TOP_GAMES.mid;
  }

  const criteria = TIER_GAME_CRITERIA[tier] || TIER_GAME_CRITERIA.mid;
  const selected = [];
  const selectedIds = new Set();

  // 1. Ambil game yang cocok dengan kurasi judul resmi
  for (const matchFn of criteria) {
    const match = games.find((g) => !selectedIds.has(g.id) && matchFn(g));
    if (match) {
      selected.push(match);
      selectedIds.add(match.id);
    }
  }

  // 2. Jika kurang dari 5, isi dengan game Firestore lain yang sesuai tier
  if (selected.length < 5) {
    for (const g of games) {
      if (selected.length >= 5) break;
      if (selectedIds.has(g.id)) continue;
      const rawSize = g.fileSizeBytes || g.size || 0;
      const sizeGB = rawSize / (1024 * 1024 * 1024);
      const title = (g.title || g.name || '').toLowerCase();
      const isDefinitive = title.includes('definitive') || title.includes('remake') || title.includes('remaster');

      if (tier === 'low' && sizeGB > 0 && sizeGB <= 8 && !isDefinitive) {
        selected.push(g);
        selectedIds.add(g.id);
      } else if (tier === 'mid_igpu' && sizeGB > 0 && sizeGB <= 45 && !isDefinitive) {
        selected.push(g);
        selectedIds.add(g.id);
      } else if (tier === 'mid' && sizeGB >= 15 && sizeGB <= 80) {
        selected.push(g);
        selectedIds.add(g.id);
      } else if (tier === 'high' && sizeGB >= 50) {
        selected.push(g);
        selectedIds.add(g.id);
      }
    }
  }

  // 3. Format hasil dengan data Firestore lengkap
  return selected.map((g, idx) => {
    const rawSize = g.fileSizeBytes || g.size || 0;
    const sizeGB = rawSize > 0 ? (rawSize / (1024 * 1024 * 1024)).toFixed(1) + ' GB' : 'Cloud';
    const genreStr = Array.isArray(g.genres) && g.genres.length > 0 
      ? g.genres.slice(0, 2).map((x) => x.charAt(0).toUpperCase() + x.slice(1)).join(' · ') 
      : 'PC Game';

    let performance = '✓ Lancar Dimainkan';
    if (tier === 'low') performance = '✓ Lancar 60 FPS';
    else if (tier === 'mid_igpu') performance = '✓ 1080p Normal 60 FPS';
    else if (tier === 'mid') performance = '✓ 1080p High 60 FPS';
    else if (tier === 'high') performance = '✓ 1080p Ultra 60+ FPS';

    return {
      ...g,
      id: g.id,
      title: g.title || g.name,
      genre: genreStr,
      size: sizeGB,
      performance,
      rawGame: g,
    };
  });
}


