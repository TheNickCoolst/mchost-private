import { Router } from 'express';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { ServerInstance, ServerStatus } from '../models/ServerInstance';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { WingsService } from '../services/WingsService';
import path from 'path';
import { promises as fs } from 'fs';

const router = Router();
const wingsService = new WingsService();

const createBackupSchema = Joi.object({
  name: Joi.string().max(64).optional(),
  description: Joi.string().max(255).optional()
});

const restoreBackupSchema = Joi.object({
  backupId: Joi.string().required()
});

const resetWorldSchema = Joi.object({
  worldName: Joi.string().default('world'),
  seed: Joi.string().max(64).optional(),
  levelType: Joi.string().valid('minecraft:normal', 'minecraft:flat', 'minecraft:large_biomes', 'minecraft:amplified').default('minecraft:normal'),
  generateStructures: Joi.boolean().default(true),
  confirmReset: Joi.boolean().valid(true).required()
});

router.use(authenticateToken);

// Get world information for a server
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

    try {
      // Get world information from Wings daemon
      const worldInfo = await wingsService.getWorldInfo(server.wingsUuid!);
      
      res.json({
        serverId: server.id,
        serverName: server.name,
        worldName: server.serverProperties?.['level-name'] || 'world',
        worldSize: worldInfo.size,
        lastBackup: worldInfo.lastBackup,
        availableBackups: worldInfo.backups || [],
        worldFiles: worldInfo.files || []
      });
    } catch (wingsError) {
      console.error('Wings world info error:', wingsError);
      // Return basic info if Wings is unavailable
      res.json({
        serverId: server.id,
        serverName: server.name,
        worldName: server.serverProperties?.['level-name'] || 'world',
        worldSize: 0,
        lastBackup: null,
        availableBackups: [],
        worldFiles: []
      });
    }
  } catch (error) {
    console.error('Get world info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a world backup
router.post('/:serverId/backup', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = createBackupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { name, description } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const backupName = name || `backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;

    try {
      const backup = await wingsService.createBackup(server.wingsUuid!, {
        name: backupName,
        description: description || `Backup created on ${new Date().toLocaleString()}`
      });

      res.status(201).json({
        message: 'Backup created successfully',
        backup: {
          id: backup.id,
          name: backup.name,
          description: backup.description,
          size: backup.size,
          createdAt: backup.createdAt
        }
      });
    } catch (wingsError) {
      console.error('Wings backup error:', wingsError);
      res.status(503).json({ error: 'Failed to create backup' });
    }
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download world backup
router.get('/:serverId/backup/:backupId/download', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const downloadUrl = await wingsService.getBackupDownloadUrl(server.wingsUuid!, req.params.backupId);
      
      res.json({
        downloadUrl,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      });
    } catch (wingsError) {
      console.error('Wings backup download error:', wingsError);
      res.status(503).json({ error: 'Failed to generate download link' });
    }
  } catch (error) {
    console.error('Download backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore from backup
router.post('/:serverId/restore', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = restoreBackupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { backupId } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Server must be stopped for restore
    if (server.status !== ServerStatus.STOPPED) {
      return res.status(400).json({ error: 'Server must be stopped before restoring from backup' });
    }

    try {
      await wingsService.restoreBackup(server.wingsUuid!, backupId);

      res.json({
        message: 'World restored from backup successfully',
        backupId
      });
    } catch (wingsError) {
      console.error('Wings restore error:', wingsError);
      res.status(503).json({ error: 'Failed to restore from backup' });
    }
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset world (create new world)
router.post('/:serverId/reset', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = resetWorldSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { worldName, seed, levelType, generateStructures } = req.body;
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Server must be stopped for world reset
    if (server.status !== ServerStatus.STOPPED) {
      return res.status(400).json({ error: 'Server must be stopped before resetting world' });
    }

    try {
      // Create backup before reset
      const backupName = `pre-reset-backup-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
      await wingsService.createBackup(server.wingsUuid!, {
        name: backupName,
        description: 'Automatic backup before world reset'
      });

      // Update server properties for new world
      const newProperties: any = {
        ...server.serverProperties,
        'level-name': worldName,
        'level-type': levelType,
        'generate-structures': generateStructures
      };

      if (seed) {
        newProperties['level-seed'] = seed;
      }

      server.serverProperties = newProperties;
      await serverRepository.save(server);

      // Reset world through Wings
      await wingsService.resetWorld(server.wingsUuid!, {
        worldName,
        seed,
        levelType,
        generateStructures
      });

      res.json({
        message: 'World reset successfully',
        backupCreated: backupName,
        newWorldSettings: {
          worldName,
          seed: seed || 'Random',
          levelType,
          generateStructures
        }
      });
    } catch (wingsError) {
      console.error('Wings world reset error:', wingsError);
      res.status(503).json({ error: 'Failed to reset world' });
    }
  } catch (error) {
    console.error('Reset world error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete backup
router.delete('/:serverId/backup/:backupId', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      await wingsService.deleteBackup(server.wingsUuid!, req.params.backupId);

      res.json({
        message: 'Backup deleted successfully'
      });
    } catch (wingsError) {
      console.error('Wings delete backup error:', wingsError);
      res.status(503).json({ error: 'Failed to delete backup' });
    }
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get list of backups
router.get('/:serverId/backups', async (req: AuthenticatedRequest, res) => {
  try {
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: req.params.serverId } });

    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }

    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    try {
      const backups = await wingsService.getBackups(server.wingsUuid!);

      res.json({
        serverId: server.id,
        backups: backups.map(backup => ({
          id: backup.id,
          name: backup.name,
          description: backup.description,
          size: backup.size,
          createdAt: backup.createdAt,
          canDownload: true,
          canRestore: server.status === ServerStatus.STOPPED
        }))
      });
    } catch (wingsError) {
      console.error('Wings get backups error:', wingsError);
      res.json({
        serverId: server.id,
        backups: []
      });
    }
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;