import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middlewares/auth';

const router = Router();

const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.USER),
  memoryLimitMB: Joi.number().min(512).max(32768).default(2048),
  cpuCores: Joi.number().min(1).max(16).default(2),
  diskLimitMB: Joi.number().min(1024).max(102400).default(10240),
  maxServers: Joi.number().min(1).max(50).default(5)
});

router.use(authenticateToken);

// Admin only: Create new user
router.post('/', requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    const { error } = createUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const userRepository = AppDataSource.getRepository(User);
    const { username, email, password, role, memoryLimitMB, cpuCores, diskLimitMB, maxServers } = req.body;

    // Check if user already exists
    const existingUser = await userRepository.findOne({
      where: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email or username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = userRepository.create({
      username,
      email,
      passwordHash,
      role,
      memoryLimitMB,
      cpuCores,
      diskLimitMB,
      maxServers
    });

    await userRepository.save(user);

    const { passwordHash: _, ...userResponse } = user;
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      select: ['id', 'username', 'email', 'role', 'isActive', 'createdAt', 'memoryLimitMB', 'cpuCores', 'diskLimitMB', 'maxServers']
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', async (req: AuthenticatedRequest, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      select: ['id', 'username', 'email', 'role', 'createdAt', 'memoryLimitMB', 'cpuCores', 'diskLimitMB', 'maxServers'],
      relations: ['servers']
    });

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user resource usage
router.get('/me/resources', async (req: AuthenticatedRequest, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.user!.id },
      select: ['id', 'memoryLimitMB', 'cpuCores', 'diskLimitMB', 'maxServers'],
      relations: ['servers']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate used resources
    const usedMemoryMB = user.servers.reduce((total, server) => {
      return total + (server.resourceLimits?.memory || 0);
    }, 0);

    const usedCPU = user.servers.reduce((total, server) => {
      return total + (server.resourceLimits?.cpu || 0);
    }, 0);

    const usedDiskMB = user.servers.reduce((total, server) => {
      return total + (server.resourceLimits?.disk || 0);
    }, 0);

    const usedServers = user.servers.length;

    res.json({
      limits: {
        memoryMB: user.memoryLimitMB,
        cpuCores: user.cpuCores,
        diskMB: user.diskLimitMB,
        maxServers: user.maxServers
      },
      used: {
        memoryMB: usedMemoryMB,
        cpuPercentage: usedCPU,
        diskMB: usedDiskMB,
        servers: usedServers
      },
      available: {
        memoryMB: user.memoryLimitMB - usedMemoryMB,
        cpuPercentage: (user.cpuCores * 100) - usedCPU,
        diskMB: user.diskLimitMB - usedDiskMB,
        servers: user.maxServers - usedServers
      },
      percentageUsed: {
        memory: (usedMemoryMB / user.memoryLimitMB) * 100,
        cpu: (usedCPU / (user.cpuCores * 100)) * 100,
        disk: (usedDiskMB / user.diskLimitMB) * 100,
        servers: (usedServers / user.maxServers) * 100
      }
    });
  } catch (error) {
    console.error('Get user resources error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: req.params.id },
      select: ['id', 'username', 'email', 'role', 'isActive', 'createdAt', 'memoryLimitMB', 'cpuCores', 'diskLimitMB', 'maxServers'],
      relations: ['servers']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', requireRole(['admin', 'moderator']), async (req: AuthenticatedRequest, res) => {
  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUserRole = req.user!.role;
    let allowedUpdates = ['role', 'isActive'];
    
    // Only admins can modify resource limits
    if (currentUserRole === UserRole.ADMIN) {
      allowedUpdates = ['role', 'isActive', 'memoryLimitMB', 'cpuCores', 'diskLimitMB', 'maxServers'];
    }
    const updates: any = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (updates.role && !Object.values(UserRole).includes(updates.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Role assignment restrictions
    if (updates.role) {
      
      // Only admins can assign admin role
      if (updates.role === UserRole.ADMIN && currentUserRole !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can assign admin role' });
      }
      
      // Only admins can assign moderator role
      if (updates.role === UserRole.MODERATOR && currentUserRole !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Only admins can assign moderator role' });
      }

      // Moderators can only assign user role
      if (currentUserRole === UserRole.MODERATOR && updates.role !== UserRole.USER) {
        return res.status(403).json({ error: 'Moderators can only assign user role' });
      }
    }

    if (updates.memoryLimitMB && (updates.memoryLimitMB < 512 || updates.memoryLimitMB > 32768)) {
      return res.status(400).json({ error: 'Memory limit must be between 512MB and 32GB' });
    }

    if (updates.cpuCores && (updates.cpuCores < 1 || updates.cpuCores > 16)) {
      return res.status(400).json({ error: 'CPU cores must be between 1 and 16' });
    }

    if (updates.diskLimitMB && (updates.diskLimitMB < 1024 || updates.diskLimitMB > 102400)) {
      return res.status(400).json({ error: 'Disk limit must be between 1GB and 100GB' });
    }

    if (updates.maxServers && (updates.maxServers < 1 || updates.maxServers > 50)) {
      return res.status(400).json({ error: 'Max servers must be between 1 and 50' });
    }

    Object.assign(user, updates);
    await userRepository.save(user);

    const { passwordHash, ...userResponse } = user;
    res.json(userResponse);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
  try {
    if (req.params.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.params.id } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await userRepository.remove(user);
    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;