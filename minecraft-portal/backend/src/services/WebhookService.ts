import { AppDataSource } from '../config/database';
import { Webhook, WebhookEvent } from '../models/Webhook';
import axios from 'axios';
import crypto from 'crypto';

interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

class WebhookService {
  private repository = AppDataSource.getRepository(Webhook);
  private queue: Array<{ webhook: Webhook; payload: WebhookPayload }> = [];
  private isProcessing = false;

  constructor() {
    // Start processing queue
    this.processQueue();
  }

  async trigger(event: WebhookEvent, userId: string, data: any): Promise<void> {
    try {
      const webhooks = await this.repository.find({
        where: { userId, isActive: true }
      });

      const matchingWebhooks = webhooks.filter((w) => w.events.includes(event));

      if (matchingWebhooks.length === 0) {
        return;
      }

      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        data
      };

      // Add to queue for async processing
      for (const webhook of matchingWebhooks) {
        this.queue.push({ webhook, payload });
      }
    } catch (error) {
      console.error('Error triggering webhooks:', error);
    }
  }

  private async processQueue() {
    setInterval(async () => {
      if (this.isProcessing || this.queue.length === 0) {
        return;
      }

      this.isProcessing = true;

      try {
        const batch = this.queue.splice(0, 10); // Process 10 at a time

        await Promise.all(
          batch.map(({ webhook, payload }) => this.sendWebhook(webhook, payload))
        );
      } catch (error) {
        console.error('Error processing webhook queue:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 1000); // Process every second
  }

  private async sendWebhook(webhook: Webhook, payload: WebhookPayload): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'MinecraftHosting-Webhook/1.0',
        ...webhook.headers
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = this.generateSignature(payload, webhook.secret);
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => status >= 200 && status < 300
      });

      // Update success metrics
      await this.repository.update(webhook.id, {
        successCount: () => 'successCount + 1',
        lastTriggeredAt: new Date(),
        lastError: null
      });

      console.log(`Webhook ${webhook.id} triggered successfully`);
    } catch (error: any) {
      console.error(`Webhook ${webhook.id} failed:`, error.message);

      // Update failure metrics
      await this.repository.update(webhook.id, {
        failureCount: () => 'failureCount + 1',
        lastTriggeredAt: new Date(),
        lastError: error.message
      });

      // Disable webhook if too many failures
      const updated = await this.repository.findOne({ where: { id: webhook.id } });
      if (updated && updated.failureCount > 10) {
        await this.repository.update(webhook.id, { isActive: false });
        console.warn(`Webhook ${webhook.id} disabled due to excessive failures`);
      }
    }
  }

  private generateSignature(payload: WebhookPayload, secret: string): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  async create(
    userId: string,
    data: {
      url: string;
      name?: string;
      description?: string;
      events: WebhookEvent[];
      secret?: string;
      headers?: Record<string, string>;
    }
  ): Promise<Webhook> {
    const webhook = this.repository.create({
      userId,
      url: data.url,
      name: data.name || null,
      description: data.description || null,
      events: data.events,
      secret: data.secret || null,
      headers: data.headers || null,
      isActive: true,
      successCount: 0,
      failureCount: 0
    });

    return this.repository.save(webhook);
  }

  async update(id: string, userId: string, data: Partial<Webhook>): Promise<Webhook | null> {
    const webhook = await this.repository.findOne({ where: { id, userId } });

    if (!webhook) {
      return null;
    }

    Object.assign(webhook, data);
    return this.repository.save(webhook);
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected || 0) > 0;
  }

  async getByUser(userId: string): Promise<Webhook[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async testWebhook(id: string, userId: string): Promise<boolean> {
    const webhook = await this.repository.findOne({ where: { id, userId } });

    if (!webhook) {
      return false;
    }

    const testPayload: WebhookPayload = {
      event: WebhookEvent.SERVER_STARTED,
      timestamp: new Date().toISOString(),
      data: {
        test: true,
        message: 'This is a test webhook'
      }
    };

    await this.sendWebhook(webhook, testPayload);
    return true;
  }

  // Helper methods for common events
  async triggerServerStarted(userId: string, serverId: string, serverName: string) {
    await this.trigger(WebhookEvent.SERVER_STARTED, userId, {
      serverId,
      serverName,
      status: 'running'
    });
  }

  async triggerServerStopped(userId: string, serverId: string, serverName: string) {
    await this.trigger(WebhookEvent.SERVER_STOPPED, userId, {
      serverId,
      serverName,
      status: 'stopped'
    });
  }

  async triggerServerError(
    userId: string,
    serverId: string,
    serverName: string,
    error: string
  ) {
    await this.trigger(WebhookEvent.SERVER_ERROR, userId, {
      serverId,
      serverName,
      error
    });
  }

  async triggerBackupCompleted(userId: string, serverId: string, serverName: string) {
    await this.trigger(WebhookEvent.BACKUP_COMPLETED, userId, {
      serverId,
      serverName,
      timestamp: new Date().toISOString()
    });
  }

  async triggerPlayerJoined(
    userId: string,
    serverId: string,
    playerName: string,
    playerUuid: string
  ) {
    await this.trigger(WebhookEvent.PLAYER_JOINED, userId, {
      serverId,
      playerName,
      playerUuid
    });
  }
}

export const webhookService = new WebhookService();
