// frontend/src/utils/number.js
export const fmt2 = (n) =>
  n === null || n === undefined || n === '' || isNaN(Number(n))
    ? '—'
    : new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(Number(n));

export const normalizeNum = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).trim().replace(',', '.');
};

