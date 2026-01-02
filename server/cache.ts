/**
 * Simple in-memory cache for scan results and AI analysis
 * In production, replace with Redis or similar persistent cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class SimpleCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private defaultTTL: number; // Time to live in milliseconds

  constructor(defaultTTL: number = 24 * 60 * 60 * 1000) { // Default 24 hours
    this.defaultTTL = defaultTTL;
    // Clean up expired entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Generate cache key from URL (normalize URL to handle variations)
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // Remove trailing slash, normalize protocol
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.replace(/\/$/, '')}${urlObj.search}`;
    } catch {
      return url;
    }
  }

  /**
   * Get cached value
   */
  get(key: string): T | null {
    const normalizedKey = this.normalizeUrl(key);
    const entry = this.cache.get(normalizedKey);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(normalizedKey);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cached value
   */
  set(key: string, value: T, ttl?: number): void {
    const normalizedKey = this.normalizeUrl(key);
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    
    this.cache.set(normalizedKey, {
      data: value,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete cached value
   */
  delete(key: string): void {
    const normalizedKey = this.normalizeUrl(key);
    this.cache.delete(normalizedKey);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instances for scan results and AI analysis
export const scanResultCache = new SimpleCache<any>(24 * 60 * 60 * 1000); // 24 hours for scan results
export const aiAnalysisCache = new SimpleCache<any>(7 * 24 * 60 * 60 * 1000); // 7 days for AI analysis (more stable)

/**
 * Generate cache key with hash for large objects
 */
export function generateCacheKey(url: string, suffix?: string): string {
  return suffix ? `${url}::${suffix}` : url;
}


