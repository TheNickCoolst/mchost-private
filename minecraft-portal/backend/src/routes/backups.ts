import { Router } from 'express';
import Joi from 'joi';
import { BackupService } from '../services/BackupService';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middlewares/auth';
import { AppDataSource } from '../config/database';
import { ServerInstance } from '../models/ServerInstance';

const router = Router();
const backupService = new BackupService();

const createBackupSchema = Joi.object({
  description: Joi.string().max(255).optional(),
  type: Joi.string().valid('manual', 'automatic', 'scheduled').default('manual')
});

router.use(authenticateToken);

// Get all backups for a server
router.get('/server/:serverId', async (req: AuthenticatedRequest, res) => {
  try {
    const { serverId } = req.params;
    
    // Verify server access
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: serverId } });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const backups = await backupService.getServerBackups(serverId);
    res.json(backups);
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new backup
router.post('/server/:serverId', async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = createBackupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { serverId } = req.params;
    const { description, type } = req.body;
    
    // Verify server access
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: serverId } });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const backup = await backupService.createServerBackup(
      serverId,
      req.user!.id,
      type,
      description
    );

    res.status(201).json(backup);
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create backup' 
    });
  }
});

// Restore a backup
router.post('/restore/:backupId', async (req: AuthenticatedRequest, res) => {
  try {
    const { backupId } = req.params;
    
    // Get backup metadata to verify server access
    const backups = await backupService.getServerBackups(''); // This would need to be improved
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Verify server access
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: backup.serverId } });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await backupService.restoreServerBackup(backup.serverId, backupId, req.user!.id);
    
    res.json({ message: 'Backup restore initiated successfully' });
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to restore backup' 
    });
  }
});

// Delete a backup
router.delete('/:backupId', async (req: AuthenticatedRequest, res) => {
  try {
    const { backupId } = req.params;
    
    // Get backup metadata to verify server access
    const backups = await backupService.getServerBackups(''); // This would need to be improved
    const backup = backups.find(b => b.id === backupId);
    
    if (!backup) {
      return res.status(404).json({ error: 'Backup not found' });
    }

    // Verify server access
    const serverRepository = AppDataSource.getRepository(ServerInstance);
    const server = await serverRepository.findOne({ where: { id: backup.serverId } });
    
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    if (req.user!.role === 'user' && server.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await backupService.deleteBackup(backup.serverId, backupId);
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to delete backup' 
    });
  }
});

// Create database backup (admin only)
router.post('/database', requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const backupFile = await backupService.createDatabaseBackup();
    
    res.json({ 
      message: 'Database backup created successfully',
      file: backupFile 
    });
  } catch (error) {
    console.error('Database backup error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to create database backup' 
    });
  }
});

// Restore database backup (admin only)
router.post('/database/restore', requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { backupFile } = req.body;
    
    if (!backupFile) {
      return res.status(400).json({ error: 'Backup file path is required' });
    }

    await backupService.restoreDatabaseBackup(backupFile);
    
    res.json({ message: 'Database restore completed successfully' });
  } catch (error) {
    console.error('Database restore error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Failed to restore database' 
    });
  }
});

export default router;