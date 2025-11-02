import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { ServerTemplate, TemplateCategory } from '../models/ServerTemplate';
import { authenticate, requireRole } from '../middleware/auth';
import { auditService } from '../services/AuditService';
import { AuditAction } from '../models/AuditLog';

const router = Router();
const templateRepository = AppDataSource.getRepository(ServerTemplate);

// Get all public templates and user's private templates
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, search } = req.query;

    const queryBuilder = templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.user', 'user')
      .where('template.isPublic = :isPublic', { isPublic: true })
      .orWhere('template.userId = :userId', { userId: req.user!.id });

    if (category) {
      queryBuilder.andWhere('template.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search OR template.tags::text ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder.orderBy('template.usageCount', 'DESC');

    const templates = await queryBuilder.getMany();

    res.json(templates);
  } catch (error: any) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get template by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await templateRepository.findOne({
      where: { id },
      relations: ['user']
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if user has access to this template
    if (!template.isPublic && template.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(template);
  } catch (error: any) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', authenticate, async (req, res) => {
  try {
    const templateData = req.body;

    const template = templateRepository.create({
      ...templateData,
      userId: req.user!.id,
      usageCount: 0,
      averageRating: 0
    });

    await templateRepository.save(template);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'template',
      resourceId: template.id,
      description: `Created template: ${template.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json(template);
  } catch (error: any) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const template = await templateRepository.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check ownership or admin
    if (template.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    Object.assign(template, updateData);
    await templateRepository.save(template);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'template',
      resourceId: template.id,
      description: `Updated template: ${template.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json(template);
  } catch (error: any) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await templateRepository.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check ownership or admin
    if (template.userId !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await templateRepository.remove(template);

    await auditService.log({
      action: AuditAction.CONFIG_UPDATE,
      userId: req.user!.id,
      resourceType: 'template',
      resourceId: id,
      description: `Deleted template: ${template.name}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Increment usage count when template is used
router.post('/:id/use', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await templateRepository.findOne({ where: { id } });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.usageCount += 1;
    await templateRepository.save(template);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Increment usage error:', error);
    res.status(500).json({ error: 'Failed to increment usage count' });
  }
});

// Get template categories
router.get('/meta/categories', (req, res) => {
  res.json(Object.values(TemplateCategory));
});

// Get popular templates
router.get('/meta/popular', authenticate, async (req, res) => {
  try {
    const templates = await templateRepository.find({
      where: { isPublic: true },
      order: { usageCount: 'DESC' },
      take: 10,
      relations: ['user']
    });

    res.json(templates);
  } catch (error: any) {
    console.error('Get popular templates error:', error);
    res.status(500).json({ error: 'Failed to fetch popular templates' });
  }
});

export default router;
