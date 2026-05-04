import React, { useState, useEffect } from 'react';
import { api } from './api';
import './MerchantTerminal.css';

export default function MerchantTerminal({ merchantId, onPaymentMade }) {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [merchant, setMerchant] = useState(null);
  const [preferences, setPreferences] = useState({
    settlement_mode: 'split',
    split_pct: 30,
    hold_btc: false,
  });

  // Load merchant data and rate on mount
  useEffect(() => {
    const init = async () => {
      try {
        const merchantData = await api.getMerchant(merchantId);
        setMerchant(merchantData.merchant);
        setPreferences({
          settlement_mode: merchantData.merchant.settlement_mode,
          split_pct: merchantData.merchant.split_pct,
          hold_btc: merchantData.merchant.hold_btc,
        });

        const rateData = await api.getRate();
        setRate(rateData.rate);
      } catch (err) {
        setError(err.message);
      }
    };

    init();
  }, [merchantId]);

  const handleNumpad = (value) => {
    if (value === 'backspace') {
      setAmount(amount.slice(0, -1));
    } else if (value === '00') {
      setAmount(amount + '00');
    } else {
      setAmount(amount + value);
    }
  };

  const handleGenerateQR = async () => {
    const parsedAmount = parseInt(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setQrData(null);

    try {
      const result = await api.generateQR(parseInt(amount), merchantId);
      setQrData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);

    try {
      await api.updatePreferences(merchantId, {
        [key]: value,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!qrData) return;
    if (!rate) { setError('Exchange rate not loaded yet, please wait'); return; }
    if (!merchant) { setError('Merchant data not loaded'); return; }

    try {
      setLoading(true);
      // Determine payment method based on settlement preference
      const method = merchant?.settlement_mode === 'fiat' ? 'upi' : 'lightning';

      await api.createTransaction({
        merchant_id: merchantId,
        merchant_name: merchant.name,
        amount_inr: parseInt(amount),
        amount_usdc: qrData.amount_usdc,
        method,
        rate,
      });

      // Reset and notify parent
      setAmount('');
      setQrData(null);
      onPaymentMade();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!merchant) {
    return <div className="terminal-loading">Loading merchant data...</div>;
  }

  return (
    <div className="terminal-container">
      <div className="terminal-left">
        {/* Amount Input Section */}
        <div className="input-section">
          <h3>Enter Amount (INR)</h3>
          <div className="amount-display">
            <span className="currency">₹</span>
            <input
              type="text"
              value={amount}
              readOnly
              className="amount-input mono"
              placeholder="0"
            />
          </div>

          {/* Numpad */}
          <div className="numpad">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                className="numpad-btn"
                onClick={() => handleNumpad(num)}
              >
                {num}
              </button>
            ))}
            <button
              className="numpad-btn"
              onClick={() => handleNumpad('00')}
            >
              00
            </button>
            <button
              className="numpad-btn"
              onClick={() => handleNumpad('0')}
            >
              0
            </button>
            <button
              className="numpad-btn delete"
              onClick={() => handleNumpad('backspace')}
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Rate & Conversion Info */}
        {amount && rate && (
          <div className="rate-info">
            <div className="rate-badge">
              <span className="label">Rate</span>
              <span className="mono value">₹{rate.toFixed(2)}/USDC</span>
            </div>
            <div className="rate-badge">
              <span className="label">USDC Amount</span>
              <span className="mono value">
                {(parseInt(amount) / rate).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Settlement Preferences */}
        <div className="preferences-section">
          <h3>Settlement Preferences</h3>

          <div className="pref-group">
            <label>Settlement Mode</label>
            <select
              value={preferences.settlement_mode}
              onChange={(e) =>
                handlePreferenceChange('settlement_mode', e.target.value)
              }
              className="select-input"
            >
              <option value="fiat">Fiat Only</option>
              <option value="crypto">Crypto Only</option>
              <option value="split">Split (Fiat + Crypto)</option>
            </select>
          </div>

          {preferences.settlement_mode === 'split' && (
            <div className="pref-group">
              <label>
                Crypto Split: {preferences.split_pct}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={preferences.split_pct}
                onChange={(e) =>
                  handlePreferenceChange('split_pct', parseInt(e.target.value))
                }
                className="slider"
              />
              <div className="slider-labels">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          )}

          <div className="pref-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={preferences.hold_btc}
                onChange={(e) =>
                  handlePreferenceChange('hold_btc', e.target.checked)
                }
              />
              <span>Hold BTC (Auto-convert to INR)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Right Column - QR Display */}
      <div className="terminal-right">
        {error && <div className="error-banner">{error}</div>}

        {qrData ? (
          <div className="qr-display">
            <h3>Payment QR Code</h3>
            <div className="qr-box">
              <img src={qrData.qr_data_url} alt="Payment QR" />
            </div>

            <div className="payment-info">
              <div className="info-row">
                <span>Amount (INR)</span>
                <span className="mono">{amount}</span>
              </div>
              <div className="info-row">
                <span>USDC Amount</span>
                <span className="mono">{qrData.amount_usdc}</span>
              </div>
              <div className="info-row">
                <span>Exchange Rate</span>
                <span className="mono">₹{rate.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <span>Fee (0.5%)</span>
                <span className="mono warn">
                  {(qrData.amount_usdc * 0.005).toFixed(2)} USDC
                </span>
              </div>
            </div>

            <div className="protocol-badges">
              <span className="badge upi">UPI</span>
              <span className="badge lightning">⚡ Lightning</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handlePaymentConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Payment Received ✓'}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setAmount('');
                setQrData(null);
              }}
            >
              Cancel & Clear
            </button>
          </div>
        ) : (
          <div className="qr-placeholder">
            <h3>Generate Payment QR</h3>
            <div className="placeholder-box">
              <span>QR code will appear here</span>
            </div>

            <button
              className="btn btn-primary btn-large"
              onClick={handleGenerateQR}
              disabled={!amount || loading}
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>

            {!amount && (
              <p className="text-muted text-center mt-md">
                Enter an amount to generate payment QR
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
