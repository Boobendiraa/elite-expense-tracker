export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value || 0)

export const formatPercent = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value || 0)

