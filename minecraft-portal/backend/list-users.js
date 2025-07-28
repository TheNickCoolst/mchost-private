const { Client } = require('pg');

async function listUsers() {
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

    const result = await client.query('SELECT username, email, role, "isActive" FROM users');
    
    console.log('Users in database:');
    console.table(result.rows);

  } catch (error) {
    console.error('Error listing users:', error);
  } finally {
    await client.end();
  }
}

listUsers();