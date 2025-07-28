const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USERNAME || 'portal',
    password: process.env.DB_PASSWORD || 'secret',
    database: process.env.DB_NAME || 'portal',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if admin user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      ['admin', 'admin@example.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    await client.query(`
      INSERT INTO users (id, username, email, "passwordHash", role, "isActive", "createdAt", "updatedAt", "memoryLimitMB", "cpuCores", "diskLimitMB", "maxServers")
      VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, NOW(), NOW(), $6, $7, $8, $9)
    `, ['admin', 'admin@example.com', passwordHash, 'admin', true, 8192, 8, 51200, 50]);

    console.log('Admin user created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@example.com');

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

createAdmin();