export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatPercent = (value, decimals = 2) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 2) => {
  return parseFloat(value).toFixed(decimals);
};

export const getPnLColor = (pnl) => {
  if (pnl > 0) return '#4caf50'; // Green
  if (pnl < 0) return '#f44336'; // Red
  return '#9e9e9e'; // Gray
};

export const getPnLTextColor = (pnl) => {
  if (pnl > 0) return 'success';
  if (pnl < 0) return 'error';
  return 'text.secondary';
};
