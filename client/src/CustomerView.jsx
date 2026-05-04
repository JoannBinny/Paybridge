import React, { useState, useEffect } from 'react';
import { api } from './api';
import './CustomerView.css';

export default function CustomerView({ merchantId, merchantName, onPaymentMade }) {
  const [screen, setScreen] = useState('home'); // home, upi, crypto, success
  const [amount, setAmount] = useState(0);
  const [rate, setRate] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [kycStatus, setKycStatus] = useState(null);
  const [kycForm, setKycForm] = useState({ fullName: '', panNumber: '' });
  const [showKycForm, setShowKycForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastTxId, setLastTxId] = useState('');

  // Initialize
  useEffect(() => {
    const init = async () => {
      try {
        const rateData = await api.getRate();
        setRate(rateData.rate);
        // Set demo amount
        setAmount(340);
      } catch (err) {
        setError(err.message);
      }
    };
    init();
  }, []);

  const handleUPIPay = async () => {
    setLoading(true);
    setError('');

    try {
      const conversion = await api.convert(amount);
      await api.createTransaction({
        merchant_id: merchantId,
        merchant_name: merchantName,
        amount_inr: amount,
        amount_usdc: conversion.amount_usdc,
        method: 'upi',
        rate,
      });

      setLastTxId(Math.random().toString(36).slice(2, 10).toUpperCase());
      setScreen('success');
      onPaymentMade();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCryptoPay = async () => {
    if (!showKycForm && !kycStatus) {
      // Check KYC status first
      try {
        const status = await api.checkKYC(walletAddress);
        setKycStatus(status.verified);
        if (!status.verified) {
          setShowKycForm(true);
        }
      } catch (err) {
        setError(err.message);
        return;
      }
    }

    if (showKycForm) {
      // Submit KYC
      try {
        setLoading(true);
        await api.submitKYC(walletAddress, kycForm.fullName, kycForm.panNumber);
        setKycStatus(true);
        setShowKycForm(false);

        // Process payment
        const conversion = await api.convert(amount);
        await api.createTransaction({
          merchant_id: merchantId,
          merchant_name: merchantName,
          amount_inr: amount,
          amount_usdc: conversion.amount_usdc,
          method: 'lightning',
          rate,
        });

        setLastTxId(Math.random().toString(36).slice(2, 10).toUpperCase());
        setScreen('success');
        onPaymentMade();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else if (kycStatus) {
      // KYC verified, process payment
      try {
        setLoading(true);
        const conversion = await api.convert(amount);
        await api.createTransaction({
          merchant_id: merchantId,
          merchant_name: merchantName,
          amount_inr: amount,
          amount_usdc: conversion.amount_usdc,
          method: 'lightning',
          rate,
        });

        setLastTxId(Math.random().toString(36).slice(2, 10).toUpperCase());
        setScreen('success');
        onPaymentMade();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetPayment = () => {
    setScreen('home');
    setWalletAddress('');
    setKycForm({ fullName: '', panNumber: '' });
    setShowKycForm(false);
    setKycStatus(null);
    setError('');
  };

  return (
    <div className="customer-view">
      <div className="phone-frame">
        {/* Home Screen */}
        {screen === 'home' && (
          <div className="screen home-screen">
            <div className="merchant-header">
              <h3>{merchantName}</h3>
              <p className="text-muted">Payment Terminal</p>
            </div>

            <div className="amount-due">
              <div className="label">Amount Due</div>
              <input
                type="number"
                className="amount mono"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                style={{ border: '1px solid #ccc', borderRadius: 6, padding: '4px 8px', width: '100%', textAlign: 'center', fontSize: 'inherit' }}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="payment-methods">
              <button
                className="method-btn upi-btn"
                onClick={() => setScreen('upi')}
              >
                <div className="method-icon">📱</div>
                <div className="method-name">UPI Payment</div>
                <div className="method-desc">Fast & Instant</div>
              </button>

              <button
                className="method-btn crypto-btn"
                onClick={() => setScreen('crypto')}
              >
                <div className="method-icon">⚡</div>
                <div className="method-name">Crypto</div>
                <div className="method-desc">Lightning Network</div>
              </button>
            </div>

            <div className="rate-info-small">
              <span className="label">Rate</span>
              <span className="mono">₹{rate?.toFixed(2) || 'loading...'}/USDC</span>
            </div>
          </div>
        )}

        {/* UPI Screen */}
        {screen === 'upi' && (
          <div className="screen upi-screen">
            <button className="btn-back" onClick={() => setScreen('home')}>
              ← Back
            </button>

            <h3 className="screen-title">UPI Payment</h3>

            <div className="payment-details">
              <div className="detail-row">
                <span className="label">Merchant</span>
                <span className="mono value">{merchantName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount</span>
                <span className="mono value">₹{amount}</span>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="payment-flow">
              <div className="step active">
                <div className="step-num">1</div>
                <div>Open UPI App</div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div>Scan QR Code</div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div>Enter PIN</div>
              </div>
            </div>

            <button
              className="btn btn-primary btn-full"
              onClick={handleUPIPay}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        )}

        {/* Crypto Screen */}
        {screen === 'crypto' && (
          <div className="screen crypto-screen">
            <button className="btn-back" onClick={() => setScreen('home')}>
              ← Back
            </button>

            <h3 className="screen-title">Crypto Payment</h3>

            {!showKycForm ? (
              <>
                <div className="payment-details">
                  <div className="detail-row">
                    <span className="label">Amount (INR)</span>
                    <span className="mono value">₹{amount}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Amount (USDC)</span>
                    <span className="mono value">
                      {rate ? (amount / rate).toFixed(2) : 'loading...'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Fee (0.5%)</span>
                    <span className="mono value warn">
                      {rate ? ((amount / rate) * 0.005).toFixed(2) : '0'} USDC
                    </span>
                  </div>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="wallet-input">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0xYourWalletAddress"
                    className="input-field"
                  />
                  <div className="hint">Demo: Generated on payment</div>
                </div>

                <button
                  className="btn btn-primary btn-full"
                  onClick={handleCryptoPay}
                  disabled={loading || !walletAddress}
                >
                  {loading ? 'Checking KYC...' : 'Continue'}
                </button>
              </>
            ) : (
              <>
                <div className="kyc-form">
                  <h4>KYC Verification</h4>
                  <p className="text-muted text-sm">
                    Complete verification to proceed with crypto payment
                  </p>

                  <div className="form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={kycForm.fullName}
                      onChange={(e) =>
                        setKycForm({ ...kycForm, fullName: e.target.value })
                      }
                      placeholder="John Doe"
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label>PAN Number</label>
                    <input
                      type="text"
                      value={kycForm.panNumber}
                      onChange={(e) =>
                        setKycForm({ ...kycForm, panNumber: e.target.value })
                      }
                      placeholder="AAAAA1234A"
                      className="input-field"
                      maxLength="10"
                    />
                  </div>

                  {error && <div className="error-message">{error}</div>}

                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleCryptoPay}
                    disabled={
                      loading || !kycForm.fullName || !kycForm.panNumber
                    }
                  >
                    {loading ? 'Verifying...' : 'Verify & Pay'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Success Screen */}
        {screen === 'success' && (
          <div className="screen success-screen">
            <div className="success-checkmark">✓</div>
            <h3>Payment Successful!</h3>

            <div className="payment-details">
              <div className="detail-row">
                <span className="label">Transaction ID</span>
                <span className="mono value text-xs">{lastTxId}</span>
              </div>
              <div className="detail-row">
                <span className="label">Amount</span>
                <span className="mono value">₹{amount}</span>
              </div>
              <div className="detail-row">
                <span className="label">Status</span>
                <span className="mono value success">Completed</span>
              </div>
            </div>

            <button
              className="btn btn-secondary btn-full"
              onClick={resetPayment}
            >
              New Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
