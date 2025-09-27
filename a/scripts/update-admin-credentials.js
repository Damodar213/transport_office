const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateAdminCredentials() {
  const client = await pool.connect();
  
  try {
    console.log('Starting admin credentials update...');
    
    // Hash the new password
    const newPasswordHash = await bcrypt.hash('T0360j@36', 10);
    console.log('New password hashed successfully');
    
    // Check if 'arun' admin exists in users table
    const userCheck = await client.query(
      'SELECT * FROM users WHERE user_id = $1 AND role = $2',
      ['arun', 'admin']
    );
    
    if (userCheck.rows.length > 0) {
      console.log('Found arun admin in users table, updating...');
      
      // Update the user_id and password in users table
      await client.query(
        'UPDATE users SET user_id = $1, password_hash = $2, name = $3 WHERE user_id = $4 AND role = $5',
        ['Tejas', newPasswordHash, 'Tejas', 'arun', 'admin']
      );
      
      console.log('Updated users table: arun -> Tejas');
    }
    
    // Check if 'arun' admin exists in admins table
    const adminCheck = await client.query(
      'SELECT * FROM admins WHERE user_id = $1',
      ['arun']
    );
    
    if (adminCheck.rows.length > 0) {
      console.log('Found arun admin in admins table, updating...');
      
      // Update the user_id and password in admins table
      await client.query(
        'UPDATE admins SET user_id = $1, password_hash = $2, name = $3 WHERE user_id = $4',
        ['Tejas', newPasswordHash, 'Tejas', 'arun']
      );
      
      console.log('Updated admins table: arun -> Tejas');
    }
    
    // Check if Tejas already exists
    const tejasUserCheck = await client.query(
      'SELECT * FROM users WHERE user_id = $1 AND role = $2',
      ['Tejas', 'admin']
    );
    
    const tejasAdminCheck = await client.query(
      'SELECT * FROM admins WHERE user_id = $1',
      ['Tejas']
    );
    
    if (tejasUserCheck.rows.length === 0 && tejasAdminCheck.rows.length === 0) {
      console.log('Tejas admin not found, creating new admin...');
      
      // Create new admin in users table
      await client.query(
        `INSERT INTO users (user_id, password_hash, role, name, email, mobile, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['Tejas', newPasswordHash, 'admin', 'Tejas', 'tejas@admin.com', '9999999999', new Date()]
      );
      
      // Create new admin in admins table
      await client.query(
        `INSERT INTO admins (user_id, password_hash, name, email, mobile, role, permissions, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['Tejas', newPasswordHash, 'Tejas', 'tejas@admin.com', '9999999999', 'admin', ['all'], new Date()]
      );
      
      console.log('Created new Tejas admin account');
    }
    
    // Verify the update
    const verifyUser = await client.query(
      'SELECT user_id, name, role FROM users WHERE user_id = $1 AND role = $2',
      ['Tejas', 'admin']
    );
    
    const verifyAdmin = await client.query(
      'SELECT user_id, name, role FROM admins WHERE user_id = $1',
      ['Tejas']
    );
    
    console.log('Verification results:');
    console.log('Users table:', verifyUser.rows);
    console.log('Admins table:', verifyAdmin.rows);
    
    console.log('Admin credentials update completed successfully!');
    console.log('New credentials:');
    console.log('Username: Tejas');
    console.log('Password: T0360j@36');
    
  } catch (error) {
    console.error('Error updating admin credentials:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the update
updateAdminCredentials()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
