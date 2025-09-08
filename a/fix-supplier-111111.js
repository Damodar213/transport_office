// Fix missing supplier record for user 111111
// Run this script: node fix-supplier-111111.js

const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixSupplier111111() {
  try {
    console.log('Connecting to database...');
    
    // Check if user 111111 exists
    const userResult = await pool.query(`
      SELECT user_id, role, name, email, mobile, created_at 
      FROM users 
      WHERE user_id = '111111'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('❌ User 111111 not found in users table');
      return;
    }
    
    console.log('✅ Found user 111111:', userResult.rows[0]);
    
    // Check if supplier record already exists
    const existingSupplier = await pool.query(`
      SELECT user_id, company_name, created_at 
      FROM suppliers 
      WHERE user_id = '111111'
    `);
    
    if (existingSupplier.rows.length > 0) {
      console.log('✅ Supplier record already exists:', existingSupplier.rows[0]);
      return;
    }
    
    // Create supplier record
    const supplierResult = await pool.query(`
      INSERT INTO suppliers (
        user_id, 
        company_name, 
        contact_person,
        number_of_vehicles,
        is_verified,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      '111111',
      'Default Company',
      'Default Contact',
      0,
      false,
      true,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    
    console.log('✅ Created supplier record:', supplierResult.rows[0]);
    
    // Verify the record was created
    const verifyResult = await pool.query(`
      SELECT user_id, company_name, contact_person, number_of_vehicles, is_active, created_at 
      FROM suppliers 
      WHERE user_id = '111111'
    `);
    
    console.log('✅ Verification - Supplier record:', verifyResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSupplier111111();


