#!/usr/bin/env node

/**
 * Setup Script for Supplier Documents
 * 
 * This script sets up the supplier documents table and migrates existing data
 */

const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function setupSupplierDocuments() {
  console.log('🚀 Setting up Supplier Documents System...\n');
  
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
  const migrationUrl = `${baseUrl}/api/migrate-create-supplier-documents`;
  
  try {
    console.log('📋 Creating supplier_documents table...');
    const response = await makeRequest(migrationUrl);
    
    if (response.status === 200) {
      console.log('✅ Supplier documents table created successfully!');
      console.log('📊 Migration completed');
      
      // Test the new API endpoint
      console.log('\n🧪 Testing API endpoint...');
      const testUrl = `${baseUrl}/api/admin/supplier-documents`;
      
      try {
        const testResponse = await makeRequest(testUrl, { method: 'GET' });
        if (testResponse.status === 200) {
          console.log('✅ API endpoint is working correctly');
          console.log(`📈 Found ${testResponse.data.data?.documents?.length || 0} supplier document groups`);
        } else {
          console.log('⚠️  API endpoint test failed:', testResponse.data);
        }
      } catch (testError) {
        console.log('⚠️  Could not test API endpoint:', testError.message);
      }
      
    } else {
      console.error('❌ Failed to create supplier documents table:', response.data);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error setting up supplier documents:', error.message);
    process.exit(1);
  }
  
  console.log('\n🎉 Setup complete! Your supplier documents system is now dynamic.');
  console.log('\n📋 Next steps:');
  console.log('1. Visit your admin dashboard');
  console.log('2. Go to Document Review tab');
  console.log('3. You should now see all supplier documents dynamically loaded from the database');
}

// Run the setup
setupSupplierDocuments().catch(console.error);


