import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis Service - Manages Redis connection and basic operations
 * Handles connection pooling and health checks
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private isConnected = false;

  async onModuleInit() {
    try {
      const redisHost = process.env.REDIS_HOST || 'localhost';
      const redisPort = process.env.REDIS_PORT || '6379';
      const redisPassword = process.env.REDIS_PASSWORD;
      let redisUrl = `redis://${redisHost}:${redisPort}`;
      if (redisPassword) {
        redisUrl = `redis://:${encodeURIComponent(redisPassword)}@${redisHost}:${redisPort}`;
      }

      this.client = createClient({
        url: redisUrl,
      });

      this.client.on('error', (err) => console.error('Redis Error:', err));
      this.client.on('connect', () => {
        console.log('✅ Redis connected');
        this.isConnected = true;
      });
      this.client.on('disconnect', () => {
        console.log('❌ Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      console.warn('Application will continue without Redis caching');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
    }
  }

  getClient(): RedisClientType {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<string> {
    if (!this.isConnected) {
      return 'disconnected';
    }
    return await this.client.ping();
  }
}
