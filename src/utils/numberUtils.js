// src/utils/numberUtils.js
// Small helper to consistently format currencies / numbers across the app.

export const formatCurrency = (value, { maximumFractionDigits = 0 } = {}) => {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};

export const formatNumber = (value, { maximumFractionDigits = 2 } = {}) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '0';
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
};