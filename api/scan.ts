/**
 * Vercel Serverless Function: POST /api/scan
 * Handles website scanning requests
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanWebsite } from '../server/scanner.js';
import { scanResultCache } from '../server/cache.js';

// Enable CORS
function setCorsHeaders(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    setCorsHeaders(res);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  setCorsHeaders(res);

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
    
    return res.json({
      ...result,
      cached: false,
    });
  } catch (error: any) {
    console.error('Scan error:', error);
    return res.status(500).json({ 
      error: 'Scan failed', 
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

