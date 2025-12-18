import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

/**
 * Cache Service - High-level caching operations
 * Handles cache SET, GET, DELETE operations with automatic expiration
 */
@Injectable()
export class CacheService {
  constructor(private redisService: RedisService) {}

  /**
   * Get value from cache
   * @param key Cache key
   * @returns Cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.redisService.isHealthy()) {
        return null;
      }
      const client = this.redisService.getClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional expiration
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (default: 3600 = 1 hour)
   */
  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    try {
      if (!this.redisService.isHealthy()) {
        return;
      }
      const client = this.redisService.getClient();
      await client.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   * @param key Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (!this.redisService.isHealthy()) {
        return;
      }
      const client = this.redisService.getClient();
      await client.del(key);
    } catch (error) {
      console.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys from cache
   * @param keys Array of cache keys
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      if (!this.redisService.isHealthy() || keys.length === 0) {
        return;
      }
      const client = this.redisService.getClient();
      await client.del(keys);
    } catch (error) {
      console.error(`Cache DELETE MANY error:`, error);
    }
  }

  /**
   * Clear all cache (use with caution in production)
   */
  async clear(): Promise<void> {
    try {
      if (!this.redisService.isHealthy()) {
        return;
      }
      const client = this.redisService.getClient();
      await client.flushDb();
    } catch (error) {
      console.error('Cache CLEAR error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      if (!this.redisService.isHealthy()) {
        return { status: 'disconnected' };
      }
      const client = this.redisService.getClient();
      const info = await client.info('stats');
      return { status: 'connected', info };
    } catch (error) {
      console.error('Cache STATS error:', error);
      return { status: 'error' };
    }
  }
}
