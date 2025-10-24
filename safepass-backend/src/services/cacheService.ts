interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    size: 0
  };
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.deletes++;
      return null;
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set data in cache with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    // If cache is at max size, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
        this.stats.deletes++;
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });

    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Delete cache entries matching a pattern
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    this.stats.deletes += deletedCount;
    this.stats.size = this.cache.size;
    return deletedCount;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.deletes += size;
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache hit rate as percentage
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  /**
   * Check if cache is enabled via environment variable
   */
  isEnabled(): boolean {
    return process.env.CACHE_ENABLED !== 'false';
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.stats.deletes += deletedCount;
      this.stats.size = this.cache.size;
      console.log(`🧹 Cache cleanup: removed ${deletedCount} expired entries`);
    }
  }

  /**
   * Shutdown cache service
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  USER_PROFILE: 10 * 60 * 1000,      // 10 minutes
  USER_LIST: 5 * 60 * 1000,          // 5 minutes
  DOCUMENT_LIST: 3 * 60 * 1000,      // 3 minutes
  STATISTICS: 15 * 60 * 1000,        // 15 minutes
  LOOKUP_DATA: 30 * 60 * 1000,       // 30 minutes
  SHORT_TERM: 2 * 60 * 1000,         // 2 minutes
} as const;

// Create singleton instance
export const cacheService = new CacheService(
  parseInt(process.env.CACHE_MAX_SIZE || '1000')
);

// Graceful shutdown
process.on('SIGTERM', () => {
  cacheService.shutdown();
});

process.on('SIGINT', () => {
  cacheService.shutdown();
});

export default cacheService;
