import { Router } from 'express';
import { AppDataSource } from '../config/database';
import { SubscriptionPlan } from '../models/SubscriptionPlan';
import { Subscription, SubscriptionStatus } from '../models/Subscription';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';

const router = Router();

// Public: Get all available subscription plans
router.get('/plans', async (req, res) => {
  try {
    const planRepository = AppDataSource.getRepository(SubscriptionPlan);
    const plans = await planRepository.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' }
    });

    res.json(plans);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific plan
router.get('/plans/:id', async (req, res) => {
  try {
    const planRepository = AppDataSource.getRepository(SubscriptionPlan);
    const plan = await planRepository.findOne({
      where: { id: req.params.id, isActive: true }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Get user's current subscription
router.get('/my-subscription', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const subscriptionRepository = AppDataSource.getRepository(Subscription);
    const subscription = await subscriptionRepository.findOne({
      where: {
        userId: req.user!.id,
        status: SubscriptionStatus.ACTIVE
      },
      relations: ['user']
    });

    if (!subscription) {
      return res.json({ message: 'No active subscription' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Subscribe to a plan
router.post('/subscribe/:planId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const planRepository = AppDataSource.getRepository(SubscriptionPlan);
    const subscriptionRepository = AppDataSource.getRepository(Subscription);

    const plan = await planRepository.findOne({
      where: { id: req.params.planId, isActive: true }
    });

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Check if user already has an active subscription
    const existingSubscription = await subscriptionRepository.findOne({
      where: {
        userId: req.user!.id,
        status: SubscriptionStatus.ACTIVE
      }
    });

    if (existingSubscription) {
      return res.status(400).json({ error: 'You already have an active subscription' });
    }

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    const subscription = subscriptionRepository.create({
      userId: req.user!.id,
      planType: plan.name as any,
      status: SubscriptionStatus.ACTIVE,
      pricePerMonth: plan.priceMonthly,
      ramMB: plan.ramMB,
      cpuCores: plan.cpuCores,
      diskMB: plan.diskMB,
      maxServers: plan.maxServers,
      maxPlayers: plan.maxPlayers,
      backupsEnabled: plan.backupsEnabled,
      prioritySupport: plan.prioritySupport,
      customDomain: plan.customDomain,
      startDate,
      endDate
    });

    await subscriptionRepository.save(subscription);

    res.json({
      message: 'Subscription created successfully',
      subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected: Cancel subscription
router.post('/cancel', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const subscriptionRepository = AppDataSource.getRepository(Subscription);

    const subscription = await subscriptionRepository.findOne({
      where: {
        userId: req.user!.id,
        status: SubscriptionStatus.ACTIVE
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    subscription.status = SubscriptionStatus.CANCELLED;
    await subscriptionRepository.save(subscription);

    res.json({
      message: 'Subscription cancelled successfully',
      subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
