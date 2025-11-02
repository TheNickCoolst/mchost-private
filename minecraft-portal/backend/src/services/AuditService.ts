import { AppDataSource } from '../config/database';
import { AuditLog, AuditAction, AuditSeverity } from '../models/AuditLog';

interface AuditLogOptions {
  action: AuditAction;
  userId?: string;
  resourceType?: string;
  resourceId?: string;
  description?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
}

class AuditService {
  private repository = AppDataSource.getRepository(AuditLog);

  async log(options: AuditLogOptions): Promise<void> {
    try {
      const auditLog = this.repository.create({
        action: options.action,
        severity: options.severity || AuditSeverity.INFO,
        userId: options.userId || null,
        resourceType: options.resourceType || null,
        resourceId: options.resourceId || null,
        description: options.description || null,
        metadata: options.metadata || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null
      });

      await this.repository.save(auditLog);
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  async getLogs(filters?: {
    userId?: string;
    action?: AuditAction;
    severity?: AuditSeverity;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user');

    if (filters?.userId) {
      queryBuilder.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters?.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }

    if (filters?.severity) {
      queryBuilder.andWhere('log.severity = :severity', { severity: filters.severity });
    }

    if (filters?.resourceType) {
      queryBuilder.andWhere('log.resourceType = :resourceType', {
        resourceType: filters.resourceType
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', {
        startDate: filters.startDate
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', {
        endDate: filters.endDate
      });
    }

    queryBuilder.orderBy('log.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const logs = await queryBuilder.getMany();

    return { logs, total };
  }

  async deleteOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  async getLogsByResource(
    resourceType: string,
    resourceId: string
  ): Promise<AuditLog[]> {
    return this.repository.find({
      where: {
        resourceType,
        resourceId
      },
      order: {
        createdAt: 'DESC'
      },
      relations: ['user'],
      take: 50
    });
  }

  async getUserActivity(
    userId: string,
    limit: number = 50
  ): Promise<AuditLog[]> {
    return this.repository.find({
      where: {
        userId
      },
      order: {
        createdAt: 'DESC'
      },
      take: limit
    });
  }
}

export const auditService = new AuditService();
