Readme · MD
Copy

# PayBridge 💳⚡
### A Crypto & Fiat Payment Gateway Prototype for Indian Merchants
 
PayBridge is a full-stack payment gateway prototype that explores how cryptocurrency can interact with traditional payment systems. Built as part of a study on **"Crypto & Card Payments — How cryptocurrency interacts with traditional payment systems"**, it allows Indian merchants to accept both UPI and Lightning Network/USDC crypto payments from a single terminal.
 
---
 
## 💡 Why PayBridge?
 
Most Indian merchants use UPI for digital payments. Crypto, while growing, exists in a completely separate ecosystem. PayBridge bridges that gap — letting a merchant generate one QR code, accept payment in either fiat or crypto, and settle funds according to their preference. No switching between apps, no technical blockchain knowledge required.
 
---
 
## ✨ Features
 
- **Merchant Terminal** — Enter amount in INR, generate QR code, confirm payment
- **Customer View** — Choose between UPI or Lightning Network crypto payment
- **Live Exchange Rates** — INR to USDC conversion via CoinGecko API in real time
- **Fee Calculation** — 0.5% gateway fee + 1% TDS (as per Indian crypto tax law)
- **KYC Flow** — PAN number verification for crypto payments (regulatory compliance)
- **Settlement Preferences** — Fiat Only, Crypto Only, or a custom Split percentage
- **Transaction Dashboard** — Revenue, volume, fees, and blockchain tx hash for crypto payments
---
 
## 🛠 Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | React, Next.js |
| Backend | Express.js, Node.js |
| Database | lowdb (JSON) |
| Crypto Rates | CoinGecko API |
| QR Generation | qrcode (npm) |
| Styling | CSS Modules |
 
---
 
## 📁 Project Structure
 
```
qr_project_fixed/
├── app/                  # Next.js app directory
│   └── api/[...path]/    # API proxy to Express backend
├── client/               # React frontend
│   └── src/
│       ├── App.js
│       ├── MerchantTerminal.jsx
│       ├── CustomerView.jsx
│       └── Dashboard.jsx
└── server/               # Express backend
    ├── index.js
    ├── routes.js
    ├── db.js
    ├── qrService.js
    └── priceService.js
```
 
---
 
## 🚀 Getting Started
 
### Prerequisites
- Node.js (v18 or higher) — download from [nodejs.org](https://nodejs.org)
### Installation & Running
 
**1. Start the backend server**
```bash
cd server
npm install
node index.js
```
You should see: `Server running on port 5000`
 
**2. Start the frontend (in a new terminal)**
```bash
cd qr_project_fixed
npm install
npm run dev
```
You should see: `Ready on http://localhost:3000`
 
**3. Build the React client (in a new terminal)**
```bash
cd client
npm install
npm run build
```
 
**4. Open in browser**
```
http://localhost:3000
```
 
---
 
## 💳 How It Works
 
1. Merchant enters the payment amount in INR
2. Sets their settlement preference (Fiat / Crypto / Split)
3. Clicks **Generate QR** — backend calculates fees and returns a QR code
4. Customer scans and chooses UPI or Lightning Network
5. Crypto payments require KYC (PAN number)
6. Merchant confirms payment received
7. Transaction is saved with a blockchain chain reference hash for crypto payments
---
 
## ⛓ Blockchain Notes
 
Currently the Lightning Network payments and transaction hashes are simulated. The architecture is designed so that real blockchain connectivity can be added without a full rebuild:
 
- **USDC on Polygon** — integrating `ethers.js` would replace mock hashes with real on-chain transactions viewable on Polygonscan
- **Real Lightning** — connecting an LND (Lightning Network Daemon) node would handle real Bitcoin Lightning invoices
This prototype demonstrates the full payment flow and business logic. Blockchain connectivity is the natural next step toward a production system.
 
---