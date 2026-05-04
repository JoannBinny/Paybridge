const API_BASE = process.env.REACT_APP_API_BASE || '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `API error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Rate & Conversion
  getRate() {
    return fetchApi('/rate');
  },

  convert(amountInr) {
    return fetchApi('/convert', {
      method: 'POST',
      body: JSON.stringify({ amount_inr: amountInr }),
    });
  },

  // QR Generation
  generateQR(amountInr, merchantId) {
    return fetchApi('/qr/generate', {
      method: 'POST',
      body: JSON.stringify({ amount_inr: amountInr, merchant_id: merchantId }),
    });
  },

  // Transactions
  getTransactions(merchantId) {
    return fetchApi(`/transactions?merchant_id=${merchantId}`);
  },

  createTransaction(data) {
    return fetchApi('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Merchant
  getMerchant(merchantId) {
    return fetchApi(`/merchant?merchant_id=${merchantId}`);
  },

  updatePreferences(merchantId, preferences) {
    return fetchApi('/merchant/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ merchant_id: merchantId, ...preferences }),
    });
  },

  // KYC
  submitKYC(walletAddress, fullName, panNumber) {
    return fetchApi('/kyc', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        full_name: fullName,
        pan_number: panNumber,
      }),
    });
  },

  checkKYC(walletAddress) {
    return fetchApi(`/kyc/check?wallet_address=${walletAddress}`);
  },

  // Stats
  getStats(merchantId) {
    return fetchApi(`/stats?merchant_id=${merchantId}`);
  },

  // Health
  health() {
    return fetchApi('/health');
  },
};
