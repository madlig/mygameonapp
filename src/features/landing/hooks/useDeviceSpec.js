// src/features/landing/hooks/useDeviceSpec.js
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mygameon_device_spec';

export const DEVICE_SPEC_LEVELS = {
  ALL: 'all',
  LOW: 'low',
  MID: 'mid',
  HIGH: 'high',
};

export const DEVICE_SPEC_LABELS = {
  [DEVICE_SPEC_LEVELS.ALL]: {
    id: 'all',
    label: 'Semua Device',
    shortLabel: 'Semua',
    hint: 'Tampilkan seluruh game',
    color: 'slate',
  },
  [DEVICE_SPEC_LEVELS.LOW]: {
    id: 'low',
    label: 'Device Low Spek',
    shortLabel: 'Low Spek',
    hint: 'RAM 4-8 GB / Intel UHD / Vega / Onboard',
    color: 'emerald',
    badge: 'RAM 4-8GB',
  },
  [DEVICE_SPEC_LEVELS.MID]: {
    id: 'mid',
    label: 'Device Menengah',
    shortLabel: 'Menengah',
    hint: 'RAM 8-16 GB / GTX 1050/1650 / RX 580',
    color: 'amber',
    badge: 'GTX/RX Entry',
  },
  [DEVICE_SPEC_LEVELS.HIGH]: {
    id: 'high',
    label: 'Device High-End',
    shortLabel: 'High-End',
    hint: 'RAM 16-32 GB+ / RTX Series / Dedicated GPU',
    color: 'purple',
    badge: 'RTX / AAA',
  },
};

/**
 * Menghitung kecocokan game terhadap spek device pengguna
 * @param {Object} game - Data objek game
 * @param {string} userSpec - 'all' | 'low' | 'mid' | 'high'
 * @returns {Object} Hasil evaluasi kompatibilitas
 */
export const evaluateGameCompatibility = (game, userSpec = 'all') => {
  if (!game) {
    return { status: 'unknown', badge: 'Spek Umum', color: 'slate', desc: '' };
  }

  const rawSize = game.fileSizeBytes || game.size || 0;
  const sizeGB = typeof rawSize === 'number' && rawSize > 0 
    ? rawSize / (1024 * 1024 * 1024) 
    : (typeof rawSize === 'string' && rawSize.toLowerCase().includes('gb') ? parseFloat(rawSize) : 0);
  
  const title = (game.title || game.name || '').toLowerCase();
  
  // Deteksi kategori game
  const isHeavy = sizeGB >= 50 || 
    title.includes('cyberpunk') || 
    title.includes('red dead') || 
    title.includes('tekken 8') || 
    title.includes('black myth') || 
    title.includes('forza horizon') || 
    title.includes('god of war') ||
    title.includes('spiderman') ||
    title.includes('spider-man');

  const isMid = !isHeavy && (
    (sizeGB >= 15 && sizeGB < 50) || 
    title.includes('sims 4') || 
    title.includes('gta v') || 
    title.includes('witcher') ||
    title.includes('fifa') ||
    title.includes('fc 2')
  );

  const isLow = !isHeavy && !isMid;

  // Evaluasi berdasarkan profil user
  if (userSpec === DEVICE_SPEC_LEVELS.LOW) {
    if (isLow) {
      return {
        status: 'optimal',
        isPlayable: true,
        badge: 'Lancar di Device Kamu',
        color: 'emerald',
        desc: 'Aman untuk RAM 4-8GB & Grafis Terintegrasi',
      };
    }
    if (isMid) {
      return {
        status: 'warning',
        isPlayable: true,
        badge: 'Setting Low (RAM 8GB)',
        color: 'amber',
        desc: 'Disarankan grafis resolusi 720p/low setting',
      };
    }
    return {
      status: 'unsupported',
      isPlayable: false,
      badge: 'Spek Belum Memadai',
      color: 'rose',
      desc: 'Butuh VGA dedicated & RAM minimal 12-16GB',
    };
  }

  if (userSpec === DEVICE_SPEC_LEVELS.MID) {
    if (isLow) {
      return {
        status: 'optimal',
        isPlayable: true,
        badge: 'Sangat Lancar (FPS Tinggi)',
        color: 'emerald',
        desc: 'Bisa diset grafis maksimal 1080p',
      };
    }
    if (isMid) {
      return {
        status: 'optimal',
        isPlayable: true,
        badge: 'Lancar di Device Kamu',
        color: 'emerald',
        desc: 'Optimal untuk GTX 1050/1650 & RAM 8-16GB',
      };
    }
    return {
      status: 'warning',
      isPlayable: true,
      badge: 'Setting Low - Medium',
      color: 'amber',
      desc: 'Perlu penyesuaian resolusi & setting grafis',
    };
  }

  if (userSpec === DEVICE_SPEC_LEVELS.HIGH) {
    return {
      status: 'optimal',
      isPlayable: true,
      badge: 'Lancar Maksimal (High/Ultra)',
      color: 'emerald',
      desc: 'Siap main grafis rata kanan / 60+ FPS',
    };
  }

  // Fallback 'all': Informasi spek umum game
  if (isLow) {
    return {
      status: 'info',
      isPlayable: true,
      badge: 'Device Low Spek OK',
      color: 'emerald',
      desc: 'Game ringan (< 15 GB), RAM 4-8GB cukup',
    };
  }
  if (isMid) {
    return {
      status: 'info',
      isPlayable: true,
      badge: 'Spek Menengah',
      color: 'amber',
      desc: 'Game standar (15-50 GB), butuh GTX/RX',
    };
  }
  return {
    status: 'info',
    isPlayable: true,
    badge: 'Grafis Berat AAA',
    color: 'purple',
    desc: 'Game AAA (> 50 GB), butuh GPU dedicated',
  };
};

export const useDeviceSpec = () => {
  const [deviceSpec, setDeviceSpecState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEVICE_SPEC_LEVELS.ALL;
    } catch {
      return DEVICE_SPEC_LEVELS.ALL;
    }
  });

  const [onlyCompatible, setOnlyCompatibleState] = useState(() => {
    try {
      return localStorage.getItem('mygameon_only_compatible') === 'true';
    } catch {
      return false;
    }
  });

  const setDeviceSpec = useCallback((spec) => {
    setDeviceSpecState(spec);
    try {
      localStorage.setItem(STORAGE_KEY, spec);
    } catch {
      // ignore
    }
  }, []);

  const setOnlyCompatible = useCallback((val) => {
    setOnlyCompatibleState(val);
    try {
      localStorage.setItem('mygameon_only_compatible', String(val));
    } catch {
      // ignore
    }
  }, []);

  return {
    deviceSpec,
    setDeviceSpec,
    onlyCompatible,
    setOnlyCompatible,
    evaluate: (game) => evaluateGameCompatibility(game, deviceSpec),
  };
};
