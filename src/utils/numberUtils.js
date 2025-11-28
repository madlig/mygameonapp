/**
 * Format a number as Indonesian Rupiah currency.
 * @param {number} value - The number to format.
 * @param {object} options - Optional formatting options.
 * @param {number} options.minimumFractionDigits - Minimum fraction digits (default: 0).
 * @param {number} options.maximumFractionDigits - Maximum fraction digits (default: 0).
 * @returns {string} The formatted currency string without the "Rp" prefix.
 */
export function formatCurrency(value, options = {}) {
  const num = Number(value) || 0;
  const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  return num.toLocaleString('id-ID', {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}
