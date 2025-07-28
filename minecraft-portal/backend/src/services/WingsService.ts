import axios, { AxiosInstance } from 'axios';
import https from 'https';

export interface WingsServerAction {
  signal: 'start' | 'stop' | 'restart' | 'kill';
}

export interface WingsConsoleResponse {
  data: string[];
}

export interface WingsServerStats {
  memory_bytes: number;
  memory_limit_bytes: number;
  cpu_absolute: number;
  network: {
    rx_bytes: number;
    tx_bytes: number;
  };
  state: string;
}

export interface WingsBackup {
  id: string;
  name: string;
  description: string;
  size: number;
  createdAt: string;
}

export interface WingsWorldInfo {
  size: number;
  lastBackup: string | null;
  backups: WingsBackup[];
  files: string[];
}

export interface WingsPlayer {
  uuid: string;
  name: string;
  ip: string;
  joinedAt: string;
  ping: number;
  gamemode: string;
  health: number;
  food: number;
  level: number;
  location: {
    x: number;
    y: number;
    z: number;
    world: string;
  };
}

export interface WingsPlayerStats {
  uuid: string;
  name: string;
  firstJoin: string;
  lastSeen: string;
  playtime: number;
  deaths: number;
  kills: number;
  blocksPlaced: number;
  blocksBroken: number;
}

export interface WingsWhitelistEntry {
  uuid: string;
  name: string;
}

export interface WingsBanEntry {
  uuid: string;
  name: string;
  reason: string;
  bannedBy: string;
  bannedAt: string;
  expiresAt?: string;
}

export class WingsService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.WINGS_URL || 'https://localhost:8080';
    this.apiKey = process.env.WINGS_API_KEY || '';

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      })
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('Wings API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    );
  }

  async performAction(serverUuid: string, action: string): Promise<void> {
    try {
      const actionData: WingsServerAction = { signal: action as any };
      await this.client.post(`/api/servers/${serverUuid}/power`, actionData);
    } catch (error) {
      console.error(`Failed to ${action} server ${serverUuid}:`, error);
      throw new Error(`Wings daemon communication failed: ${action}`);
    }
  }

  async getServerStatus(serverUuid: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/resources`);
      const stats: WingsServerStats = response.data;
      return stats.state;
    } catch (error) {
      console.error(`Failed to get status for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: status check');
    }
  }

  async getServerStats(serverUuid: string): Promise<WingsServerStats> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/resources`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get stats for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: stats');
    }
  }

  async getConsole(serverUuid: string, lines: number = 100): Promise<string[]> {
    try {
      const response = await this.client.get(
        `/api/servers/${serverUuid}/logs?lines=${lines}`
      );
      const consoleData: WingsConsoleResponse = response.data;
      return consoleData.data || [];
    } catch (error) {
      console.error(`Failed to get console for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: console');
    }
  }

  async sendCommand(serverUuid: string, command: string): Promise<void> {
    try {
      await this.client.post(`/api/servers/${serverUuid}/command`, {
        command: command
      });
    } catch (error) {
      console.error(`Failed to send command to server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: command');
    }
  }

  async createServer(serverData: any): Promise<any> {
    try {
      const response = await this.client.post('/api/servers', serverData);
      return response.data;
    } catch (error) {
      console.error('Failed to create server:', error);
      throw new Error('Wings daemon communication failed: create server');
    }
  }

  async deleteServer(serverUuid: string): Promise<void> {
    try {
      await this.client.delete(`/api/servers/${serverUuid}`);
    } catch (error) {
      console.error(`Failed to delete server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: delete server');
    }
  }

  async installServer(serverUuid: string): Promise<void> {
    try {
      await this.client.post(`/api/servers/${serverUuid}/install`);
    } catch (error) {
      console.error(`Failed to install server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: install server');
    }
  }

  async getServerFiles(serverUuid: string, directory: string = '/'): Promise<any> {
    try {
      const response = await this.client.get(
        `/api/servers/${serverUuid}/files/list?directory=${encodeURIComponent(directory)}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get files for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: file list');
    }
  }

  async getFileContents(serverUuid: string, filePath: string): Promise<string> {
    try {
      const response = await this.client.get(
        `/api/servers/${serverUuid}/files/contents?file=${encodeURIComponent(filePath)}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get file contents for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: file contents');
    }
  }

  async writeFileContents(serverUuid: string, filePath: string, content: string): Promise<void> {
    try {
      await this.client.post(`/api/servers/${serverUuid}/files/write`, {
        file: filePath,
        content: content
      });
    } catch (error) {
      console.error(`Failed to write file for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: write file');
    }
  }

  // World management methods
  async getWorldInfo(serverUuid: string): Promise<WingsWorldInfo> {
    try {
      const [files, backups] = await Promise.all([
        this.getServerFiles(serverUuid, '/'),
        this.getBackups(serverUuid)
      ]);

      // Calculate world size (simplified - would need actual implementation)
      const worldSize = files.reduce((total: number, file: any) => {
        return total + (file.size || 0);
      }, 0);

      const lastBackup = backups.length > 0 
        ? backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt
        : null;

      return {
        size: worldSize,
        lastBackup,
        backups,
        files: files.map((f: any) => f.name)
      };
    } catch (error) {
      console.error(`Failed to get world info for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: world info');
    }
  }

  async createBackup(serverUuid: string, options: { name: string; description: string }): Promise<WingsBackup> {
    try {
      const response = await this.client.post(`/api/servers/${serverUuid}/backups`, {
        name: options.name,
        description: options.description
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to create backup for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: create backup');
    }
  }

  async getBackups(serverUuid: string): Promise<WingsBackup[]> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/backups`);
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to get backups for server ${serverUuid}:`, error);
      return []; // Return empty array if backups can't be retrieved
    }
  }

  async getBackupDownloadUrl(serverUuid: string, backupId: string): Promise<string> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/backups/${backupId}/download`);
      return response.data.download_url;
    } catch (error) {
      console.error(`Failed to get backup download URL for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: backup download');
    }
  }

  async restoreBackup(serverUuid: string, backupId: string): Promise<void> {
    try {
      await this.client.post(`/api/servers/${serverUuid}/backups/${backupId}/restore`);
    } catch (error) {
      console.error(`Failed to restore backup for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: restore backup');
    }
  }

  async deleteBackup(serverUuid: string, backupId: string): Promise<void> {
    try {
      await this.client.delete(`/api/servers/${serverUuid}/backups/${backupId}`);
    } catch (error) {
      console.error(`Failed to delete backup for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: delete backup');
    }
  }

  async resetWorld(serverUuid: string, options: {
    worldName: string;
    seed?: string;
    levelType: string;
    generateStructures: boolean;
  }): Promise<void> {
    try {
      // Delete existing world files
      await this.client.delete(`/api/servers/${serverUuid}/files/delete`, {
        data: { files: [options.worldName] }
      });

      // Update server.properties with new world settings
      const serverProperties = [
        `level-name=${options.worldName}`,
        `level-type=${options.levelType}`,
        `generate-structures=${options.generateStructures}`,
        ...(options.seed ? [`level-seed=${options.seed}`] : [])
      ].join('\n');

      await this.writeFileContents(serverUuid, 'server.properties', serverProperties);
    } catch (error) {
      console.error(`Failed to reset world for server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: reset world');
    }
  }

  // Player management methods
  async getOnlinePlayers(serverUuid: string): Promise<WingsPlayer[]> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/players/online`);
      return response.data.players || [];
    } catch (error) {
      console.error(`Failed to get online players for server ${serverUuid}:`, error);
      return []; // Return empty array if players can't be retrieved
    }
  }

  async getPlayerStats(serverUuid: string, playerName: string): Promise<WingsPlayerStats> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/players/${playerName}/stats`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get stats for player ${playerName} on server ${serverUuid}:`, error);
      throw new Error('Wings daemon communication failed: player stats');
    }
  }

  async getWhitelist(serverUuid: string): Promise<WingsWhitelistEntry[]> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/whitelist`);
      return response.data.players || [];
    } catch (error) {
      console.error(`Failed to get whitelist for server ${serverUuid}:`, error);
      return []; // Return empty array if whitelist can't be retrieved
    }
  }

  async getBanList(serverUuid: string): Promise<WingsBanEntry[]> {
    try {
      const response = await this.client.get(`/api/servers/${serverUuid}/bans`);
      return response.data.bans || [];
    } catch (error) {
      console.error(`Failed to get ban list for server ${serverUuid}:`, error);
      return []; // Return empty array if bans can't be retrieved
    }
  }
}