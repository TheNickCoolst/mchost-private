import { AppDataSource } from '../config/database';
import { ServerInstance } from '../models/ServerInstance';

export class PortService {
  private static readonly PORT_RANGE_START = 25566;
  private static readonly PORT_RANGE_END = 30000;
  private static readonly RESERVED_PORTS = [25565]; // Minecraft default port to avoid

  static async getNextAvailablePort(): Promise<number> {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    
    // Get all used ports
    const usedPorts = await serverRepository
      .createQueryBuilder('server')
      .select('server.port')
      .getRawMany();
    
    const usedPortNumbers = usedPorts.map(p => p.server_port);
    
    // Find the next available port
    for (let port = this.PORT_RANGE_START; port <= this.PORT_RANGE_END; port++) {
      if (!usedPortNumbers.includes(port) && !this.RESERVED_PORTS.includes(port)) {
        return port;
      }
    }
    
    throw new Error('No available ports in range');
  }

  static async isPortAvailable(port: number): Promise<boolean> {
    // Check if port is in reserved range
    if (this.RESERVED_PORTS.includes(port)) {
      return false;
    }
    
    // Check if port is already used
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const existingServer = await serverRepository.findOne({ where: { port } });
    
    return !existingServer;
  }

  static async reservePort(serverId: string, port: number): Promise<void> {
    const isAvailable = await this.isPortAvailable(port);
    if (!isAvailable) {
      throw new Error(`Port ${port} is not available`);
    }
    
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    await serverRepository.update(serverId, { port });
  }
}