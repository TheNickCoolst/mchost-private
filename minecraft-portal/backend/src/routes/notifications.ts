import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/NotificationService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get user's notifications
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { unreadOnly, category, limit, offset } = req.query;

    const result = await notificationService.getForUser(req.user!.id, {
      unreadOnly: unreadOnly === 'true',
      category: category as any,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0
    });

    res.json(result);
  })
);

// Get unread count
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(async (req, res) => {
    const result = await notificationService.getForUser(req.user!.id, {
      unreadOnly: true,
      limit: 0
    });

    res.json({ count: result.unreadCount });
  })
);

// Mark notification as read
router.put(
  '/:id/read',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const success = await notificationService.markAsRead(id, req.user!.id);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  })
);

// Mark all notifications as read
router.put(
  '/read-all',
  authenticate,
  asyncHandler(async (req, res) => {
    const count = await notificationService.markAllAsRead(req.user!.id);

    res.json({ success: true, count });
  })
);

// Delete notification
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const success = await notificationService.delete(id, req.user!.id);

    if (!success) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ success: true });
  })
);

// Delete all notifications
router.delete(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const count = await notificationService.deleteAll(req.user!.id);

    res.json({ success: true, count });
  })
);

export default router;
