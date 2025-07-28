const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function resetPassword(username, newPassword) {
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

    const passwordHash = await bcrypt.hash(newPassword, 12);
    
    const result = await client.query(
      'UPDATE users SET "passwordHash" = $1, "updatedAt" = NOW() WHERE username = $2 RETURNING username',
      [passwordHash, username]
    );

    if (result.rows.length > 0) {
      console.log(`Password updated for user: ${username}`);
      console.log(`New password: ${newPassword}`);
    } else {
      console.log(`User ${username} not found`);
    }

  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await client.end();
  }
}

// Get command line arguments
const username = process.argv[2] || 'admin';
const password = process.argv[3] || 'admin123';

console.log(`Resetting password for user: ${username}`);
resetPassword(username, password);