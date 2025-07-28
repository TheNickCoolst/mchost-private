import { Router } from 'express';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { ServerInstance, ServerStatus } from '../models/ServerInstance';
import { LogEntry, LogLevel } from '../models/LogEntry';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middlewares/auth';
import { WingsService } from '../services/WingsService';
import { PortService } from '../services/PortService';
import { io } from '../index';
import { getValidVersionIds, getValidServerTypeIds } from '../constants/minecraft';
import { Plugin } from '../models/Plugin';
import { transformServersForUser, transformServerForUser } from '../utils/serverTransforms';

const router = Router();
const wingsService = new WingsService();

const createServerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .required()
    .messages({
      'string.min': 'Server name must be at least 3 characters',
      'string.max': 'Server name must be less than 50 characters',
      'string.pattern.base': 'Server name can only contain letters, numbers, spaces, hyphens, and underscores'
    }),
  description: Joi.string().max(255).optional(),
  nest: Joi.string().valid('minecraft').required(),
  egg: Joi.string().valid(...getValidServerTypeIds()).required().messages({
    'any.only': 'Invalid server type. Please select a supported Minecraft server type.'
  }),
  resourceLimits: Joi.object({
    memory: Joi.number().positive().min(512).max(32768).required().messages({
      'number.min': 'Memory must be at least 512 MB',
      'number.max': 'Memory cannot exceed 32 GB'
    }),
    cpu: Joi.number().positive().min(25).max(400).required().messages({
      'number.min': 'CPU allocation must be at least 25%',
      'number.max': 'CPU allocation cannot exceed 400%'
    }),
    disk: Joi.number().positive().min(1024).max(102400).required().messages({
      'number.min': 'Disk space must be at least 1 GB',
      'number.max': 'Disk space cannot exceed 100 GB'
    }),
    swap: Joi.number().min(0).max(8192).required(),
    io: Joi.number().positive().min(100).max(1000).required()
  }).required(),
  envVars: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  port: Joi.number().min(25500).max(25600).optional().messages({
    'number.min': 'Port must be between 25500 and 25600 for security',
    'number.max': 'Port must be between 25500 and 25600 for security'
  }),
  gameVersion: Joi.string().valid(...getValidVersionIds()).required().messages({
    'any.only': 'Invalid Minecraft version. Please select a valid version from the dropdown.',
    'any.required': 'Minecraft version is required'
  })
});

const updateServerSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9\s\-_]+$/)
    .optional()
    .messages({
      'string.min': 'Server name must be at least 3 characters',
      'string.max': 'Server name must be less than 50 characters',
      'string.pattern.base': 'Server name can only contain letters, numbers, spaces, hyphens, and underscores'
    }),
  description: Joi.string().max(255).optional(),
  resourceLimits: Joi.object({
    memory: Joi.number().positive().min(512).max(32768).optional(),
    cpu: Joi.number().positive().min(25).max(400).optional(),
    disk: Joi.number().positive().min(1024).max(102400).optional(),
    swap: Joi.number().min(0).max(8192).optional(),
    io: Joi.number().positive().min(100).max(1000).optional()
  }).optional(),
  envVars: Joi.object().pattern(Joi.string(), Joi.string()).optional()
});

const actionSchema = Joi.object({
  action: Joi.string().valid('start', 'stop', 'restart', 'kill').required()
});

router.use(authenticateToken);

router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    
    const query = serverRepository.createQueryBuilder('server')
      .leftJoinAndSelect('server.owner', 'owner');

    if (req.user!.role === 'user') {
      query.where('server.ownerId = :userId', { userId: req.user!.id });
    }

    const servers = await query.getMany();

    res.json(transformServersForUser(servers));
  } catch (error) {
    console.error('Get servers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({
      where: { id: req.params.id },
      relations: ['owner']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(transformServerForUser(server));
  } catch (error) {
    console.error('Get server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = createServerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const serverRepository = AppDataSource.getRepository(ServerInstance);

    // Get next available port automatically
    const assignedPort = await PortService.getNextAvailablePort();

    const server = serverRepository.create({
      ...req.body,
      ownerId: req.user!.id,
      status: ServerStatus.STOPPED,
      port: assignedPort
    });

    await serverRepository.save(server);

    const serverWithOwner = await serverRepository.findOne({
      where: { id: (server as any).id },
      relations: ['owner']
    });

    res.status(201).json(transformServerForUser(serverWithOwner!));
  } catch (error) {
    console.error('Create server error:', error);
    if (error instanceof Error && error.message === 'No available ports in range') {
      return res.status(503).json({ error: 'No available ports. Please contact support.' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = updateServerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.id } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(server, req.body);
    await serverRepository.save(server);

    res.json(transformServerForUser(server));
  } catch (error) {
    console.error('Update server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.id } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    await serverRepository.remove(server);
    res.status(204).send();
  } catch (error) {
    console.error('Delete server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/action', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = actionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { action } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.id } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const result = await wingsService.performAction(server.wingsUuid!, action);
      
      let newStatus: ServerStatus;
      switch (action) {
        case 'start':
          newStatus = ServerStatus.STARTING;
          break;
        case 'stop':
        case 'kill':
          newStatus = ServerStatus.STOPPING;
          break;
        case 'restart':
          newStatus = ServerStatus.STARTING;
          break;
        default:
          newStatus = server.status;
      }

      server.status = newStatus;
      await serverRepository.save(server);

      io.to(`server-${server.id}`).emit('status-update', {
        serverId: server.id,
        status: newStatus
      });

      res.json({ message: `Server ${action} initiated`, status: newStatus });
    } catch (wingsError) {
      console.error('Wings action error:', wingsError);
      res.status(503).json({ error: 'Failed to communicate with server daemon' });
    }
  } catch (error) {
    console.error('Server action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/logs', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.id } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logRepository = AppDataSource.getRepository(LogEntry);
    const logs = await logRepository.find({
      where: { serverId: server.id },
      order: { timestamp: 'DESC' },
      take: parseInt(req.query.limit as string) || 100
    });

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/console', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.id } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const consoleData = await wingsService.getConsole(server.wingsUuid!);
      res.json(consoleData);
    } catch (wingsError) {
      console.error('Wings console error:', wingsError);
      res.status(503).json({ error: 'Failed to get console data' });
    }
  } catch (error) {
    console.error('Console error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Plugin management endpoints
const installPluginSchema = Joi.object({
  pluginId: Joi.string().required(),
  version: Joi.string().optional()
});

router.get('/:id/plugins', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({
      where: { id: req.params.id },
      relations: ['plugins']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(server.plugins || []);
  } catch (error) {
    console.error('Get server plugins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/plugins', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = installPluginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { pluginId, version } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const pluginRepository = AppDataSource.getRepository(Plugin);
    
    const server = await serverRepository.findOne({
      where: { id: req.params.id },
      relations: ['plugins']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const plugin = await pluginRepository.findOne({ where: { id: pluginId } });
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Check if plugin is already installed
    const alreadyInstalled = server.plugins?.some(p => p.id === pluginId);
    if (alreadyInstalled) {
      return res.status(400).json({ error: 'Plugin already installed' });
    }

    // Check version compatibility
    if (!plugin.supportedVersions?.includes(server.gameVersion)) {
      return res.status(400).json({ 
        error: `Plugin not compatible with Minecraft ${server.gameVersion}. Supported versions: ${plugin.supportedVersions?.join(', ') || 'Unknown'}` 
      });
    }

    // Add plugin to server
    if (!server.plugins) {
      server.plugins = [];
    }
    server.plugins.push(plugin);
    await serverRepository.save(server);

    res.status(201).json({ 
      message: 'Plugin installed successfully',
      plugin: {
        id: plugin.id,
        name: plugin.name,
        version: version || plugin.version,
        installedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Install plugin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id/plugins/:pluginId', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({
      where: { id: req.params.id },
      relations: ['plugins']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!server.plugins) {
      return res.status(404).json({ error: 'Plugin not installed' });
    }

    const pluginIndex = server.plugins.findIndex(p => p.id === req.params.pluginId);
    if (pluginIndex === -1) {
      return res.status(404).json({ error: 'Plugin not installed' });
    }

    server.plugins.splice(pluginIndex, 1);
    await serverRepository.save(server);

    res.json({ message: 'Plugin uninstalled successfully' });
  } catch (error) {
    console.error('Uninstall plugin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Server Properties validation schema
const serverPropertiesSchema = Joi.object({
  'level-name': Joi.string().required(),
  'level-seed': Joi.string().allow('').optional(),
  'level-type': Joi.string().valid('default', 'flat', 'largeBiomes', 'amplified', 'buffet').required(),
  'generate-structures': Joi.boolean().required(),
  'generator-settings': Joi.string().allow('').optional(),
  
  gamemode: Joi.string().valid('survival', 'creative', 'adventure', 'spectator').required(),
  difficulty: Joi.string().valid('peaceful', 'easy', 'normal', 'hard').required(),
  hardcore: Joi.boolean().required(),
  'max-players': Joi.number().min(1).max(100).required(),
  'white-list': Joi.boolean().required(),
  'enforce-whitelist': Joi.boolean().required(),
  
  motd: Joi.string().max(255).optional(),
  'server-port': Joi.number().min(1024).max(65535).required(),
  'max-world-size': Joi.number().min(1).max(29999984).required(),
  'view-distance': Joi.number().min(2).max(32).required(),
  'simulation-distance': Joi.number().min(3).max(32).required(),
  
  'online-mode': Joi.boolean().required(),
  'prevent-proxy-connections': Joi.boolean().required(),
  'enable-status': Joi.boolean().required(),
  'hide-online-players': Joi.boolean().required(),
  
  'spawn-protection': Joi.number().min(0).max(29999984).required(),
  'max-tick-time': Joi.number().min(-1).required(),
  'entity-broadcast-range-percentage': Joi.number().min(10).max(1000).required(),
  'sync-chunk-writes': Joi.boolean().required(),
});

// Get server properties
router.get('/:id/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({
      where: { id: req.params.id },
      relations: ['owner']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get current server properties from the server instance
    const serverProperties = server.serverProperties || {
      'level-name': 'world',
      'level-seed': '',
      'level-type': 'default',
      'generate-structures': true,
      'generator-settings': '',
      
      gamemode: 'survival',
      difficulty: 'normal',
      hardcore: false,
      'max-players': 20,
      'white-list': false,
      'enforce-whitelist': false,
      
      motd: 'A Minecraft Server',
      'server-port': server.port || 25565,
      'max-world-size': 29999984,
      'view-distance': 10,
      'simulation-distance': 10,
      
      'online-mode': true,
      'prevent-proxy-connections': false,
      'enable-status': true,
      'hide-online-players': false,
      
      'spawn-protection': 16,
      'max-tick-time': 60000,
      'entity-broadcast-range-percentage': 100,
      'sync-chunk-writes': true,
    };

    res.json(serverProperties);
  } catch (error) {
    console.error('Get server properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update server properties
router.put('/:id/properties', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = serverPropertiesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({
      where: { id: req.params.id },
      relations: ['owner']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update server properties
    server.serverProperties = req.body;
    
    // If the port changed, update the server port as well
    if (req.body['server-port'] && req.body['server-port'] !== server.port) {
      server.port = req.body['server-port'];
    }

    await serverRepository.save(server);

    // Log the properties update
    const logRepository = AppDataSource.getRepository(LogEntry);
    await logRepository.save({
      serverId: server.id,
      level: LogLevel.INFO,
      message: `Server properties updated by ${req.user!.username}`,
      timestamp: new Date()
    });

    res.json({ 
      message: 'Server properties updated successfully',
      properties: server.serverProperties 
    });
  } catch (error) {
    console.error('Update server properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;