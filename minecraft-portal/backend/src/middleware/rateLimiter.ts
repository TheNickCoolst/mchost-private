import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/CacheService';
import { RateLimitError } from './errorHandler';

interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

class RedisRateLimiter {
  async limit(options: RateLimitOptions) {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!cacheService.isAvailable()) {
        // If Redis is not available, fall back to memory-based rate limiting
        return next();
      }

      try {
        const key = options.keyGenerator
          ? options.keyGenerator(req)
          : this.getDefaultKey(req);

        const rateLimitKey = `ratelimit:${key}`;

        // Get current count
        const current = await cacheService.get<number>(rateLimitKey);
        const count = current || 0;

        // Check if limit exceeded
        if (count >= options.max) {
          // Set retry-after header
          const ttl = Math.ceil(options.windowMs / 1000);
          res.setHeader('Retry-After', ttl);
          res.setHeader('X-RateLimit-Limit', options.max);
          res.setHeader('X-RateLimit-Remaining', 0);
          res.setHeader('X-RateLimit-Reset', Date.now() + options.windowMs);

          throw new RateLimitError(
            options.message || 'Too many requests, please try again later'
          );
        }

        // Increment counter
        const newCount = await cacheService.increment(
          rateLimitKey,
          Math.ceil(options.windowMs / 1000)
        );

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', options.max);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, options.max - newCount));
        res.setHeader('X-RateLimit-Reset', Date.now() + options.windowMs);

        // Handle response to potentially reset counter
        if (options.skipSuccessfulRequests || options.skipFailedRequests) {
          const originalSend = res.json;

          res.json = function (data: any) {
            const statusCode = res.statusCode;

            // Reset counter for successful requests if configured
            if (
              options.skipSuccessfulRequests &&
              statusCode >= 200 &&
              statusCode < 400
            ) {
              cacheService.del(rateLimitKey).catch(console.error);
            }

            // Reset counter for failed requests if configured
            if (options.skipFailedRequests && statusCode >= 400) {
              cacheService.del(rateLimitKey).catch(console.error);
            }

            return originalSend.call(this, data);
          };
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  private getDefaultKey(req: Request): string {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const userId = (req as any).user?.id || 'anonymous';
    return `${ip}:${userId}:${req.path}`;
  }

  // Preset limiters
  strict() {
    return this.limit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP, please try again later'
    });
  }

  moderate() {
    return this.limit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500,
      message: 'Too many requests, please slow down'
    });
  }

  lenient() {
    return this.limit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000,
      message: 'Rate limit exceeded'
    });
  }

  auth() {
    return this.limit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50,
      skipSuccessfulRequests: true,
      message: 'Too many authentication attempts, please try again later'
    });
  }

  api() {
    return this.limit({
      windowMs: 1 * 60 * 1000, // 1 minute
      max: 60,
      message: 'API rate limit exceeded, please try again later'
    });
  }

  // User-specific rate limiting
  perUser(max: number = 100, windowMs: number = 60000) {
    return this.limit({
      windowMs,
      max,
      keyGenerator: (req) => {
        const userId = (req as any).user?.id || 'anonymous';
        return `user:${userId}`;
      },
      message: 'You have exceeded your rate limit'
    });
  }

  // IP-based rate limiting
  perIP(max: number = 100, windowMs: number = 60000) {
    return this.limit({
      windowMs,
      max,
      keyGenerator: (req) => {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
        return `ip:${ip}`;
      },
      message: 'Too many requests from your IP address'
    });
  }

  // Endpoint-specific rate limiting
  perEndpoint(endpoint: string, max: number = 100, windowMs: number = 60000) {
    return this.limit({
      windowMs,
      max,
      keyGenerator: (req) => {
        const userId = (req as any).user?.id || 'anonymous';
        const ip = req.ip || 'unknown';
        return `endpoint:${endpoint}:${userId}:${ip}`;
      },
      message: `Rate limit exceeded for ${endpoint}`
    });
  }
}

export const redisRateLimiter = new RedisRateLimiter();
