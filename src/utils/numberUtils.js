// src/utils/numberUtils.js
// Centralized number / currency formatting helpers used across the app.

export const formatCurrency = (value, { maximumFractionDigits = 0 } = {}) => {
  const num = Number(value);
  const safe = Number.isFinite(num) ? num : 0;
  return safe.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};

export const formatNumber = (value, { maximumFractionDigits = 2 } = {}) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};