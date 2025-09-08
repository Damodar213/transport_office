#!/usr/bin/env node

/**
 * Development Environment Setup Script
 * 
 * This script helps set up the development environment for multiple developers
 * working on the same project to avoid conflicts.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupEnvironment() {
  console.log('🚀 Transport Office - Development Environment Setup\n');
  
  // Check if .env.local already exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env.local already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }
  
  console.log('📝 Let\'s set up your development environment...\n');
  
  // Get developer name
  const developerName = await question('👤 Enter your name (for database naming): ');
  const sanitizedName = developerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
  
  // Database setup
  console.log('\n🗄️  Database Configuration:');
  const dbType = await question('Database type (local/cloud) [local]: ') || 'local';
  
  let databaseUrl = '';
  if (dbType === 'local') {
    const dbHost = await question('Database host [localhost]: ') || 'localhost';
    const dbPort = await question('Database port [5432]: ') || '5432';
    const dbName = await question(`Database name [transport_office_${sanitizedName}]: `) || `transport_office_${sanitizedName}`;
    const dbUser = await question('Database username [postgres]: ') || 'postgres';
    const dbPass = await question('Database password: ');
    
    databaseUrl = `postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}`;
  } else {
    databaseUrl = await question('Enter your cloud database URL: ');
  }
  
  // Website URL
  const websiteUrl = await question('Website URL [http://localhost:3000]: ') || 'http://localhost:3000';
  
  // Cloudflare setup (optional)
  console.log('\n☁️  Cloudflare R2 Configuration (Optional):');
  const useCloudflare = await question('Use Cloudflare R2 for file uploads? (y/N): ');
  
  let cloudflareConfig = '';
  if (useCloudflare.toLowerCase() === 'y') {
    const accountId = await question('Cloudflare Account ID: ');
    const accessKeyId = await question('Cloudflare Access Key ID: ');
    const secretKey = await question('Cloudflare Secret Access Key: ');
    const bucketName = await question('R2 Bucket Name: ');
    const publicUrl = await question('R2 Public URL: ');
    
    cloudflareConfig = `
# Cloudflare R2 Configuration
CLOUDFLARE_ACCOUNT_ID=${accountId}
CLOUDFLARE_ACCESS_KEY_ID=${accessKeyId}
CLOUDFLARE_SECRET_ACCESS_KEY=${secretKey}
CLOUDFLARE_R2_BUCKET_NAME=${bucketName}
CLOUDFLARE_R2_PUBLIC_URL=${publicUrl}`;
  }
  
  // Generate .env.local content
  const envContent = `# Transport Office - Development Environment
# Generated on ${new Date().toISOString()}
# Developer: ${developerName}

# Database Configuration
DATABASE_URL=${databaseUrl}

# Application Configuration
NEXT_PUBLIC_WEBSITE_URL=${websiteUrl}
NODE_ENV=development

# Authentication Configuration
SESSION_MAX_AGE=604800
COOKIE_SECURE=false${cloudflareConfig}

# Development Settings
DEBUG_MODE=true
`;
  
  // Write .env.local file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env.local file created successfully!');
  } catch (error) {
    console.error('❌ Error creating .env.local file:', error.message);
    rl.close();
    return;
  }
  
  // Create database setup instructions
  if (dbType === 'local') {
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure PostgreSQL is running');
    console.log(`2. Create the database: CREATE DATABASE transport_office_${sanitizedName};`);
    console.log('3. Run: npm run dev');
    console.log('4. Test connection: curl http://localhost:3000/api/test-db-connection');
  } else {
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure your cloud database is accessible');
    console.log('2. Run: npm run dev');
    console.log('3. Test connection: curl http://localhost:3000/api/test-db-connection');
  }
  
  console.log('\n🎉 Setup complete! Happy coding!');
  rl.close();
}

// Run the setup
setupEnvironment().catch(console.error);


