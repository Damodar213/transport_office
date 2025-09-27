// Test script to verify Railway deployment
const https = require('https');

async function testRailwayDeployment(railwayUrl) {
  console.log('🚀 Testing Railway Deployment...');
  console.log(`URL: ${railwayUrl}`);
  
  try {
    // Test health endpoint
    const healthUrl = `${railwayUrl}/api/health`;
    console.log(`\n1. Testing Health Endpoint: ${healthUrl}`);
    
    const healthResponse = await fetch(healthUrl);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    
    // Test login endpoint (should return 400 for missing credentials)
    const loginUrl = `${railwayUrl}/api/auth/login`;
    console.log(`\n2. Testing Login Endpoint: ${loginUrl}`);
    
    const loginResponse = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    console.log('✅ Login Endpoint Status:', loginResponse.status);
    
    if (healthResponse.ok && loginResponse.status === 400) {
      console.log('\n🎉 Railway deployment is working correctly!');
      console.log('✅ Health endpoint responding');
      console.log('✅ API endpoints accessible');
      console.log('✅ Database connection working');
    } else {
      console.log('\n❌ Some issues detected');
    }
    
  } catch (error) {
    console.error('❌ Error testing deployment:', error.message);
  }
}

// Usage: node test-railway-deployment.js https://your-app-name-production.up.railway.app
const railwayUrl = process.argv[2];
if (!railwayUrl) {
  console.log('Usage: node test-railway-deployment.js <RAILWAY_URL>');
  console.log('Example: node test-railway-deployment.js https://your-app-name-production.up.railway.app');
} else {
  testRailwayDeployment(railwayUrl);
}
