/**
 * Format USD and optional Cambodian Riel (KHR)
 * Exchange rate: 1 USD = 4,100 KHR
 */
export function formatUSD(amount) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatKHR(amountUSD) {
  const num = typeof amountUSD === 'number' ? amountUSD : parseFloat(amountUSD) || 0;
  const khr = Math.round(num * 4100);
  return `${new Intl.NumberFormat('en-US').format(khr)} ៛`;
}

export function formatBothPrices(amountUSD) {
  return {
    usd: formatUSD(amountUSD),
    khr: formatKHR(amountUSD),
  };
}
