import { AppDataSource } from '../config/database';
import { ServerMetric } from '../models/ServerMetric';
import { cacheService } from './CacheService';

interface MetricData {
  serverId: string;
  cpuUsage?: number;
  memoryUsed?: number;
  memoryTotal?: number;
  diskUsed?: number;
  diskTotal?: number;
  networkIn?: number;
  networkOut?: number;
  playerCount?: number;
  maxPlayers?: number;
  tps?: number;
  loadedChunks?: number;
  entities?: number;
  status?: string;
}

interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

interface AggregatedMetrics {
  avg: number;
  min: number;
  max: number;
  current: number;
}

class MetricsService {
  private repository = AppDataSource.getRepository(ServerMetric);

  async recordMetric(data: MetricData): Promise<ServerMetric> {
    const metric = this.repository.create({
      serverId: data.serverId,
      timestamp: new Date(),
      cpuUsage: data.cpuUsage || null,
      memoryUsed: data.memoryUsed || null,
      memoryTotal: data.memoryTotal || null,
      diskUsed: data.diskUsed || null,
      diskTotal: data.diskTotal || null,
      networkIn: data.networkIn || null,
      networkOut: data.networkOut || null,
      playerCount: data.playerCount || null,
      maxPlayers: data.maxPlayers || null,
      tps: data.tps || null,
      loadedChunks: data.loadedChunks || null,
      entities: data.entities || null,
      status: data.status || null
    });

    await this.repository.save(metric);

    // Cache latest metrics
    await cacheService.set(`metrics:latest:${data.serverId}`, metric, 60);

    return metric;
  }

  async getLatestMetrics(serverId: string): Promise<ServerMetric | null> {
    // Try cache first
    const cached = await cacheService.get<ServerMetric>(`metrics:latest:${serverId}`);
    if (cached) {
      return cached;
    }

    // Get from database
    const metric = await this.repository.findOne({
      where: { serverId },
      order: { timestamp: 'DESC' }
    });

    if (metric) {
      await cacheService.set(`metrics:latest:${serverId}`, metric, 60);
    }

    return metric;
  }

  async getMetricsTimeSeries(
    serverId: string,
    metricName: keyof ServerMetric,
    startTime: Date,
    endTime: Date,
    interval: number = 60
  ): Promise<TimeSeriesData[]> {
    const cacheKey = `metrics:timeseries:${serverId}:${metricName}:${startTime.getTime()}:${endTime.getTime()}:${interval}`;

    // Try cache first
    const cached = await cacheService.get<TimeSeriesData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const metrics = await this.repository
      .createQueryBuilder('metric')
      .select([
        `DATE_TRUNC('second', metric.timestamp) as timestamp`,
        `AVG(metric.${metricName as string}) as value`
      ])
      .where('metric.serverId = :serverId', { serverId })
      .andWhere('metric.timestamp >= :startTime', { startTime })
      .andWhere('metric.timestamp <= :endTime', { endTime })
      .groupBy(`DATE_TRUNC('second', metric.timestamp)`)
      .orderBy('timestamp', 'ASC')
      .getRawMany();

    const timeSeries: TimeSeriesData[] = metrics.map((m) => ({
      timestamp: new Date(m.timestamp),
      value: parseFloat(m.value) || 0
    }));

    // Cache for 5 minutes
    await cacheService.set(cacheKey, timeSeries, 300);

    return timeSeries;
  }

  async getAggregatedMetrics(
    serverId: string,
    metricName: keyof ServerMetric,
    startTime: Date,
    endTime: Date
  ): Promise<AggregatedMetrics | null> {
    const cacheKey = `metrics:aggregated:${serverId}:${metricName}:${startTime.getTime()}:${endTime.getTime()}`;

    // Try cache first
    const cached = await cacheService.get<AggregatedMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.repository
      .createQueryBuilder('metric')
      .select([
        `AVG(metric.${metricName as string}) as avg`,
        `MIN(metric.${metricName as string}) as min`,
        `MAX(metric.${metricName as string}) as max`
      ])
      .where('metric.serverId = :serverId', { serverId })
      .andWhere('metric.timestamp >= :startTime', { startTime })
      .andWhere('metric.timestamp <= :endTime', { endTime })
      .getRawOne();

    const latest = await this.getLatestMetrics(serverId);
    const currentValue = latest ? (latest[metricName] as number) || 0 : 0;

    const aggregated: AggregatedMetrics = {
      avg: parseFloat(result?.avg) || 0,
      min: parseFloat(result?.min) || 0,
      max: parseFloat(result?.max) || 0,
      current: currentValue
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, aggregated, 300);

    return aggregated;
  }

  async getServerStatsSummary(serverId: string, hours: number = 24) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const [cpu, memory, disk, players, tps] = await Promise.all([
      this.getAggregatedMetrics(serverId, 'cpuUsage', startTime, endTime),
      this.getAggregatedMetrics(serverId, 'memoryUsed', startTime, endTime),
      this.getAggregatedMetrics(serverId, 'diskUsed', startTime, endTime),
      this.getAggregatedMetrics(serverId, 'playerCount', startTime, endTime),
      this.getAggregatedMetrics(serverId, 'tps', startTime, endTime)
    ]);

    return {
      cpu,
      memory,
      disk,
      players,
      tps,
      period: {
        start: startTime,
        end: endTime,
        hours
      }
    };
  }

  async deleteOldMetrics(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('timestamp < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  async getPlayerCountHistory(
    serverId: string,
    hours: number = 24
  ): Promise<TimeSeriesData[]> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    return this.getMetricsTimeSeries(serverId, 'playerCount', startTime, endTime, 300);
  }

  async getResourceUsageHistory(
    serverId: string,
    hours: number = 24
  ) {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const [cpu, memory, disk] = await Promise.all([
      this.getMetricsTimeSeries(serverId, 'cpuUsage', startTime, endTime, 300),
      this.getMetricsTimeSeries(serverId, 'memoryUsed', startTime, endTime, 300),
      this.getMetricsTimeSeries(serverId, 'diskUsed', startTime, endTime, 300)
    ]);

    return { cpu, memory, disk };
  }

  async getPerformanceMetrics(
    serverId: string,
    hours: number = 24
  ): Promise<{ tps: TimeSeriesData[]; entities: TimeSeriesData[]; chunks: TimeSeriesData[] }> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

    const [tps, entities, chunks] = await Promise.all([
      this.getMetricsTimeSeries(serverId, 'tps', startTime, endTime, 300),
      this.getMetricsTimeSeries(serverId, 'entities', startTime, endTime, 300),
      this.getMetricsTimeSeries(serverId, 'loadedChunks', startTime, endTime, 300)
    ]);

    return { tps, entities, chunks };
  }

  // Bulk insert for performance
  async recordMultipleMetrics(metrics: MetricData[]): Promise<void> {
    if (metrics.length === 0) return;

    const entities = metrics.map((data) =>
      this.repository.create({
        serverId: data.serverId,
        timestamp: new Date(),
        cpuUsage: data.cpuUsage || null,
        memoryUsed: data.memoryUsed || null,
        memoryTotal: data.memoryTotal || null,
        diskUsed: data.diskUsed || null,
        diskTotal: data.diskTotal || null,
        networkIn: data.networkIn || null,
        networkOut: data.networkOut || null,
        playerCount: data.playerCount || null,
        maxPlayers: data.maxPlayers || null,
        tps: data.tps || null,
        loadedChunks: data.loadedChunks || null,
        entities: data.entities || null,
        status: data.status || null
      })
    );

    await this.repository.save(entities);
  }
}

export const metricsService = new MetricsService();
