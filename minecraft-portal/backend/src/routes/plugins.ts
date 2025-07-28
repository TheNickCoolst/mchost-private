import { Router } from 'express';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { Plugin, PluginCategory } from '../models/Plugin';
import { ServerInstance } from '../models/ServerInstance';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middlewares/auth';

const router = Router();

// Get all plugins with filtering and searching
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      search, 
      serverType, 
      version, 
      page = 1, 
      limit = 20,
      featured,
      popular 
    } = req.query;

    const pluginRepository = AppDataSource.getRepository(Plugin);
    const queryBuilder = pluginRepository.createQueryBuilder('plugin');

    queryBuilder.where('plugin.isActive = :isActive', { isActive: true });

    // Filter by category
    if (category) {
      queryBuilder.andWhere('plugin.category = :category', { category });
    }

    // Filter by featured
    if (featured === 'true') {
      queryBuilder.andWhere('plugin.isFeatured = :isFeatured', { isFeatured: true });
    }

    // Filter by popular
    if (popular === 'true') {
      queryBuilder.andWhere('plugin.isPopular = :isPopular', { isPopular: true });
    }

    // Search by name or description
    if (search) {
      queryBuilder.andWhere(
        '(plugin.displayName ILIKE :search OR plugin.description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by server type compatibility
    if (serverType) {
      queryBuilder.andWhere(':serverType = ANY(plugin.supportedServerTypes)', { serverType });
    }

    // Filter by Minecraft version compatibility
    if (version) {
      queryBuilder.andWhere(':version = ANY(plugin.supportedVersions)', { version });
    }

    // Pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.offset(offset).limit(Number(limit));

    // Default ordering: featured first, then by downloads
    queryBuilder.orderBy('plugin.isFeatured', 'DESC')
                .addOrderBy('plugin.downloads', 'DESC');

    const [plugins, total] = await queryBuilder.getManyAndCount();

    res.json({
      plugins: plugins.map(plugin => ({
        id: plugin.id,
        name: plugin.name,
        displayName: plugin.displayName,
        description: plugin.description,
        author: plugin.author,
        version: plugin.version,
        category: plugin.category,
        supportedVersions: plugin.supportedVersions,
        supportedServerTypes: plugin.supportedServerTypes,
        websiteUrl: plugin.websiteUrl,
        iconUrl: plugin.iconUrl,
        downloads: plugin.downloads,
        rating: plugin.rating,
        ratingCount: plugin.ratingCount,
        isFeatured: plugin.isFeatured,
        isPopular: plugin.isPopular,
        dependencies: plugin.dependencies,
        conflicts: plugin.conflicts
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get plugins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get plugin categories
router.get('/categories', (req, res) => {
  const categories = Object.values(PluginCategory).map(category => ({
    id: category,
    name: category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' '),
    icon: getCategoryIcon(category)
  }));

  res.json(categories);
});

// Get specific plugin details
router.get('/:id', async (req, res) => {
  try {
    const pluginRepository = AppDataSource.getRepository(Plugin);
    const plugin = await pluginRepository.findOne({
      where: { id: req.params.id },
      relations: ['servers']
    });

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json({
      id: plugin.id,
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      category: plugin.category,
      supportedVersions: plugin.supportedVersions,
      supportedServerTypes: plugin.supportedServerTypes,
      downloadUrl: plugin.downloadUrl,
      websiteUrl: plugin.websiteUrl,
      sourceUrl: plugin.sourceUrl,
      iconUrl: plugin.iconUrl,
      downloads: plugin.downloads,
      rating: plugin.rating,
      ratingCount: plugin.ratingCount,
      configTemplate: plugin.configTemplate,
      dependencies: plugin.dependencies,
      conflicts: plugin.conflicts,
      installedOnServers: plugin.servers?.length || 0
    });
  } catch (error) {
    console.error('Get plugin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Install plugin on server
router.post('/:id/install/:serverId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: pluginId, serverId } = req.params;
    
    const pluginRepository = AppDataSource.getRepository(Plugin);
    const serverRepository = AppDataSource.getRepository(ServerInstance);

    const plugin = await pluginRepository.findOne({ where: { id: pluginId } });
    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const server = await serverRepository.findOne({ 
      where: { id: serverId },
      relations: ['plugins']
    });
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if plugin is already installed
    const isInstalled = server.plugins?.some(p => p.id === plugin.id);
    if (isInstalled) {
      return res.status(409).json({ error: 'Plugin already installed on this server' });
    }

    // Check compatibility
    if (plugin.supportedServerTypes && !plugin.supportedServerTypes.includes(server.egg)) {
      return res.status(400).json({ 
        error: `Plugin not compatible with server type: ${server.egg}` 
      });
    }

    if (plugin.supportedVersions && server.gameVersion && 
        !plugin.supportedVersions.includes(server.gameVersion)) {
      return res.status(400).json({ 
        error: `Plugin not compatible with Minecraft version: ${server.gameVersion}` 
      });
    }

    // Add plugin to server
    if (!server.plugins) {
      server.plugins = [];
    }
    server.plugins.push(plugin);
    await serverRepository.save(server);

    // Increment download count
    plugin.downloads += 1;
    await pluginRepository.save(plugin);

    res.json({ 
      message: 'Plugin installed successfully',
      plugin: {
        id: plugin.id,
        name: plugin.name,
        displayName: plugin.displayName,
        version: plugin.version
      }
    });
  } catch (error) {
    console.error('Install plugin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove plugin from server
router.delete('/:id/remove/:serverId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id: pluginId, serverId } = req.params;
    
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ 
      where: { id: serverId },
      relations: ['plugins']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Remove plugin from server
    server.plugins = server.plugins.filter(p => p.id !== pluginId);
    await serverRepository.save(server);

    res.json({ message: 'Plugin removed successfully' });
  } catch (error) {
    console.error('Remove plugin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get plugins installed on a specific server
router.get('/server/:serverId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { serverId } = req.params;
    
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ 
      where: { id: serverId },
      relations: ['plugins']
    });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    // Check permissions
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const plugins = server.plugins?.map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      displayName: plugin.displayName,
      description: plugin.description,
      author: plugin.author,
      version: plugin.version,
      category: plugin.category,
      iconUrl: plugin.iconUrl,
      websiteUrl: plugin.websiteUrl
    })) || [];

    res.json({ plugins });
  } catch (error) {
    console.error('Get server plugins error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getCategoryIcon(category: PluginCategory): string {
  const icons: Record<PluginCategory, string> = {
    [PluginCategory.ADMIN]: '⚙️',
    [PluginCategory.ECONOMY]: '💰',
    [PluginCategory.PVP]: '⚔️',
    [PluginCategory.BUILDING]: '🏗️',
    [PluginCategory.WORLD]: '🌍',
    [PluginCategory.UTILITY]: '🔧',
    [PluginCategory.FUN]: '🎮',
    [PluginCategory.PROTECTION]: '🛡️'
  };

  return icons[category] || '📦';
}

export default router;