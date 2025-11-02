import { AppDataSource } from '../config/database';
import { User, UserRole } from '../models/User';
import bcrypt from 'bcryptjs';

async function seedAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin already exists
    const existingAdmin = await userRepository.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await AppDataSource.destroy();
      return;
    }

    // Create admin user with fast hashing (10 rounds)
    const passwordHash = await bcrypt.hash('admin123', 10);

    const admin = userRepository.create({
      username: 'admin',
      email: 'admin@mchost.local',
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
      memoryLimitMB: 32768,
      cpuCores: 16,
      diskLimitMB: 102400,
      maxServers: 50
    });

    await userRepository.save(admin);
    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
