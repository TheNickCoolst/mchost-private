import { Router } from 'express';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { ServerInstance } from '../models/ServerInstance';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { groupConfigByCategory } from '../utils/serverTransforms';

const router = Router();

// Server.properties configuration schema
const serverPropertiesSchema = Joi.object({
  'server-name': Joi.string().max(64).optional(),
  'server-port': Joi.number().min(1).max(65535).default(25565),
  'query.port': Joi.number().min(1).max(65535).default(25565),
  'rcon.port': Joi.number().min(1).max(65535).default(25575),
  'max-players': Joi.number().min(1).max(2147483647).default(20),
  'online-mode': Joi.boolean().default(true),
  'white-list': Joi.boolean().default(false),
  'enforce-whitelist': Joi.boolean().default(false),
  'pvp': Joi.boolean().default(true),
  'difficulty': Joi.string().valid('peaceful', 'easy', 'normal', 'hard').default('easy'),
  'gamemode': Joi.string().valid('survival', 'creative', 'adventure', 'spectator').default('survival'),
  'force-gamemode': Joi.boolean().default(false),
  'hardcore': Joi.boolean().default(false),
  'allow-flight': Joi.boolean().default(false),
  'spawn-protection': Joi.number().min(0).default(16),
  'view-distance': Joi.number().min(3).max(32).default(10),
  'simulation-distance': Joi.number().min(3).max(32).default(10),
  'level-name': Joi.string().max(64).default('world'),
  'level-seed': Joi.string().max(64).optional(),
  'level-type': Joi.string().valid('minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified').default('minecraft:normal'),
  'generate-structures': Joi.boolean().default(true),
  'allow-nether': Joi.boolean().default(true),
  'spawn-npcs': Joi.boolean().default(true),
  'spawn-animals': Joi.boolean().default(true),
  'spawn-monsters': Joi.boolean().default(true),
  'enable-command-block': Joi.boolean().default(false),
  'enable-query': Joi.boolean().default(false),
  'enable-rcon': Joi.boolean().default(false),
  'rcon.password': Joi.string().max(64).optional(),
  'motd': Joi.string().max(59).default('A Minecraft Server'),
  'player-idle-timeout': Joi.number().min(0).default(0),
  'max-world-size': Joi.number().min(1).max(29999984).default(29999984),
  'entity-broadcast-range-percentage': Joi.number().min(10).max(1000).default(100),
  'function-permission-level': Joi.number().min(1).max(4).default(2),
  'op-permission-level': Joi.number().min(1).max(4).default(4),
  'resource-pack': Joi.string().uri().optional(),
  'resource-pack-sha1': Joi.string().length(40).optional(),
  'resource-pack-prompt': Joi.string().max(255).optional(),
  'require-resource-pack': Joi.boolean().default(false),
  'enable-jmx-monitoring': Joi.boolean().default(false),
  'sync-chunk-writes': Joi.boolean().default(true),
  'enable-status': Joi.boolean().default(true),
  'hide-online-players': Joi.boolean().default(false),
  'max-tick-time': Joi.number().min(-1).default(60000),
  'rate-limit': Joi.number().min(0).default(0),
  'broadcast-console-to-ops': Joi.boolean().default(true),
  'broadcast-rcon-to-ops': Joi.boolean().default(true),
  'enforce-secure-profile': Joi.boolean().default(true),
  'log-ips': Joi.boolean().default(true),
  'pause-when-empty-seconds': Joi.number().min(0).default(60),
  'debug': Joi.boolean().default(false)
});

router.use(authenticateToken);

// Get server configuration
router.get('/:serverId', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Return current server configuration or defaults
    const config = server.serverProperties || getDefaultServerProperties();
    const groupedConfig = groupConfigByCategory(config);
    
    res.json({
      serverId: server.id,
      serverName: server.name,
      config,
      groupedConfig,
      lastModified: server.updatedAt
    });
  } catch (error) {
    console.error('Get server config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update server configuration
router.put('/:serverId', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = serverPropertiesSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update server properties
    server.serverProperties = req.body;
    await serverRepository.save(server);

    res.json({
      message: 'Server configuration updated successfully',
      config: server.serverProperties
    });
  } catch (error) {
    console.error('Update server config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get configuration templates
router.get('/templates/presets', async (req: AuthenticatedRequest, res) => {
  try {
    const templates = [
      {
        id: 'survival',
        name: 'Survival Server',
        description: 'Default survival server with standard settings',
        config: {
          ...getDefaultServerProperties(),
          'gamemode': 'survival',
          'difficulty': 'normal',
          'pvp': true,
          'spawn-monsters': true,
          'spawn-animals': true
        }
      },
      {
        id: 'creative',
        name: 'Creative Server',
        description: 'Creative building server with flight enabled',
        config: {
          ...getDefaultServerProperties(),
          'gamemode': 'creative',
          'difficulty': 'peaceful',
          'allow-flight': true,
          'spawn-monsters': false,
          'pvp': false
        }
      },
      {
        id: 'hardcore',
        name: 'Hardcore Server',
        description: 'Hardcore survival with maximum difficulty',
        config: {
          ...getDefaultServerProperties(),
          'gamemode': 'survival',
          'difficulty': 'hard',
          'hardcore': true,
          'pvp': true,
          'spawn-protection': 0
        }
      },
      {
        id: 'peaceful',
        name: 'Peaceful Server',
        description: 'Family-friendly server with no monsters',
        config: {
          ...getDefaultServerProperties(),
          'gamemode': 'survival',
          'difficulty': 'peaceful',
          'spawn-monsters': false,
          'pvp': false,
          'white-list': true
        }
      },
      {
        id: 'minigames',
        name: 'Minigames Server',
        description: 'Server optimized for minigames and plugins',
        config: {
          ...getDefaultServerProperties(),
          'gamemode': 'adventure',
          'difficulty': 'easy',
          'spawn-protection': 0,
          'enable-command-block': true,
          'allow-flight': true,
          'view-distance': 6
        }
      }
    ];

    res.json(templates);
  } catch (error) {
    console.error('Get config templates error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Apply configuration template
router.post('/:serverId/apply-template', async (req: AuthenticatedRequest, res) => {
  try {
    const { templateId } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get template configuration (this could be from database in a real implementation)
    const template = getTemplateById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Apply template configuration
    server.serverProperties = template.config;
    await serverRepository.save(server);

    res.json({
      message: `Template "${template.name}" applied successfully`,
      config: server.serverProperties
    });
  } catch (error) {
    console.error('Apply template error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getDefaultServerProperties() {
  return {
    'server-name': '',
    'server-port': 25565,
    'query.port': 25565,
    'rcon.port': 25575,
    'max-players': 20,
    'online-mode': true,
    'white-list': false,
    'enforce-whitelist': false,
    'pvp': true,
    'difficulty': 'easy',
    'gamemode': 'survival',
    'force-gamemode': false,
    'hardcore': false,
    'allow-flight': false,
    'spawn-protection': 16,
    'view-distance': 10,
    'simulation-distance': 10,
    'level-name': 'world',
    'level-type': 'minecraft:normal',
    'generate-structures': true,
    'allow-nether': true,
    'spawn-npcs': true,
    'spawn-animals': true,
    'spawn-monsters': true,
    'enable-command-block': false,
    'enable-query': false,
    'enable-rcon': false,
    'motd': 'A Minecraft Server',
    'player-idle-timeout': 0,
    'max-world-size': 29999984,
    'entity-broadcast-range-percentage': 100,
    'function-permission-level': 2,
    'op-permission-level': 4,
    'require-resource-pack': false,
    'enable-jmx-monitoring': false,
    'sync-chunk-writes': true,
    'enable-status': true,
    'hide-online-players': false,
    'max-tick-time': 60000,
    'rate-limit': 0,
    'broadcast-console-to-ops': true,
    'broadcast-rcon-to-ops': true,
    'enforce-secure-profile': true,
    'log-ips': true,
    'pause-when-empty-seconds': 60,
    'debug': false
  };
}

function getTemplateById(templateId: string) {
  const templates: Record<string, any> = {
    'survival': {
      name: 'Survival Server',
      config: {
        ...getDefaultServerProperties(),
        'gamemode': 'survival',
        'difficulty': 'normal',
        'pvp': true,
        'spawn-monsters': true,
        'spawn-animals': true
      }
    },
    'creative': {
      name: 'Creative Server',
      config: {
        ...getDefaultServerProperties(),
        'gamemode': 'creative',
        'difficulty': 'peaceful',
        'allow-flight': true,
        'spawn-monsters': false,
        'pvp': false
      }
    },
    'hardcore': {
      name: 'Hardcore Server',
      config: {
        ...getDefaultServerProperties(),
        'gamemode': 'survival',
        'difficulty': 'hard',
        'hardcore': true,
        'pvp': true,
        'spawn-protection': 0
      }
    },
    'peaceful': {
      name: 'Peaceful Server',
      config: {
        ...getDefaultServerProperties(),
        'gamemode': 'survival',
        'difficulty': 'peaceful',
        'spawn-monsters': false,
        'pvp': false,
        'white-list': true
      }
    },
    'minigames': {
      name: 'Minigames Server',
      config: {
        ...getDefaultServerProperties(),
        'gamemode': 'adventure',
        'difficulty': 'easy',
        'spawn-protection': 0,
        'enable-command-block': true,
        'allow-flight': true,
        'view-distance': 6
      }
    }
  };

  return templates[templateId] || null;
}

export default router;