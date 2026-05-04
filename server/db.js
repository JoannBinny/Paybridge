import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
import { v4 as uuidv4 } from 'uuid';

const adapter = new FileSync('paybridge.json');
const db = low(adapter);

export function initDb() {
  db.defaults({
    merchants: [],
    transactions: [],
    kyc_records: [],
  }).write();

  if (!db.get('merchants').value().length) {
    const merchantId = 'demo-merchant-1';
    db.get('merchants').push({
      id: merchantId,
      name: 'TechCafe Mumbai',
      upi_id: 'techcafe@upi',
      bank_account: 'HDFC****5678',
      settlement_mode: 'split',
      split_pct: 30,
      hold_btc: false,
      created_at: new Date().toISOString(),
    }).write();
  }

  if (!db.get('transactions').value().length) {
    const merchantId = 'demo-merchant-1';
    const baseTime = Date.now();
    const transactions = [
      { id: uuidv4(), merchant_id: merchantId, merchant_name: 'TechCafe Mumbai', amount_inr: 340, amount_usdc: 4.07, method: 'upi', status: 'completed', fee_usdc: 0.02, rate_used: 83.5, tds_deducted: 0.04, wallet_address: null, created_at: new Date(baseTime - 5 * 60000).toISOString() },
      { id: uuidv4(), merchant_id: merchantId, merchant_name: 'TechCafe Mumbai', amount_inr: 1000, amount_usdc: 11.98, method: 'lightning', status: 'completed', fee_usdc: 0.06, rate_used: 83.5, tds_deducted: 0.12, wallet_address: '0xDemoWallet_abc123', created_at: new Date(baseTime - 15 * 60000).toISOString() },
      { id: uuidv4(), merchant_id: merchantId, merchant_name: 'TechCafe Mumbai', amount_inr: 250, amount_usdc: 2.99, method: 'upi', status: 'completed', fee_usdc: 0.01, rate_used: 83.5, tds_deducted: 0.03, wallet_address: null, created_at: new Date(baseTime - 45 * 60000).toISOString() },
      { id: uuidv4(), merchant_id: merchantId, merchant_name: 'TechCafe Mumbai', amount_inr: 500, amount_usdc: 5.99, method: 'lightning', status: 'completed', fee_usdc: 0.03, rate_used: 83.5, tds_deducted: 0.06, wallet_address: '0xDemoWallet_def456', created_at: new Date(baseTime - 2 * 3600000).toISOString() },
      { id: uuidv4(), merchant_id: merchantId, merchant_name: 'TechCafe Mumbai', amount_inr: 750, amount_usdc: 8.98, method: 'upi', status: 'completed', fee_usdc: 0.04, rate_used: 83.5, tds_deducted: 0.09, wallet_address: null, created_at: new Date(baseTime - 4 * 3600000).toISOString() },
      { id: uuidv4(), merchant_id: merchantId, merchant_name: 'TechCafe Mumbai', amount_inr: 1500, amount_usdc: 17.96, method: 'lightning', status: 'completed', fee_usdc: 0.09, rate_used: 83.5, tds_deducted: 0.18, wallet_address: '0xDemoWallet_ghi789', created_at: new Date(baseTime - 8 * 3600000).toISOString() },
    ];
    transactions.forEach(t => db.get('transactions').push(t).write());
  }

  return db;
}

export default db;
