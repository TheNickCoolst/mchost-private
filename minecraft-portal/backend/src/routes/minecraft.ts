import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { MinecraftVersion } from '../models/MinecraftVersion';
import { ServerType } from '../models/ServerType';

const router = Router();

// Get all Minecraft versions
router.get('/versions', async (req, res) => {
  try {
    const versionRepository = AppDataSource.getRepository(MinecraftVersion);
    const versions = await versionRepository.find({
      where: { isActive: true },
      order: { recommended: 'DESC', releaseDate: 'DESC' }
    });

    res.json(versions.map(version => ({
      id: version.versionId,
      name: version.name,
      type: version.type,
      recommended: version.recommended,
      description: version.description,
      releaseDate: version.releaseDate
    })));
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all server types
router.get('/server-types', async (req, res) => {
  try {
    const serverTypeRepository = AppDataSource.getRepository(ServerType);
    const serverTypes = await serverTypeRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' }
    });

    res.json(serverTypes.map(type => ({
      id: type.typeId,
      name: type.name,
      description: type.description,
      supportsPlugins: type.supportsPlugins,
      supportsMods: type.supportsMods,
      modLoaderType: type.modLoaderType
    })));
  } catch (error) {
    console.error('Get server types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get compatible versions for a server type
router.get('/versions/compatible/:serverType', async (req, res) => {
  try {
    const { serverType } = req.params;
    const versionRepository = AppDataSource.getRepository(MinecraftVersion);
    
    let versions = await versionRepository.find({
      where: { isActive: true },
      order: { recommended: 'DESC', releaseDate: 'DESC' }
    });

    // Apply server type specific filtering
    if (serverType === 'forge') {
      // Forge might not be available for the newest versions immediately
      versions = versions.filter(v => !['1.21.1', '1.21.0'].includes(v.versionId));
    }
    
    res.json(versions.map(version => ({
      id: version.versionId,
      name: version.name,
      type: version.type,
      recommended: version.recommended,
      description: version.description,
      releaseDate: version.releaseDate
    })));
  } catch (error) {
    console.error('Get compatible versions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;