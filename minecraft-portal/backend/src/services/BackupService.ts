import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AppDataSource } from '../config/database';
import { ServerInstance } from '../models/ServerInstance';
import { WingsService } from './WingsService';
import { LogEntry, LogLevel } from '../models/LogEntry';

const execAsync = promisify(exec);

export interface BackupMetadata {
  id: string;
  serverId: string;
  serverName: string;
  type: 'manual' | 'automatic' | 'scheduled';
  size: number;
  createdAt: Date;
  createdBy: string;
  description?: string;
  files: string[];
  compression: 'gzip' | 'lz4' | 'none';
}

export interface BackupConfig {
  maxBackups: number;
  retentionDays: number;
  compressionLevel: number;
  includeDatabase: boolean;
  excludePatterns: string[];
  schedule?: string; // Cron expression
}

export class BackupService {
  private wingsService: WingsService;
  private backupPath: string;

  constructor() {
    this.wingsService = new WingsService();
    this.backupPath = process.env.BACKUP_PATH || '/var/backups/minecraft-portal';
  }

  async createServerBackup(
    serverId: string, 
    userId: string, 
    type: 'manual' | 'automatic' | 'scheduled' = 'manual',
    description?: string
  ): Promise<BackupMetadata> {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const logRepository = AppDataSource.getRepository(LogEntry);
    
    const server = await serverRepository.findOne({ where: { id: serverId } });
    if (!server) {
      throw new Error('Server not found');
    }

    const backupId = `${serverId}_${Date.now()}`;
    const backupDir = path.join(this.backupPath, serverId);
    const backupFile = path.join(backupDir, `${backupId}.tar.gz`);

    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true });

      // Create backup metadata
      const metadata: BackupMetadata = {
        id: backupId,
        serverId,
        serverName: server.name,
        type,
        size: 0,
        createdAt: new Date(),
        createdBy: userId,
        description,
        files: [],
        compression: 'gzip'
      };

      // Log backup start
      await logRepository.save({
        serverId,
        message: `Backup started: ${backupId}`,
        level: LogLevel.INFO,
        source: 'backup-service'
      });

      // Stop server if running
      const wasRunning = server.status === 'running';
      if (wasRunning) {
        await this.wingsService.performAction(server.wingsUuid!, 'stop');
        await this.waitForServerStatus(server.wingsUuid!, 'stopped', 30000);
      }

      // Get server files from Wings
      const serverFiles = await this.getServerFiles(server.wingsUuid!);
      metadata.files = serverFiles;

      // Create backup archive
      await this.createBackupArchive(server.wingsUuid!, backupFile, serverFiles);

      // Get backup size
      const stats = await fs.stat(backupFile);
      metadata.size = stats.size;

      // Save backup metadata
      await this.saveBackupMetadata(metadata);

      // Restart server if it was running
      if (wasRunning) {
        await this.wingsService.performAction(server.wingsUuid!, 'start');
      }

      // Log backup completion
      await logRepository.save({
        serverId,
        message: `Backup completed: ${backupId} (${this.formatBytes(metadata.size)})`,
        level: LogLevel.INFO,
        source: 'backup-service'
      });

      // Clean up old backups
      await this.cleanupOldBackups(serverId);

      return metadata;
    } catch (error) {
      // Log backup failure
      await logRepository.save({
        serverId,
        message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        level: LogLevel.ERROR,
        source: 'backup-service'
      });

      throw error;
    }
  }

  async restoreServerBackup(serverId: string, backupId: string, userId: string): Promise<void> {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const logRepository = AppDataSource.getRepository(LogEntry);
    
    const server = await serverRepository.findOne({ where: { id: serverId } });
    if (!server) {
      throw new Error('Server not found');
    }

    const metadata = await this.getBackupMetadata(backupId);
    if (!metadata || metadata.serverId !== serverId) {
      throw new Error('Backup not found');
    }

    const backupFile = path.join(this.backupPath, serverId, `${backupId}.tar.gz`);

    try {
      // Verify backup file exists
      await fs.access(backupFile);

      // Log restore start
      await logRepository.save({
        serverId,
        message: `Restore started: ${backupId}`,
        level: LogLevel.INFO,
        source: 'backup-service'
      });

      // Stop server
      if (server.status === 'running') {
        await this.wingsService.performAction(server.wingsUuid!, 'stop');
        await this.waitForServerStatus(server.wingsUuid!, 'stopped', 30000);
      }

      // Clear existing server files
      await this.clearServerFiles(server.wingsUuid!);

      // Extract backup
      await this.extractBackupArchive(server.wingsUuid!, backupFile);

      // Log restore completion
      await logRepository.save({
        serverId,
        message: `Restore completed: ${backupId}`,
        level: LogLevel.INFO,
        source: 'backup-service'
      });

    } catch (error) {
      // Log restore failure
      await logRepository.save({
        serverId,
        message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        level: LogLevel.ERROR,
        source: 'backup-service'
      });

      throw error;
    }
  }

  async getServerBackups(serverId: string): Promise<BackupMetadata[]> {
    const backupDir = path.join(this.backupPath, serverId);
    
    try {
      const files = await fs.readdir(backupDir);
      const backups: BackupMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const metadataPath = path.join(backupDir, file);
          const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
          backups.push(metadata);
        }
      }

      return backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return [];
    }
  }

  async deleteBackup(serverId: string, backupId: string): Promise<void> {
    const backupDir = path.join(this.backupPath, serverId);
    const backupFile = path.join(backupDir, `${backupId}.tar.gz`);
    const metadataFile = path.join(backupDir, `${backupId}.json`);

    try {
      await fs.unlink(backupFile);
      await fs.unlink(metadataFile);
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error('Failed to delete backup');
    }
  }

  async createDatabaseBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupPath, 'database', `db_backup_${timestamp}.sql`);
    
    await fs.mkdir(path.dirname(backupFile), { recursive: true });

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(dbUrl);
    const command = `PGPASSWORD="${url.password}" pg_dump -h ${url.hostname} -p ${url.port} -U ${url.username} -d ${url.pathname.slice(1)} > ${backupFile}`;

    await execAsync(command);
    return backupFile;
  }

  async restoreDatabaseBackup(backupFile: string): Promise<void> {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not configured');
    }

    const url = new URL(dbUrl);
    const command = `PGPASSWORD="${url.password}" psql -h ${url.hostname} -p ${url.port} -U ${url.username} -d ${url.pathname.slice(1)} < ${backupFile}`;

    await execAsync(command);
  }

  private async getServerFiles(serverUuid: string): Promise<string[]> {
    try {
      const files = await this.wingsService.getServerFiles(serverUuid, '/');
      return this.flattenFileList(files);
    } catch (error) {
      console.error('Error getting server files:', error);
      return [];
    }
  }

  private flattenFileList(files: any[], basePath: string = ''): string[] {
    const result: string[] = [];
    
    for (const file of files) {
      const fullPath = path.join(basePath, file.name);
      result.push(fullPath);
      
      if (file.is_directory && file.children) {
        result.push(...this.flattenFileList(file.children, fullPath));
      }
    }
    
    return result;
  }

  private async createBackupArchive(serverUuid: string, backupFile: string, files: string[]): Promise<void> {
    // In a real implementation, you would download files from Wings and create archive
    // This is a placeholder that would use Wings file API
    const command = `tar -czf ${backupFile} -C /tmp/server_${serverUuid} .`;
    await execAsync(command);
  }

  private async extractBackupArchive(serverUuid: string, backupFile: string): Promise<void> {
    // In a real implementation, you would extract and upload files to Wings
    // This is a placeholder that would use Wings file API
    const extractDir = `/tmp/restore_${serverUuid}`;
    await fs.mkdir(extractDir, { recursive: true });
    
    const command = `tar -xzf ${backupFile} -C ${extractDir}`;
    await execAsync(command);
  }

  private async clearServerFiles(serverUuid: string): Promise<void> {
    // Clear server files through Wings API
    try {
      const files = await this.wingsService.getServerFiles(serverUuid, '/');
      // Implementation would delete files through Wings API
    } catch (error) {
      console.error('Error clearing server files:', error);
    }
  }

  private async waitForServerStatus(serverUuid: string, targetStatus: string, timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const status = await this.wingsService.getServerStatus(serverUuid);
        if (status === targetStatus) {
          return;
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Timeout waiting for server status: ${targetStatus}`);
  }

  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    const backupDir = path.join(this.backupPath, metadata.serverId);
    const metadataFile = path.join(backupDir, `${metadata.id}.json`);
    
    await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
  }

  private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      // Find backup metadata file across all server directories
      const serverDirs = await fs.readdir(this.backupPath);
      
      for (const serverDir of serverDirs) {
        const metadataFile = path.join(this.backupPath, serverDir, `${backupId}.json`);
        
        try {
          const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf-8'));
          return metadata;
        } catch {
          continue;
        }
      }
      
      return null;
    } catch {
      return null;
    }
  }

  private async cleanupOldBackups(serverId: string): Promise<void> {
    const config: BackupConfig = {
      maxBackups: parseInt(process.env.MAX_BACKUPS || '10'),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      compressionLevel: 6,
      includeDatabase: true,
      excludePatterns: []
    };

    const backups = await this.getServerBackups(serverId);
    
    // Remove backups older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retentionDays);
    
    const oldBackups = backups.filter(backup => new Date(backup.createdAt) < cutoffDate);
    
    for (const backup of oldBackups) {
      await this.deleteBackup(serverId, backup.id);
    }

    // Keep only max number of backups
    const recentBackups = backups
      .filter(backup => new Date(backup.createdAt) >= cutoffDate)
      .slice(config.maxBackups);
    
    for (const backup of recentBackups) {
      await this.deleteBackup(serverId, backup.id);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}