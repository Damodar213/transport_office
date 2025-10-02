// Test database connection
const { Pool } = require('pg');

async function testConnection() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ Basic connection test passed:', result.rows[0]);
    
    // Test users table access
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Users table access test passed:', usersResult.rows[0]);
    
    // Test specific user query (like your app does)
    const userQuery = await pool.query(`
      SELECT u.id, u.user_id as "userId", u.password_hash as "passwordHash", u.role, u.email, u.name, u.mobile, u.created_at as "createdAt"
      FROM users u
      WHERE u.user_id = $1 AND u.role = $2
    `, ['test', 'supplier']);
    
    console.log('✅ User query test passed:', userQuery.rows.length, 'rows returned');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();

