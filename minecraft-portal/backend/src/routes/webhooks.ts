import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { webhookService } from '../services/WebhookService';
import { WebhookEvent } from '../models/Webhook';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError } from '../middleware/errorHandler';

const router = Router();

// Get all webhooks for user
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const webhooks = await webhookService.getByUser(req.user!.id);
    res.json(webhooks);
  })
);

// Create webhook
router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { url, name, description, events, secret, headers } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      throw new ValidationError('URL and events are required');
    }

    const webhook = await webhookService.create(req.user!.id, {
      url,
      name,
      description,
      events,
      secret,
      headers
    });

    res.status(201).json(webhook);
  })
);

// Update webhook
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const webhook = await webhookService.update(id, req.user!.id, updates);

    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json(webhook);
  })
);

// Delete webhook
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const success = await webhookService.delete(id, req.user!.id);

    if (!success) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true });
  })
);

// Test webhook
router.post(
  '/:id/test',
  authenticate,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const success = await webhookService.testWebhook(id, req.user!.id);

    if (!success) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    res.json({ success: true, message: 'Test webhook sent' });
  })
);

// Get available events
router.get('/events', (req, res) => {
  res.json(Object.values(WebhookEvent));
});

export default router;
