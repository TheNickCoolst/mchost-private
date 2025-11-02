import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { fileManagerService } from '../services/FileManagerService';
import { auditService } from '../services/AuditService';
import { AuditAction, AuditSeverity } from '../models/AuditLog';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

// List files in directory
router.get('/:serverId/list', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path = '/' } = req.query;

    const files = await fileManagerService.listFiles(serverId, path as string);

    res.json(files);
  } catch (error: any) {
    console.error('List files error:', error);
    res.status(500).json({ error: error.message || 'Failed to list files' });
  }
});

// Read file content
router.get('/:serverId/read', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fileContent = await fileManagerService.readFile(serverId, path as string);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'file',
      resourceId: serverId,
      description: `Read file: ${path}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(fileContent);
  } catch (error: any) {
    console.error('Read file error:', error);
    res.status(500).json({ error: error.message || 'Failed to read file' });
  }
});

// Write file content
router.post('/:serverId/write', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path, content } = req.body;

    if (!path || content === undefined) {
      return res.status(400).json({ error: 'File path and content are required' });
    }

    const success = await fileManagerService.writeFile(serverId, path, content);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'file',
      resourceId: serverId,
      description: `Wrote file: ${path}`,
      severity: AuditSeverity.INFO,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success });
  } catch (error: any) {
    console.error('Write file error:', error);
    res.status(500).json({ error: error.message || 'Failed to write file' });
  }
});

// Create directory
router.post('/:serverId/directory', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path, name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Directory name is required' });
    }

    const success = await fileManagerService.createDirectory(
      serverId,
      path || '/',
      name
    );

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'directory',
      resourceId: serverId,
      description: `Created directory: ${path}/${name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success });
  } catch (error: any) {
    console.error('Create directory error:', error);
    res.status(500).json({ error: error.message || 'Failed to create directory' });
  }
});

// Delete file/directory
router.delete('/:serverId', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const success = await fileManagerService.deleteFile(serverId, path);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'file',
      resourceId: serverId,
      description: `Deleted: ${path}`,
      severity: AuditSeverity.WARNING,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success });
  } catch (error: any) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete file' });
  }
});

// Rename file/directory
router.put('/:serverId/rename', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({ error: 'Old path and new path are required' });
    }

    const success = await fileManagerService.renameFile(serverId, oldPath, newPath);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'file',
      resourceId: serverId,
      description: `Renamed: ${oldPath} -> ${newPath}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success });
  } catch (error: any) {
    console.error('Rename file error:', error);
    res.status(500).json({ error: error.message || 'Failed to rename file' });
  }
});

// Copy file
router.post('/:serverId/copy', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { sourcePath, destinationPath } = req.body;

    if (!sourcePath || !destinationPath) {
      return res.status(400).json({
        error: 'Source path and destination path are required'
      });
    }

    const success = await fileManagerService.copyFile(
      serverId,
      sourcePath,
      destinationPath
    );

    res.json({ success });
  } catch (error: any) {
    console.error('Copy file error:', error);
    res.status(500).json({ error: error.message || 'Failed to copy file' });
  }
});

// Compress files
router.post('/:serverId/compress', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { files, archiveName } = req.body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'Files array is required' });
    }

    const success = await fileManagerService.compressFiles(
      serverId,
      files,
      archiveName || 'archive.tar.gz'
    );

    res.json({ success });
  } catch (error: any) {
    console.error('Compress files error:', error);
    res.status(500).json({ error: error.message || 'Failed to compress files' });
  }
});

// Decompress file
router.post('/:serverId/decompress', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const success = await fileManagerService.decompressFile(serverId, path);

    res.json({ success });
  } catch (error: any) {
    console.error('Decompress file error:', error);
    res.status(500).json({ error: error.message || 'Failed to decompress file' });
  }
});

// Upload file
router.post('/:serverId/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path = '/' } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const success = await fileManagerService.uploadFile(
      serverId,
      path,
      file.buffer,
      file.originalname
    );

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'file',
      resourceId: serverId,
      description: `Uploaded file: ${file.originalname}`,
      metadata: { size: file.size },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success });
  } catch (error: any) {
    console.error('Upload file error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

// Download file
router.get('/:serverId/download', authenticate, async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const fileBuffer = await fileManagerService.downloadFile(serverId, path as string);

    const fileName = (path as string).split('/').pop() || 'download';

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(fileBuffer);
  } catch (error: any) {
    console.error('Download file error:', error);
    res.status(500).json({ error: error.message || 'Failed to download file' });
  }
});

// Change file permissions (admin only)
router.put('/:serverId/permissions', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { serverId } = req.params;
    const { path, permissions } = req.body;

    if (!path || !permissions) {
      return res.status(400).json({
        error: 'File path and permissions are required'
      });
    }

    const success = await fileManagerService.setFilePermissions(
      serverId,
      path,
      permissions
    );

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'file',
      resourceId: serverId,
      description: `Changed permissions for ${path} to ${permissions}`,
      severity: AuditSeverity.WARNING,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success });
  } catch (error: any) {
    console.error('Change permissions error:', error);
    res.status(500).json({ error: error.message || 'Failed to change permissions' });
  }
});

export default router;
