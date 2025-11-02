import { AppDataSource } from '../config/database';
import { SubscriptionPlan } from '../models/SubscriptionPlan';

async function seedSubscriptionPlans() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const planRepository = AppDataSource.getRepository(SubscriptionPlan);

    // Check if plans already exist
    const existingPlans = await planRepository.count();
    if (existingPlans > 0) {
      console.log('Subscription plans already exist');
      await AppDataSource.destroy();
      return;
    }

    const plans = [
      {
        name: 'free',
        displayName: 'Free',
        description: 'Perfekt zum Ausprobieren',
        priceMonthly: 0,
        priceYearly: 0,
        ramMB: 1024,
        cpuCores: 1,
        diskMB: 2048,
        maxServers: 1,
        maxPlayers: 5,
        backupsEnabled: false,
        maxBackups: 0,
        prioritySupport: false,
        customDomain: false,
        ddosProtection: true,
        modpackSupport: false,
        pluginSupport: false,
        isActive: true,
        displayOrder: 1,
        features: [
          '1 GB RAM',
          '1 CPU Core',
          '2 GB Speicher',
          'Bis zu 5 Spieler',
          'DDoS-Schutz',
          'Standard Support'
        ]
      },
      {
        name: 'starter',
        displayName: 'Starter',
        description: 'Ideal für kleine Server',
        priceMonthly: 4.99,
        priceYearly: 49.90,
        ramMB: 2048,
        cpuCores: 2,
        diskMB: 10240,
        maxServers: 2,
        maxPlayers: 20,
        backupsEnabled: true,
        maxBackups: 3,
        prioritySupport: false,
        customDomain: false,
        ddosProtection: true,
        modpackSupport: true,
        pluginSupport: true,
        isActive: true,
        displayOrder: 2,
        features: [
          '2 GB RAM',
          '2 CPU Cores',
          '10 GB Speicher',
          'Bis zu 20 Spieler',
          '2 Server',
          'DDoS-Schutz',
          'Automatische Backups',
          'Modpack Support',
          'Plugin Support'
        ]
      },
      {
        name: 'premium',
        displayName: 'Premium',
        description: 'Für ambitionierte Communities',
        priceMonthly: 9.99,
        priceYearly: 99.90,
        ramMB: 4096,
        cpuCores: 4,
        diskMB: 20480,
        maxServers: 5,
        maxPlayers: 50,
        backupsEnabled: true,
        maxBackups: 10,
        prioritySupport: true,
        customDomain: true,
        ddosProtection: true,
        modpackSupport: true,
        pluginSupport: true,
        isActive: true,
        displayOrder: 3,
        features: [
          '4 GB RAM',
          '4 CPU Cores',
          '20 GB Speicher',
          'Bis zu 50 Spieler',
          '5 Server',
          'DDoS-Schutz',
          'Automatische Backups',
          'Priority Support 24/7',
          'Custom Domain',
          'Modpack Support',
          'Plugin Support',
          'MySQL Datenbank'
        ]
      },
      {
        name: 'ultimate',
        displayName: 'Ultimate',
        description: 'Maximale Leistung für große Server',
        priceMonthly: 19.99,
        priceYearly: 199.90,
        ramMB: 8192,
        cpuCores: 8,
        diskMB: 51200,
        maxServers: 10,
        maxPlayers: 100,
        backupsEnabled: true,
        maxBackups: 30,
        prioritySupport: true,
        customDomain: true,
        ddosProtection: true,
        modpackSupport: true,
        pluginSupport: true,
        isActive: true,
        displayOrder: 4,
        features: [
          '8 GB RAM',
          '8 CPU Cores',
          '50 GB Speicher',
          'Bis zu 100 Spieler',
          '10 Server',
          'DDoS-Schutz',
          'Tägliche Backups',
          'VIP Priority Support 24/7',
          'Custom Domain',
          'Dedicated IP',
          'Modpack Support',
          'Plugin Support',
          'MySQL Datenbank',
          'FTP Zugang',
          'Kostenlose Subdomain'
        ]
      }
    ];

    for (const planData of plans) {
      const plan = planRepository.create(planData);
      await planRepository.save(plan);
      console.log(`✅ Created plan: ${planData.displayName}`);
    }

    console.log('✅ All subscription plans created successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    process.exit(1);
  }
}

seedSubscriptionPlans();
