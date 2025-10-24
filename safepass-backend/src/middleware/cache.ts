import { Request, Response, NextFunction } from 'express';
import { cacheService, CACHE_TTL } from '../services/cacheService';

// Re-export CACHE_TTL for convenience
export { CACHE_TTL };

interface CacheOptions {
  ttl?: number;
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request) => boolean;
}

/**
 * Cache middleware factory
 */
export function cache(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if disabled
    if (!cacheService.isEnabled()) {
      return next();
    }

    // Check condition if provided
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = options.keyGenerator 
      ? options.keyGenerator(req)
      : generateDefaultCacheKey(req);

    // Try to get from cache
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`🎯 Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    console.log(`❌ Cache MISS: ${cacheKey}`);

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache the response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ttl = options.ttl || CACHE_TTL.SHORT_TERM;
        cacheService.set(cacheKey, data, ttl);
        console.log(`💾 Cached response: ${cacheKey} (TTL: ${ttl}ms)`);
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Generate default cache key from request
 */
function generateDefaultCacheKey(req: Request): string {
  const userId = req.user?.id || 'anonymous';
  const userRole = req.user?.role || 'none';
  const path = req.path;
  const query = JSON.stringify(req.query);
  
  return `${userRole}:${userId}:${path}:${Buffer.from(query).toString('base64')}`;
}

/**
 * Cache key generators for common patterns
 */
export const cacheKeys = {
  userProfile: (req: Request) => `user:profile:${req.user?.id}`,
  userList: (req: Request) => `users:list:${req.user?.role}`,
  userStats: (req: Request) => `users:stats:${req.user?.role}`,
  workerList: (req: Request) => `users:workers:${req.user?.role}`,
  
  documentsPending: (req: Request) => `documents:pending:${req.user?.role}`,
  documentsVerified: (req: Request) => `documents:verified:${req.user?.role}`,
  documentsWorker: (req: Request) => `documents:worker:${req.user?.id}`,
  documentsAgency: (req: Request) => `documents:agency:${req.user?.id}`,
  documentsStats: (req: Request) => `documents:stats:${req.user?.role}`,
  
  trustScores: (req: Request) => `trust:scores:${req.user?.role}`,
  
  jobsList: (req: Request) => `jobs:list:${req.user?.role}:${JSON.stringify(req.query)}`,
  applicationsWorker: (req: Request) => `applications:worker:${req.user?.id}`,
  applicationsAgency: (req: Request) => `applications:agency:${req.user?.id}`,
  
  // Credentials cache keys
  userCredentials: (userId: string) => `credentials:user:${userId}`,
  credentialVerification: (jwt: string) => `credential:verify:${Buffer.from(jwt).toString('base64').substring(0, 32)}`,
};

/**
 * Cache invalidation helpers
 */
export const cacheInvalidation = {
  // User-related invalidations
  invalidateUser: (userId: string) => {
    cacheService.deletePattern(`user:profile:${userId}`);
    cacheService.deletePattern(`users:.*`);
  },

  invalidateUserLists: () => {
    cacheService.deletePattern(`users:.*`);
  },

  // Document-related invalidations
  invalidateDocuments: (userId?: string) => {
    if (userId) {
      cacheService.deletePattern(`documents:worker:${userId}`);
    }
    cacheService.deletePattern(`documents:pending:.*`);
    cacheService.deletePattern(`documents:verified:.*`);
    cacheService.deletePattern(`documents:agency:.*`);
    cacheService.deletePattern(`documents:stats:.*`);
  },

  // Job-related invalidations
  invalidateJobs: () => {
    cacheService.deletePattern(`jobs:.*`);
    cacheService.deletePattern(`applications:.*`);
  },

  // Trust score invalidations
  invalidateTrustScores: () => {
    cacheService.deletePattern(`trust:.*`);
  },

  // Credentials invalidations
  invalidateCredentials: (userId: string) => {
    cacheService.deletePattern(`credentials:user:${userId}`);
    cacheService.deletePattern(`credential:verify:.*`);
  },

  // Clear all cache
  clearAll: () => {
    cacheService.clear();
  }
};

/**
 * Cache statistics endpoint middleware
 */
export function cacheStats(req: Request, res: Response) {
  const stats = cacheService.getStats();
  const hitRate = cacheService.getHitRate();
  
  res.json({
    enabled: cacheService.isEnabled(),
    stats: {
      ...stats,
      hitRate: Math.round(hitRate * 100) / 100,
      hitRateFormatted: `${Math.round(hitRate)}%`
    },
    memory: {
      maxSize: process.env.CACHE_MAX_SIZE || '1000',
      currentSize: stats.size,
      utilizationPercent: Math.round((stats.size / parseInt(process.env.CACHE_MAX_SIZE || '1000')) * 100)
    }
  });
}

/**
 * Conditional caching based on user role
 */
export const cacheConditions = {
  // Cache for all authenticated users
  authenticated: (req: Request) => !!req.user,
  
  // Cache only for specific roles
  adminOnly: (req: Request) => req.user?.role === 'AgencyAdmin',
  regulatorOnly: (req: Request) => req.user?.role === 'Regulator',
  workerOnly: (req: Request) => req.user?.role === 'Worker',
  
  // Cache for admin and regulator roles
  adminAndRegulator: (req: Request) => 
    req.user?.role === 'AgencyAdmin' || req.user?.role === 'Regulator',
};
