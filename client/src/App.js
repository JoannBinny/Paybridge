import React, { useState, useEffect } from 'react';
import MerchantTerminal from './MerchantTerminal';
import Dashboard from './Dashboard';
import CustomerView from './CustomerView';
import { api } from './api';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('terminal');
  const [merchantId, setMerchantId] = useState(null);
  const [merchantName, setMerchantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [transactionCount, setTransactionCount] = useState(0);

  // Initialize merchant data
  useEffect(() => {
    const init = async () => {
      try {
        const merchantIdToUse = 'demo-merchant-1';
        const merchant = await api.getMerchant(merchantIdToUse);
        
        setMerchantId(merchantIdToUse);
        setMerchantName(merchant.merchant.name);

        // Load transaction count
        const txData = await api.getTransactions(merchantIdToUse);
        setTransactionCount(txData.transactions?.length || 0);
      } catch (err) {
        console.error('[v0] Failed to load merchant:', err.message);
        // Fallback to demo values
        setMerchantId('demo-merchant-1');
        setMerchantName('TechCafe Mumbai');
        setTransactionCount(0);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const handlePaymentMade = () => {
    setTransactionCount((prev) => prev + 1);
    // Switch to dashboard after 2 seconds
    setTimeout(() => {
      setActiveTab('dashboard');
    }, 2000);
  };

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Initializing PayBridge...</p>
      </div>
    );
  }

  if (!merchantId) {
    return (
      <div className="app-error">
        <h2>Unable to Load Application</h2>
        <p>Could not initialize merchant data. Please try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-pay">Pay</span>
            <span className="logo-bridge">Bridge</span>
          </div>
          <nav className="nav-tabs">
            <button
              className={`nav-btn ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => setActiveTab('terminal')}
            >
              Merchant Terminal
            </button>
            <button
              className={`nav-btn ${activeTab === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveTab('customer')}
            >
              Customer View
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {activeTab === 'terminal' && (
          <MerchantTerminal
            merchantId={merchantId}
            onPaymentMade={handlePaymentMade}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard merchantId={merchantId} merchantName={merchantName} />
        )}
        {activeTab === 'customer' && (
          <CustomerView
            merchantId={merchantId}
            merchantName={merchantName}
            onPaymentMade={handlePaymentMade}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          PayBridge v1.0 • Dual QR Payment Terminal • UPI + Lightning Network
        </p>
      </footer>
    </div>
  );
}

export default App;
