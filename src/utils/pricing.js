// src/utils/pricing.js
/**
 * Centralized Game Pricing Utility
 * 
 * Aturan Harga Saat Ini:
 * - The Sims 4 (dan seluruh pack/ekspansinya): Rp 50.000
 * - Semua game lainnya: Rp 10.000
 */

/**
 * Cek apakah sebuah entitas game merupakan The Sims 4
 * @param {Object|string} game 
 * @returns {boolean}
 */
export const isTheSims4 = (game) => {
  if (!game) return false;
  const title = typeof game === 'string'
    ? game.toLowerCase()
    : (game.title || game.name || game.id || '').toLowerCase();
  
  return title.includes('sims 4') || title.includes('the sims 4') || title === 'sims4';
};

/**
 * Mengambil harga numerik game (IDR)
 * @param {Object|string} game 
 * @returns {number}
 */
export const getGamePrice = (game) => {
  if (isTheSims4(game)) {
    return 50000;
  }
  return 10000;
};

/**
 * Format angka ke format mata uang Rupiah
 * @param {number} num 
 * @returns {string} Contoh: "Rp 10.000"
 */
export const formatRp = (num) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num || 0);
};

/**
 * Mengambil string harga terformat dari game
 * @param {Object|string} game 
 * @returns {string} Contoh: "Rp 10.000" atau "Rp 50.000"
 */
export const getGamePriceFormatted = (game) => {
  return formatRp(getGamePrice(game));
};
