import { AppDataSource } from '../config/database';
import { Notification, NotificationType, NotificationCategory } from '../models/Notification';
import { io } from '../index';

interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

class NotificationService {
  private repository = AppDataSource.getRepository(Notification);

  async create(options: CreateNotificationOptions): Promise<Notification> {
    const notification = this.repository.create({
      userId: options.userId,
      type: options.type,
      category: options.category,
      title: options.title,
      message: options.message,
      actionUrl: options.actionUrl || null,
      actionLabel: options.actionLabel || null,
      metadata: options.metadata || null,
      isRead: false,
      readAt: null
    });

    await this.repository.save(notification);

    // Emit real-time notification via WebSocket
    io.to(`user-${options.userId}`).emit('notification', notification);

    return notification;
  }

  async getForUser(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      category?: NotificationCategory;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const queryBuilder = this.repository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (options?.unreadOnly) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: false });
    }

    if (options?.category) {
      queryBuilder.andWhere('notification.category = :category', {
        category: options.category
      });
    }

    queryBuilder.orderBy('notification.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    const notifications = await queryBuilder.getMany();

    // Get unread count
    const unreadCount = await this.repository.count({
      where: {
        userId,
        isRead: false
      }
    });

    return { notifications, total, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    const notification = await this.repository.findOne({
      where: { id: notificationId, userId }
    });

    if (!notification) {
      return false;
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await this.repository.save(notification);

    return true;
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true, readAt: new Date() })
      .where('userId = :userId AND isRead = :isRead', { userId, isRead: false })
      .execute();

    return result.affected || 0;
  }

  async delete(notificationId: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({
      id: notificationId,
      userId
    });

    return (result.affected || 0) > 0;
  }

  async deleteAll(userId: string): Promise<number> {
    const result = await this.repository.delete({ userId });
    return result.affected || 0;
  }

  async deleteOld(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.repository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate AND isRead = :isRead', {
        cutoffDate,
        isRead: true
      })
      .execute();

    return result.affected || 0;
  }

  // Helper methods for common notifications

  async notifyServerStarted(userId: string, serverName: string, serverId: string) {
    return this.create({
      userId,
      type: NotificationType.SUCCESS,
      category: NotificationCategory.SERVER,
      title: 'Server Started',
      message: `Your server "${serverName}" has been started successfully.`,
      actionUrl: `/servers/${serverId}`,
      actionLabel: 'View Server',
      metadata: { serverId, serverName }
    });
  }

  async notifyServerStopped(userId: string, serverName: string, serverId: string) {
    return this.create({
      userId,
      type: NotificationType.INFO,
      category: NotificationCategory.SERVER,
      title: 'Server Stopped',
      message: `Your server "${serverName}" has been stopped.`,
      actionUrl: `/servers/${serverId}`,
      actionLabel: 'View Server',
      metadata: { serverId, serverName }
    });
  }

  async notifyServerError(userId: string, serverName: string, serverId: string, error: string) {
    return this.create({
      userId,
      type: NotificationType.ERROR,
      category: NotificationCategory.SERVER,
      title: 'Server Error',
      message: `Your server "${serverName}" encountered an error: ${error}`,
      actionUrl: `/servers/${serverId}`,
      actionLabel: 'Check Server',
      metadata: { serverId, serverName, error }
    });
  }

  async notifyBackupCompleted(userId: string, serverName: string, serverId: string) {
    return this.create({
      userId,
      type: NotificationType.SUCCESS,
      category: NotificationCategory.BACKUP,
      title: 'Backup Completed',
      message: `Backup of "${serverName}" completed successfully.`,
      actionUrl: `/servers/${serverId}/backups`,
      actionLabel: 'View Backups',
      metadata: { serverId, serverName }
    });
  }

  async notifyBackupFailed(userId: string, serverName: string, serverId: string, error: string) {
    return this.create({
      userId,
      type: NotificationType.ERROR,
      category: NotificationCategory.BACKUP,
      title: 'Backup Failed',
      message: `Backup of "${serverName}" failed: ${error}`,
      actionUrl: `/servers/${serverId}`,
      actionLabel: 'View Server',
      metadata: { serverId, serverName, error }
    });
  }

  async notifySubscriptionExpiring(userId: string, daysRemaining: number) {
    return this.create({
      userId,
      type: NotificationType.WARNING,
      category: NotificationCategory.SUBSCRIPTION,
      title: 'Subscription Expiring Soon',
      message: `Your subscription will expire in ${daysRemaining} days.`,
      actionUrl: '/subscription',
      actionLabel: 'Manage Subscription',
      metadata: { daysRemaining }
    });
  }

  async notifySubscriptionExpired(userId: string) {
    return this.create({
      userId,
      type: NotificationType.ERROR,
      category: NotificationCategory.SUBSCRIPTION,
      title: 'Subscription Expired',
      message: 'Your subscription has expired. Renew now to continue using your servers.',
      actionUrl: '/subscription',
      actionLabel: 'Renew Now',
      metadata: {}
    });
  }

  async notifyResourceLimitWarning(
    userId: string,
    resourceType: string,
    usage: number
  ) {
    return this.create({
      userId,
      type: NotificationType.WARNING,
      category: NotificationCategory.SYSTEM,
      title: 'Resource Limit Warning',
      message: `You are using ${usage}% of your ${resourceType} limit.`,
      actionUrl: '/subscription',
      actionLabel: 'Upgrade Plan',
      metadata: { resourceType, usage }
    });
  }

  async notifySecurityAlert(userId: string, message: string) {
    return this.create({
      userId,
      type: NotificationType.ERROR,
      category: NotificationCategory.SECURITY,
      title: 'Security Alert',
      message,
      actionUrl: '/account/security',
      actionLabel: 'Review Security',
      metadata: {}
    });
  }
}

export const notificationService = new NotificationService();
