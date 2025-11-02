import { Router } from 'express';
import { healthCheckService } from '../services/HealthCheckService';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Public health check endpoint
router.get('/', async (req, res) => {
  const health = await healthCheckService.getHealthStatus();

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    status: health.status,
    timestamp: health.timestamp,
    uptime: health.uptime
  });
});

// Detailed health check (admin only)
router.get('/detailed', authenticate, requireRole('admin'), async (req, res) => {
  const health = await healthCheckService.getHealthStatus();

  const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json(health);
});

// System info (admin only)
router.get('/system', authenticate, requireRole('admin'), (req, res) => {
  const systemInfo = healthCheckService.getSystemInfo();
  res.json(systemInfo);
});

// Readiness probe (for Kubernetes/container orchestration)
router.get('/ready', async (req, res) => {
  const health = await healthCheckService.getHealthStatus();

  if (health.status === 'unhealthy') {
    return res.status(503).json({ ready: false });
  }

  res.json({ ready: true });
});

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (req, res) => {
  res.json({ alive: true });
});

export default router;
