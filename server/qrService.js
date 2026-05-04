import QRCode from 'qrcode';

export async function generateDualQR(merchantData) {
  const { upi_id, name, amount_inr, amount_usdc, rate } = merchantData;

  // Generate UPI string
  const upiString = `upi://pay?pa=${encodeURIComponent(upi_id)}&pn=${encodeURIComponent(name)}&am=${amount_inr}&cu=INR`;

  // Generate Lightning string (simplified format)
  const satoshis = Math.round(amount_usdc * 100000); // 1 USDC ≈ 100,000 sats simplified
  const lnString = `lightning:lnbc${satoshis}n1paybridge`;

  // Create dual payload
  const dualPayload = `PAYBRIDGE_V1|UPI:${upiString}|LN:${lnString}|AMT:${amount_inr}`;

  try {
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(dualPayload, {
      width: 180,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      success: true,
      qr_data_url: qrDataUrl,
      payload: dualPayload,
      upi: upiString,
      lightning: lnString,
    };
  } catch (error) {
    console.error('Error generating QR code:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

export function generateWalletAddress() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let address = '0xDemoWallet_';
  for (let i = 0; i < 6; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return address;
}
