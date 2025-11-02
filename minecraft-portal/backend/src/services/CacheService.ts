import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private isEnabled: boolean = false;

  async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = createClient({
        url: redisUrl,
        password: process.env.REDIS_PASSWORD,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Too many reconnection attempts, giving up');
              return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isEnabled = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connected successfully');
        this.isEnabled = true;
      });

      this.client.on('disconnect', () => {
        console.log('Redis disconnected');
        this.isEnabled = false;
      });

      await this.client.connect();
      this.isEnabled = true;
      console.log('Redis Cache Service initialized');
    } catch (error) {
      console.warn('Redis not available, caching disabled:', error);
      this.isEnabled = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      const data = await this.client.get(key);
      if (data) {
        return JSON.parse(data) as T;
      }
      return null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 300): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  async delPattern(pattern: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error('Redis delPattern error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  async increment(key: string, ttl: number = 300): Promise<number> {
    if (!this.isEnabled || !this.client) {
      return 0;
    }

    try {
      const value = await this.client.incr(key);
      await this.client.expire(key, ttl);
      return value;
    } catch (error) {
      console.error('Redis increment error:', error);
      return 0;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isEnabled = false;
    }
  }

  isAvailable(): boolean {
    return this.isEnabled;
  }
}

export const cacheService = new CacheService();
