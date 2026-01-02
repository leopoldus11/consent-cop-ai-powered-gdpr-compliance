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
import { scanResultCache } from './cache.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Cache stats endpoint (for monitoring)
app.get('/api/cache/stats', (req, res) => {
  const stats = scanResultCache.getStats();
  res.json({
    cacheSize: stats.size,
    cachedUrls: stats.keys.slice(0, 10), // Show first 10
    totalCached: stats.size,
  });
});

// Scan endpoint with caching
app.post('/api/scan', async (req, res) => {
  const { url, forceRefresh } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const cachedResult = scanResultCache.get(url);
      if (cachedResult) {
        console.log(`[CACHE] Returning cached result for: ${url}`);
        return res.json({
          ...cachedResult,
          cached: true,
          cacheTimestamp: cachedResult.timestamp,
        });
      }
    }

    console.log(`[SCAN] Starting scan for: ${url}`);
    const result = await scanWebsite(url);
    
    // Cache the result (24 hours TTL)
    scanResultCache.set(url, result);
    console.log(`[SCAN] Scan completed and cached for: ${url}`);
    
    res.json({
      ...result,
      cached: false,
    });
  } catch (error: any) {
    console.error('Scan error:', error);
    res.status(500).json({ 
      error: 'Scan failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Handle port conflicts gracefully
const server = app.listen(PORT, () => {
  console.log(`🚀 Consent Cop Scanner API running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Scan endpoint: POST http://localhost:${PORT}/api/scan`);
});

server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Please kill the process using: lsof -ti:${PORT} | xargs kill -9`);
    console.error(`   Or use a different port by setting PORT environment variable.`);
    process.exit(1);
  } else {
    throw error;
  }
});

