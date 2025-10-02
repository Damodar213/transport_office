// Script to reset order numbering to start from ORD-1
const { Pool } = require('pg');
const fs = require('fs');

async function resetOrders() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔄 Resetting order data...');
    
    // Read the SQL reset script
    const resetSQL = fs.readFileSync('../reset-orders.sql', 'utf8');
    
    // Execute the reset
    await pool.query(resetSQL);
    
    console.log('✅ Order data reset successfully!');
    console.log('📋 Next orders will start from:');
    console.log('   - Buyer requests: ORD-1');
    console.log('   - Manual orders: MO-1');
    console.log('   - Mock orders: ORD-1');
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
  } finally {
    await pool.end();
  }
}

resetOrders();
