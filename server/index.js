import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db.js';
import routes from './routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Middleware
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN }));

// Initialize database
initDb();
console.log('[v0] ✓ Database initialized');

// Routes
app.use('/api', routes);

// Start server
app.listen(PORT, () => {
  console.log(`[v0] ✓ PayBridge server running on http://localhost:${PORT}`);
  console.log(`[v0] ✓ CORS enabled for ${CORS_ORIGIN}`);
});
