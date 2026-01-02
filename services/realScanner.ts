// Frontend API client for real scanner

import { ScanResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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


