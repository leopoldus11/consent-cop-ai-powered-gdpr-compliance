/**
 * Anti-Bot Detection Utilities
 * 
 * Advanced utilities to bypass Cloudflare, DataDome, and other anti-bot systems
 */

/**
 * Jittered Timing Utility
 * Randomizes delays to avoid predictable timing patterns
 */
export function jitteredDelay(baseMs: number, variance: number = 0.3): Promise<void> {
  const min = baseMs * (1 - variance);
  const max = baseMs * (1 + variance);
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Human-like typing delay (varies per character)
 */
export function humanTypingDelay(): Promise<void> {
  // Humans type at 40-200 WPM, so 50-300ms per character
  return jitteredDelay(150, 0.5);
}

/**
 * Human-like action delay (clicking, scrolling, etc.)
 */
export function humanActionDelay(): Promise<void> {
  // Actions typically take 200-800ms
  return jitteredDelay(400, 0.6);
}

/**
 * Pre-flight bot detection check
 * Tests if our setup can bypass bot detection before running the main scan
 */
export async function checkBotDetection(): Promise<{
  detected: boolean;
  score: number;
  details: any;
}> {
  try {
    const response = await fetch('https://bot-detector.rebrowser.net/api/check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        timestamp: Date.now(),
      }),
    });
    
    const result = await response.json();
    return {
      detected: result.detected || false,
      score: result.score || 0,
      details: result,
    };
  } catch (error: any) {
    console.warn('[BOT DETECTION] Pre-flight check failed:', error.message);
    return {
      detected: false,
      score: 0,
      details: { error: error.message },
    };
  }
}

/**
 * Get realistic Chrome 2026 user agent
 */
export function getRealisticUserAgent(): string {
  // Chrome 120+ user agent (as of 2024, simulating 2026)
  const chromeVersions = ['120.0.0.0', '121.0.0.0', '122.0.0.0', '123.0.0.0'];
  const osVersions = [
    'Macintosh; Intel Mac OS X 10_15_7',
    'Windows NT 10.0; Win64; x64',
    'X11; Linux x86_64',
  ];
  
  const chromeVersion = chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
  const osVersion = osVersions[Math.floor(Math.random() * osVersions.length)];
  
  return `Mozilla/5.0 (${osVersion}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
}

/**
 * Get realistic HTTP headers matching Chrome profile
 * Includes GPC signal for 2026 CCPA compliance testing
 */
export function getRealisticHeaders(options?: { includeGPC?: boolean }): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"macOS"',
  };

  // Add GPC header if requested (CCPA 2026 testing)
  if (options?.includeGPC) {
    headers['Sec-GPC'] = '1';
  }

  return headers;
}

/**
 * Proxy rotation middleware
 * Supports residential/mobile IPs
 */
export interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  type?: 'http' | 'socks5';
}

export function getProxyString(proxy: ProxyConfig): string {
  if (proxy.username && proxy.password) {
    return `${proxy.type || 'http'}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
  }
  return `${proxy.type || 'http'}://${proxy.host}:${proxy.port}`;
}

/**
 * Rotate proxy from pool (if configured)
 */
export function getNextProxy(proxyPool?: ProxyConfig[]): ProxyConfig | undefined {
  if (!proxyPool || proxyPool.length === 0) return undefined;
  return proxyPool[Math.floor(Math.random() * proxyPool.length)];
}



