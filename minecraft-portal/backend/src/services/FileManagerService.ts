import axios from 'axios';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  modifiedAt: string;
  permissions?: string;
}

export interface FileContent {
  content: string;
  encoding: string;
}

class FileManagerService {
  private wingsUrl: string;
  private apiKey: string;

  constructor() {
    this.wingsUrl = process.env.WINGS_URL || 'http://localhost:8080';
    this.apiKey = process.env.WINGS_API_KEY || '';
  }

  private getHeaders(serverId: string) {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  async listFiles(serverId: string, path: string = '/'): Promise<FileInfo[]> {
    try {
      const response = await axios.get(
        `${this.wingsUrl}/api/servers/${serverId}/files/list`,
        {
          headers: this.getHeaders(serverId),
          params: { directory: path }
        }
      );

      return response.data.map((file: any) => ({
        name: file.name,
        path: file.path || `${path}/${file.name}`,
        size: file.size || 0,
        isDirectory: file.is_directory || file.mode?.startsWith('d') || false,
        modifiedAt: file.modified_at || file.modifiedAt || new Date().toISOString(),
        permissions: file.mode || file.permissions
      }));
    } catch (error: any) {
      console.error('Error listing files:', error.response?.data || error.message);
      throw new Error('Failed to list files');
    }
  }

  async readFile(serverId: string, filePath: string): Promise<FileContent> {
    try {
      const response = await axios.get(
        `${this.wingsUrl}/api/servers/${serverId}/files/contents`,
        {
          headers: this.getHeaders(serverId),
          params: { file: filePath }
        }
      );

      return {
        content: response.data,
        encoding: 'utf-8'
      };
    } catch (error: any) {
      console.error('Error reading file:', error.response?.data || error.message);
      throw new Error('Failed to read file');
    }
  }

  async writeFile(
    serverId: string,
    filePath: string,
    content: string
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/write`,
        content,
        {
          headers: {
            ...this.getHeaders(serverId),
            'Content-Type': 'text/plain'
          },
          params: { file: filePath }
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error writing file:', error.response?.data || error.message);
      throw new Error('Failed to write file');
    }
  }

  async createDirectory(serverId: string, path: string, name: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/create-directory`,
        {
          name: name,
          path: path
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error creating directory:', error.response?.data || error.message);
      throw new Error('Failed to create directory');
    }
  }

  async deleteFile(serverId: string, filePath: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/delete`,
        {
          root: '/',
          files: [filePath]
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error deleting file:', error.response?.data || error.message);
      throw new Error('Failed to delete file');
    }
  }

  async renameFile(
    serverId: string,
    oldPath: string,
    newPath: string
  ): Promise<boolean> {
    try {
      await axios.put(
        `${this.wingsUrl}/api/servers/${serverId}/files/rename`,
        {
          root: '/',
          files: [
            {
              from: oldPath,
              to: newPath
            }
          ]
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error renaming file:', error.response?.data || error.message);
      throw new Error('Failed to rename file');
    }
  }

  async copyFile(
    serverId: string,
    sourcePath: string,
    destinationPath: string
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/copy`,
        {
          location: sourcePath
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error copying file:', error.response?.data || error.message);
      throw new Error('Failed to copy file');
    }
  }

  async compressFiles(
    serverId: string,
    files: string[],
    archiveName: string
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/compress`,
        {
          root: '/',
          files: files
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error compressing files:', error.response?.data || error.message);
      throw new Error('Failed to compress files');
    }
  }

  async decompressFile(serverId: string, filePath: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/decompress`,
        {
          root: '/',
          file: filePath
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error decompressing file:', error.response?.data || error.message);
      throw new Error('Failed to decompress file');
    }
  }

  async uploadFile(
    serverId: string,
    path: string,
    fileData: Buffer,
    fileName: string
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('files', new Blob([fileData]), fileName);

      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/upload`,
        formData,
        {
          headers: {
            ...this.getHeaders(serverId),
            'Content-Type': 'multipart/form-data'
          },
          params: { directory: path }
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error uploading file:', error.response?.data || error.message);
      throw new Error('Failed to upload file');
    }
  }

  async downloadFile(serverId: string, filePath: string): Promise<Buffer> {
    try {
      const response = await axios.get(
        `${this.wingsUrl}/api/servers/${serverId}/files/download`,
        {
          headers: this.getHeaders(serverId),
          params: { file: filePath },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('Error downloading file:', error.response?.data || error.message);
      throw new Error('Failed to download file');
    }
  }

  async getFilePermissions(serverId: string, filePath: string): Promise<string> {
    try {
      const files = await this.listFiles(serverId, filePath);
      const file = files.find(f => f.path === filePath);
      return file?.permissions || '644';
    } catch (error) {
      throw new Error('Failed to get file permissions');
    }
  }

  async setFilePermissions(
    serverId: string,
    filePath: string,
    permissions: string
  ): Promise<boolean> {
    try {
      await axios.post(
        `${this.wingsUrl}/api/servers/${serverId}/files/chmod`,
        {
          root: '/',
          files: [
            {
              file: filePath,
              mode: permissions
            }
          ]
        },
        {
          headers: this.getHeaders(serverId)
        }
      );

      return true;
    } catch (error: any) {
      console.error('Error setting permissions:', error.response?.data || error.message);
      throw new Error('Failed to set file permissions');
    }
  }
}

export const fileManagerService = new FileManagerService();
