/**
 * Vercel Serverless Function: GET /api/cache/stats
 * Cache statistics endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scanResultCache } from '../../server/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const stats = scanResultCache.getStats();
    return res.json({
      cacheSize: stats.size,
      cachedUrls: stats.keys.slice(0, 10), // Show first 10
      totalCached: stats.size,
    });
  } catch (error: any) {
    console.error('Cache stats error:', error);
    return res.status(500).json({ 
      error: 'Failed to get cache stats', 
      message: error.message
    });
  }
}

