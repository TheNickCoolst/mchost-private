import nodemailer from 'nodemailer';
import { User } from '../models/User';

export enum EmailTemplate {
  WELCOME = 'welcome',
  SERVER_STARTED = 'server_started',
  SERVER_STOPPED = 'server_stopped',
  SERVER_ERROR = 'server_error',
  BACKUP_COMPLETED = 'backup_completed',
  BACKUP_FAILED = 'backup_failed',
  SUBSCRIPTION_EXPIRING = 'subscription_expiring',
  SUBSCRIPTION_EXPIRED = 'subscription_expired',
  RESOURCE_LIMIT_WARNING = 'resource_limit_warning',
  PASSWORD_RESET = 'password_reset',
  SECURITY_ALERT = 'security_alert'
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isEnabled: boolean = false;

  async initialize() {
    try {
      const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      };

      if (!config.auth.user || !config.auth.pass) {
        console.warn('SMTP credentials not configured, email service disabled');
        this.isEnabled = false;
        return;
      }

      this.transporter = nodemailer.createTransport(config);

      await this.transporter.verify();
      this.isEnabled = true;
      console.log('Email Service initialized successfully');
    } catch (error) {
      console.warn('Email service not available:', error);
      this.isEnabled = false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isEnabled || !this.transporter) {
      console.log('Email service not enabled, skipping email');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@mchost.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });

      console.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTemplateEmail(
    user: User,
    template: EmailTemplate,
    data: Record<string, any>
  ): Promise<boolean> {
    const emailContent = this.getTemplate(template, data);

    return this.sendEmail({
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
  }

  private getTemplate(template: EmailTemplate, data: Record<string, any>) {
    const baseUrl = process.env.FRONTEND_URL || 'https://mchost.com';

    switch (template) {
      case EmailTemplate.WELCOME:
        return {
          subject: 'Welcome to Minecraft Hosting Platform!',
          html: `
            <h1>Welcome, ${data.username}!</h1>
            <p>Thank you for joining our Minecraft hosting platform.</p>
            <p>You can now create and manage your Minecraft servers with ease.</p>
            <a href="${baseUrl}/dashboard">Go to Dashboard</a>
          `,
          text: `Welcome ${data.username}! Thank you for joining our platform.`
        };

      case EmailTemplate.SERVER_STARTED:
        return {
          subject: `Server "${data.serverName}" Started`,
          html: `
            <h2>Server Started Successfully</h2>
            <p>Your server <strong>${data.serverName}</strong> has been started.</p>
            <p>Server IP: ${data.serverIp}:${data.serverPort}</p>
            <a href="${baseUrl}/servers/${data.serverId}">View Server</a>
          `,
          text: `Server ${data.serverName} started successfully.`
        };

      case EmailTemplate.SERVER_STOPPED:
        return {
          subject: `Server "${data.serverName}" Stopped`,
          html: `
            <h2>Server Stopped</h2>
            <p>Your server <strong>${data.serverName}</strong> has been stopped.</p>
            <a href="${baseUrl}/servers/${data.serverId}">View Server</a>
          `,
          text: `Server ${data.serverName} stopped.`
        };

      case EmailTemplate.SERVER_ERROR:
        return {
          subject: `Server Error: "${data.serverName}"`,
          html: `
            <h2>Server Error Detected</h2>
            <p>Your server <strong>${data.serverName}</strong> encountered an error.</p>
            <p>Error: ${data.error}</p>
            <a href="${baseUrl}/servers/${data.serverId}">Check Server</a>
          `,
          text: `Server ${data.serverName} error: ${data.error}`
        };

      case EmailTemplate.BACKUP_COMPLETED:
        return {
          subject: `Backup Completed: "${data.serverName}"`,
          html: `
            <h2>Backup Completed Successfully</h2>
            <p>A backup of <strong>${data.serverName}</strong> has been created.</p>
            <p>Backup size: ${data.backupSize}</p>
            <p>Backup time: ${data.backupTime}</p>
            <a href="${baseUrl}/servers/${data.serverId}">View Backups</a>
          `,
          text: `Backup of ${data.serverName} completed successfully.`
        };

      case EmailTemplate.BACKUP_FAILED:
        return {
          subject: `Backup Failed: "${data.serverName}"`,
          html: `
            <h2>Backup Failed</h2>
            <p>Failed to create backup for <strong>${data.serverName}</strong>.</p>
            <p>Error: ${data.error}</p>
            <a href="${baseUrl}/servers/${data.serverId}">View Server</a>
          `,
          text: `Backup failed for ${data.serverName}: ${data.error}`
        };

      case EmailTemplate.SUBSCRIPTION_EXPIRING:
        return {
          subject: 'Your Subscription is Expiring Soon',
          html: `
            <h2>Subscription Expiring</h2>
            <p>Your ${data.planName} subscription will expire in ${data.daysRemaining} days.</p>
            <p>Renew now to avoid service interruption.</p>
            <a href="${baseUrl}/subscription">Manage Subscription</a>
          `,
          text: `Your subscription expires in ${data.daysRemaining} days.`
        };

      case EmailTemplate.SUBSCRIPTION_EXPIRED:
        return {
          subject: 'Your Subscription Has Expired',
          html: `
            <h2>Subscription Expired</h2>
            <p>Your ${data.planName} subscription has expired.</p>
            <p>Your servers have been stopped. Renew to continue.</p>
            <a href="${baseUrl}/subscription">Renew Subscription</a>
          `,
          text: `Your subscription has expired. Renew to continue.`
        };

      case EmailTemplate.RESOURCE_LIMIT_WARNING:
        return {
          subject: 'Resource Limit Warning',
          html: `
            <h2>Resource Limit Warning</h2>
            <p>You are approaching your resource limits:</p>
            <ul>
              <li>RAM Usage: ${data.ramUsage}%</li>
              <li>Disk Usage: ${data.diskUsage}%</li>
              <li>CPU Usage: ${data.cpuUsage}%</li>
            </ul>
            <p>Consider upgrading your plan for more resources.</p>
            <a href="${baseUrl}/subscription">Upgrade Plan</a>
          `,
          text: `Resource limit warning: RAM ${data.ramUsage}%, Disk ${data.diskUsage}%`
        };

      case EmailTemplate.SECURITY_ALERT:
        return {
          subject: 'Security Alert - Unusual Activity Detected',
          html: `
            <h2>Security Alert</h2>
            <p>Unusual activity detected on your account:</p>
            <p>${data.alertMessage}</p>
            <p>If this wasn't you, please secure your account immediately.</p>
            <a href="${baseUrl}/account/security">Review Security</a>
          `,
          text: `Security alert: ${data.alertMessage}`
        };

      default:
        return {
          subject: 'Notification from Minecraft Hosting',
          html: `<p>${data.message}</p>`,
          text: data.message
        };
    }
  }

  isAvailable(): boolean {
    return this.isEnabled;
  }
}

export const emailService = new EmailService();
