import fetch from 'node-fetch';

let cachedRate = null;
let cacheTime = null;
const CACHE_TTL = 30000; // 30 seconds

export async function getRate() {
  const now = Date.now();

  // Return cached rate if still valid
  if (cachedRate !== null && cacheTime !== null && now - cacheTime < CACHE_TTL) {
    return cachedRate;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=inr'
    );
    const data = await response.json();
    const rate = data['usd-coin'].inr;

    cachedRate = rate;
    cacheTime = now;
    return rate;
  } catch (error) {
    console.error('Error fetching rate from CoinGecko:', error.message);
    // Fallback to 83.5 if API fails
    return 83.5;
  }
}

export function convertINRtoUSDC(inrAmount, rate) {
  const usdc = inrAmount / rate;
  return parseFloat(usdc.toFixed(2));
}

export function calculateFees(usdcAmount) {
  const fee = usdcAmount * 0.005; // 0.5% gateway fee
  const tds = usdcAmount * 0.01; // 1% TDS
  return {
    fee: parseFloat(fee.toFixed(2)),
    tds: parseFloat(tds.toFixed(2)),
    total: parseFloat((usdcAmount + fee).toFixed(2)),
  };
}
