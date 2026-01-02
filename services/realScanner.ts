// Frontend API client for real scanner

import { ScanResult } from '../types';

// Use Vercel API URL if deployed, otherwise use configured URL or localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && window.location.origin) || 
  'http://localhost:3001';

export async function realScan(url: string): Promise<ScanResult> {
  const response = await fetch(`${API_BASE_URL}/api/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || error.error || `Scan failed: ${response.statusText}`);
  }

  return response.json();
}


