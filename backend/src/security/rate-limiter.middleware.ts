import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimiterMiddleware implements NestMiddleware {
  private requests: Map<string, RequestRecord> = new Map();
  
  private config: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // 100 requests per window
    message: 'Too many requests, please try again later.',
  };
  
  constructor(config?: Partial<RateLimitConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Cleanup old entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  use(req: Request, res: Response, next: NextFunction) {
    const identifier = this.getIdentifier(req);
    const now = Date.now();
    
    let record = this.requests.get(identifier);
    
    if (!record || now > record.resetTime) {
      // Create new record or reset expired one
      record = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.requests.set(identifier, record);
    } else {
      // Increment request count
      record.count++;
      
      if (record.count > this.config.maxRequests) {
        const retryAfter = Math.ceil((record.resetTime - now) / 1000);
        
        res.setHeader('Retry-After', retryAfter.toString());
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
        
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: this.config.message,
            retryAfter,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
    
    // Set rate limit headers
    const remaining = this.config.maxRequests - record.count;
    res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());
    
    next();
  }
  
  private getIdentifier(req: Request): string {
    // Use IP address and user ID if authenticated
    const ip = this.getClientIp(req);
    const userId = (req as any).user?.userId || 'anonymous';
    return `${ip}:${userId}`;
  }
  
  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
  
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Specific rate limiters for different endpoints
export class AuthRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 login attempts per window
      message: 'Too many authentication attempts, please try again later.',
    });
  }
}

export class ApiRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 1 * 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute
      message: 'Too many API requests, please try again later.',
    });
  }
}

export class UploadRateLimiter extends RateLimiterMiddleware {
  constructor() {
    super({
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 uploads per hour
      message: 'Too many file uploads, please try again later.',
    });
  }
}
