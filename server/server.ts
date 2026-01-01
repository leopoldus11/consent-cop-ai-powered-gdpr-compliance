// Load environment variables from .env.local (or .env)
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local first, then fall back to .env
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') }); // Fallback to .env if .env.local doesn't exist

import express from 'express';
import cors from 'cors';
import { scanWebsite } from './scanner.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Scan endpoint
app.post('/api/scan', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Starting scan for: ${url}`);
    const result = await scanWebsite(url);
    console.log(`Scan completed for: ${url}`);
    res.json(result);
  } catch (error: any) {
    console.error('Scan error:', error);
    res.status(500).json({ 
      error: 'Scan failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Consent Cop Scanner API running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Scan endpoint: POST http://localhost:${PORT}/api/scan`);
});

