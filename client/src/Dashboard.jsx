import React, { useState, useEffect } from 'react';
import { api } from './api';
import './Dashboard.css';

function formatTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function Dashboard({ merchantId, merchantName }) {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [merchantId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      const [statsData, txData] = await Promise.all([
        api.getStats(merchantId),
        api.getTransactions(merchantId),
      ]);

      setStats(statsData.stats);
      setTransactions(txData.transactions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>{merchantName}</h2>
          <p className="text-muted">Payment Analytics</p>
        </div>
        <button className="btn btn-secondary" onClick={loadDashboardData}>
          ↻ Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {/* Stats Grid */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Revenue (INR)</div>
            <div className="stat-value mono">
              ₹{(stats.total_revenue_inr ?? 0).toLocaleString('en-IN')}
            </div>
            <div className="stat-detail">
              From {stats.transaction_count} transactions
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Transaction Count</div>
            <div className="stat-value mono">{stats.transaction_count}</div>
            <div className="stat-detail">
              UPI: {stats.upi_count} | Crypto: {stats.crypto_count}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Crypto Volume (USDC)</div>
            <div className="stat-value mono">
              {(stats.crypto_volume_usdc ?? 0).toFixed(2)}
            </div>
            <div className="stat-detail">
              {stats.crypto_count} crypto transactions
            </div>
          </div>

          <div className="stat-card accent">
            <div className="stat-label">Fees Earned (USDC)</div>
            <div className="stat-value mono">
              {(stats.total_fees_usdc ?? 0).toFixed(2)}
            </div>
            <div className="stat-detail">0.5% gateway fee</div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="transactions-section">
        <h3>Recent Transactions</h3>

        {transactions.length > 0 ? (
          <div className="transactions-table">
            <div className="table-header">
              <div className="col-transaction">Transaction</div>
              <div className="col-method">Method</div>
              <div className="col-amount">Amount</div>
              <div className="col-status">Status</div>
              <div className="col-time">Time</div>
            </div>

            {transactions.map((tx) => (
              <div className="table-row" key={tx.id}>
                <div className="col-transaction">
                  <div className="tx-name">{tx.merchant_name}</div>
                  <div className="tx-id mono text-xs">{tx.id.slice(0, 12)}...</div>
                </div>

                <div className="col-method">
                  <span
                    className={`badge badge-${tx.method === 'upi' ? 'upi' : 'lightning'}`}
                  >
                    {tx.method === 'upi' ? 'UPI' : '⚡ Lightning'}
                  </span>
                </div>

                <div className="col-amount">
                  <div className="amount mono">
                    ₹{tx.amount_inr}
                  </div>
                  <div className="amount-usdc mono text-xs">
                    {tx.amount_usdc} USDC
                  </div>
                </div>

                <div className="col-status">
                  <span className={`status-badge status-${tx.status}`}>
                    {tx.status}
                  </span>
                </div>

                <div className="col-time text-muted text-sm">
                  {formatTime(tx.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No transactions yet</p>
            <span className="text-muted">Payments will appear here</span>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="dashboard-footer">
        <p className="text-muted text-sm">
          💡 Crypto payments are auto-converted to INR based on live exchange rates.
          Settlement preferences can be configured in the Merchant Terminal.
        </p>
      </div>
    </div>
  );
}
