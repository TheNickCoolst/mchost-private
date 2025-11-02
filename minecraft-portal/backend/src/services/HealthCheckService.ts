import { AppDataSource } from '../config/database';
import { cacheService } from './CacheService';
import { emailService } from './EmailService';
import os from 'os';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: ComponentHealth;
    cache: ComponentHealth;
    email: ComponentHealth;
    memory: ComponentHealth;
    disk: ComponentHealth;
  };
  metrics: {
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  responseTime?: number;
  message?: string;
  details?: any;
}

class HealthCheckService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  async getHealthStatus(): Promise<HealthStatus> {
    const [database, cache, email, memory, disk] = await Promise.all([
      this.checkDatabase(),
      this.checkCache(),
      this.checkEmail(),
      this.checkMemory(),
      this.checkDisk()
    ]);

    const overallStatus = this.determineOverallStatus([
      database,
      cache,
      memory,
      disk
    ]);

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      checks: {
        database,
        cache,
        email,
        memory,
        disk
      },
      metrics: {
        requestsPerMinute: this.getRequestsPerMinute(),
        averageResponseTime: this.getAverageResponseTime(),
        errorRate: this.getErrorRate()
      }
    };
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      if (!AppDataSource.isInitialized) {
        return {
          status: 'down',
          message: 'Database not initialized'
        };
      }

      // Test database connection
      await AppDataSource.query('SELECT 1');

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime < 1000 ? 'up' : 'degraded',
        responseTime,
        message: 'Database connection healthy',
        details: {
          type: 'PostgreSQL',
          connected: true
        }
      };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `Database error: ${error.message}`
      };
    }
  }

  private async checkCache(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      if (!cacheService.isAvailable()) {
        return {
          status: 'down',
          message: 'Redis cache not available'
        };
      }

      // Test cache operations
      const testKey = 'health-check-test';
      const testValue = Date.now().toString();

      await cacheService.set(testKey, testValue, 10);
      const retrieved = await cacheService.get(testKey);
      await cacheService.del(testKey);

      const responseTime = Date.now() - startTime;

      if (retrieved !== testValue) {
        return {
          status: 'degraded',
          responseTime,
          message: 'Cache read/write mismatch'
        };
      }

      return {
        status: responseTime < 500 ? 'up' : 'degraded',
        responseTime,
        message: 'Cache healthy',
        details: {
          type: 'Redis'
        }
      };
    } catch (error: any) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        message: `Cache error: ${error.message}`
      };
    }
  }

  private async checkEmail(): Promise<ComponentHealth> {
    try {
      if (!emailService.isAvailable()) {
        return {
          status: 'down',
          message: 'Email service not configured'
        };
      }

      return {
        status: 'up',
        message: 'Email service healthy',
        details: {
          configured: true
        }
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: `Email error: ${error.message}`
      };
    }
  }

  private async checkMemory(): Promise<ComponentHealth> {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    const heapUsed = process.memoryUsage().heapUsed;
    const heapTotal = process.memoryUsage().heapTotal;
    const heapUsagePercent = (heapUsed / heapTotal) * 100;

    let status: 'up' | 'degraded' | 'down' = 'up';
    if (memoryUsagePercent > 90 || heapUsagePercent > 90) {
      status = 'down';
    } else if (memoryUsagePercent > 80 || heapUsagePercent > 80) {
      status = 'degraded';
    }

    return {
      status,
      message: `Memory usage: ${memoryUsagePercent.toFixed(1)}%`,
      details: {
        totalMemory: this.formatBytes(totalMemory),
        freeMemory: this.formatBytes(freeMemory),
        usedMemory: this.formatBytes(usedMemory),
        memoryUsagePercent: memoryUsagePercent.toFixed(2),
        heapUsed: this.formatBytes(heapUsed),
        heapTotal: this.formatBytes(heapTotal),
        heapUsagePercent: heapUsagePercent.toFixed(2)
      }
    };
  }

  private async checkDisk(): Promise<ComponentHealth> {
    try {
      // Simple disk check - in production, use a library like 'diskusage'
      const load = os.loadavg();

      return {
        status: 'up',
        message: 'Disk healthy',
        details: {
          loadAverage1m: load[0].toFixed(2),
          loadAverage5m: load[1].toFixed(2),
          loadAverage15m: load[2].toFixed(2)
        }
      };
    } catch (error: any) {
      return {
        status: 'degraded',
        message: `Disk check failed: ${error.message}`
      };
    }
  }

  private determineOverallStatus(
    checks: ComponentHealth[]
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const downCount = checks.filter((c) => c.status === 'down').length;
    const degradedCount = checks.filter((c) => c.status === 'degraded').length;

    if (downCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  }

  // Metrics tracking
  recordRequest() {
    this.requestCount++;
  }

  recordError() {
    this.errorCount++;
  }

  recordResponseTime(time: number) {
    this.responseTimes.push(time);

    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  private getRequestsPerMinute(): number {
    const uptimeMinutes = (Date.now() - this.startTime) / 60000;
    return Math.round(this.requestCount / Math.max(uptimeMinutes, 1));
  }

  private getAverageResponseTime(): number {
    if (this.responseTimes.length === 0) return 0;

    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.responseTimes.length);
  }

  private getErrorRate(): number {
    if (this.requestCount === 0) return 0;
    return parseFloat(((this.errorCount / this.requestCount) * 100).toFixed(2));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getSystemInfo() {
    return {
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      hostname: os.hostname(),
      nodeVersion: process.version,
      uptime: os.uptime(),
      processUptime: process.uptime()
    };
  }
}

export const healthCheckService = new HealthCheckService();
