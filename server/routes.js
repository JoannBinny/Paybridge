import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getRate, convertINRtoUSDC, calculateFees } from './priceService.js';
import { generateDualQR, generateWalletAddress } from './qrService.js';
import db from './db.js';

const router = express.Router();

// GET /api/health
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/rate
router.get('/rate', async (req, res) => {
  try {
    const rate = await getRate();
    res.json({ rate, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/convert
router.post('/convert', async (req, res) => {
  try {
    const { amount_inr } = req.body;
    if (!amount_inr) {
      return res.status(400).json({ error: 'amount_inr is required' });
    }

    const rate = await getRate();
    const amount_usdc = convertINRtoUSDC(amount_inr, rate);
    const fees = calculateFees(amount_usdc);

    res.json({
      amount_inr,
      amount_usdc,
      rate,
      fee_usdc: fees.fee,
      tds_usdc: fees.tds,
      total_to_pay: fees.total,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/qr/generate
router.post('/qr/generate', async (req, res) => {
  try {
    const { amount_inr, merchant_id } = req.body;
    if (!amount_inr || !merchant_id) {
      return res.status(400).json({ error: 'amount_inr and merchant_id are required' });
    }

    const merchant = db.get("merchants").value().find(m => m.id === merchant_id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    const rate = await getRate();
    const amount_usdc = convertINRtoUSDC(amount_inr, rate);

    const qrResult = await generateDualQR({
      upi_id: merchant.upi_id,
      name: merchant.name,
      amount_inr,
      amount_usdc,
      rate,
    });

    if (!qrResult.success) {
      return res.status(500).json({ error: qrResult.error });
    }

    res.json({ ...qrResult, amount_usdc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions
router.get('/transactions', (req, res) => {
  try {
    const { merchant_id } = req.query;
    if (!merchant_id) {
      return res.status(400).json({ error: 'merchant_id is required' });
    }

    const transactions = db.get("transactions").value()
      .filter(t => t.merchant_id === merchant_id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions
router.post('/transactions', (req, res) => {
  try {
    const { merchant_id, merchant_name, amount_inr, amount_usdc, method, rate } = req.body;

    if (!merchant_id || !merchant_name || !amount_inr || !amount_usdc || !method || !rate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const usdc = amount_usdc;
    const fees = calculateFees(usdc);

    let wallet_address = null;
    if (method === 'lightning') {
      wallet_address = generateWalletAddress();
    }

    const transaction = {
      id: uuidv4(),
      merchant_id,
      merchant_name,
      amount_inr,
      amount_usdc: usdc,
      method,
      status: 'completed',
      fee_usdc: fees.fee,
      rate_used: rate,
      tds_deducted: fees.tds,
      wallet_address,
      created_at: new Date().toISOString(),
    };

    db.get('transactions').push(transaction).write();

    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/merchant
router.get('/merchant', (req, res) => {
  try {
    const { merchant_id } = req.query;
    if (!merchant_id) {
      return res.status(400).json({ error: 'merchant_id is required' });
    }

    const merchant = db.get("merchants").value().find(m => m.id === merchant_id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    res.json({ merchant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/merchant/preferences
router.patch('/merchant/preferences', (req, res) => {
  try {
    const { merchant_id, settlement_mode, split_pct, hold_btc } = req.body;

    if (!merchant_id) {
      return res.status(400).json({ error: 'merchant_id is required' });
    }

    const merchant = db.get("merchants").value().find(m => m.id === merchant_id);
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }

    if (settlement_mode !== undefined) merchant.settlement_mode = settlement_mode;
    if (split_pct !== undefined) merchant.split_pct = split_pct;
    if (hold_btc !== undefined) merchant.hold_btc = hold_btc;

    db.write();

    res.json({ success: true, merchant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/kyc
router.post('/kyc', (req, res) => {
  try {
    const { wallet_address, full_name, pan_number } = req.body;

    if (!wallet_address || !full_name || !pan_number) {
      return res.status(400).json({ error: 'Missing required KYC fields' });
    }

    // Check if already verified
    const existing = db.get("kyc_records").value().find(k => k.wallet_address === wallet_address);
    if (existing && existing.verified) {
      return res.status(400).json({ error: 'KYC already verified for this wallet' });
    }

    const kyc = {
      wallet_address,
      full_name,
      pan_number,
      verified: true,
      created_at: new Date().toISOString(),
    };

    if (existing) {
      Object.assign(existing, kyc);
      db.write();
    } else {
      db.get('kyc_records').push(kyc).write();
    }

    res.json({ success: true, kyc });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/kyc/check
router.get('/kyc/check', (req, res) => {
  try {
    const { wallet_address } = req.query;

    if (!wallet_address) {
      return res.status(400).json({ error: 'wallet_address is required' });
    }

    const kyc = db.get("kyc_records").value().find(k => k.wallet_address === wallet_address);

    if (kyc && kyc.verified) {
      res.json({ verified: true, kyc });
    } else {
      res.json({ verified: false });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/stats
router.get('/stats', (req, res) => {
  try {
    const { merchant_id } = req.query;

    if (!merchant_id) {
      return res.status(400).json({ error: 'merchant_id is required' });
    }

    const transactions = db.get("transactions").value().filter(t => t.merchant_id === merchant_id);

    const stats = {
      total_revenue_inr: transactions.reduce((sum, t) => sum + t.amount_inr, 0),
      transaction_count: transactions.length,
      crypto_volume_usdc: transactions
        .filter(t => t.method === 'lightning')
        .reduce((sum, t) => sum + t.amount_usdc, 0),
      total_fees_usdc: transactions.reduce((sum, t) => sum + t.fee_usdc, 0),
      upi_count: transactions.filter(t => t.method === 'upi').length,
      crypto_count: transactions.filter(t => t.method === 'lightning').length,
    };

    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
