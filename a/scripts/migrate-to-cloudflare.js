#!/usr/bin/env node

/**
 * Migration script to move existing local files to Cloudflare R2
 * 
 * This script will:
 * 1. Scan the public/uploads directory for existing files
 * 2. Upload them to Cloudflare R2
 * 3. Update the database/document storage with new URLs
 * 4. Optionally delete local files after successful upload
 */

const fs = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Configuration
const config = {
  localUploadsDir: path.join(process.cwd(), 'public', 'uploads'),
  dryRun: process.argv.includes('--dry-run'),
  deleteLocal: process.argv.includes('--delete-local'),
  batchSize: 10, // Process files in batches
};

// Initialize Cloudflare R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

if (!BUCKET_NAME || !PUBLIC_URL) {
  console.error('❌ Missing required environment variables:');
  console.error('   CLOUDFLARE_R2_BUCKET_NAME');
  console.error('   CLOUDFLARE_R2_PUBLIC_URL');
  console.error('   CLOUDFLARE_ACCOUNT_ID');
  console.error('   CLOUDFLARE_ACCESS_KEY_ID');
  console.error('   CLOUDFLARE_SECRET_ACCESS_KEY');
  process.exit(1);
}

/**
 * Recursively find all files in a directory
 */
async function findFiles(dir) {
  const files = [];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subFiles = await findFiles(fullPath);
        files.push(...subFiles);
      } else {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`⚠️  Could not read directory ${dir}:`, error.message);
  }
  
  return files;
}

/**
 * Upload a single file to Cloudflare R2
 */
async function uploadFileToR2(filePath) {
  try {
    const relativePath = path.relative(config.localUploadsDir, filePath);
    const key = relativePath.replace(/\\/g, '/'); // Normalize path separators
    
    const fileBuffer = await fs.readFile(filePath);
    const contentType = getContentType(filePath);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      Metadata: {
        migratedAt: new Date().toISOString(),
        originalPath: filePath,
      },
    });
    
    if (!config.dryRun) {
      await r2Client.send(command);
    }
    
    const newUrl = `${PUBLIC_URL}/${key}`;
    
    return {
      success: true,
      originalPath: filePath,
      newUrl,
      key,
      size: fileBuffer.length,
    };
  } catch (error) {
    return {
      success: false,
      originalPath: filePath,
      error: error.message,
    };
  }
}

/**
 * Get content type based on file extension
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.pdf': 'application/pdf',
    '.webp': 'image/webp',
  };
  
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Update document storage with new URLs
 */
async function updateDocumentStorage(migrationResults) {
  const documentsPath = path.join(process.cwd(), 'data', 'documents.json');
  
  try {
    const documentsData = JSON.parse(await fs.readFile(documentsPath, 'utf-8'));
    let updatedCount = 0;
    
    for (const result of migrationResults) {
      if (!result.success) continue;
      
      // Find documents that reference the old URL
      const oldUrl = `/uploads/${path.relative(config.localUploadsDir, result.originalPath).replace(/\\/g, '/')}`;
      
      for (const submission of documentsData.submissions) {
        if (submission.documentUrl === oldUrl) {
          submission.documentUrl = result.newUrl;
          updatedCount++;
        }
      }
    }
    
    if (!config.dryRun && updatedCount > 0) {
      await fs.writeFile(documentsPath, JSON.stringify(documentsData, null, 2));
      console.log(`📝 Updated ${updatedCount} document references`);
    } else if (config.dryRun) {
      console.log(`📝 Would update ${updatedCount} document references`);
    }
  } catch (error) {
    console.warn('⚠️  Could not update document storage:', error.message);
  }
}

/**
 * Main migration function
 */
async function migrateFiles() {
  console.log('🚀 Starting file migration to Cloudflare R2...');
  console.log(`📁 Scanning directory: ${config.localUploadsDir}`);
  
  if (config.dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be uploaded or deleted');
  }
  
  if (config.deleteLocal) {
    console.log('🗑️  Local files will be deleted after successful upload');
  }
  
  // Find all files
  const files = await findFiles(config.localUploadsDir);
  console.log(`📄 Found ${files.length} files to migrate`);
  
  if (files.length === 0) {
    console.log('✅ No files to migrate');
    return;
  }
  
  // Process files in batches
  const results = [];
  for (let i = 0; i < files.length; i += config.batchSize) {
    const batch = files.slice(i, i + config.batchSize);
    console.log(`📤 Processing batch ${Math.floor(i / config.batchSize) + 1}/${Math.ceil(files.length / config.batchSize)}`);
    
    const batchPromises = batch.map(file => uploadFileToR2(file));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Report results
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log('\n📊 Migration Results:');
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (failed.length > 0) {
    console.log('\n❌ Failed uploads:');
    failed.forEach(f => console.log(`   ${f.originalPath}: ${f.error}`));
  }
  
  // Update document storage
  if (successful.length > 0) {
    console.log('\n📝 Updating document storage...');
    await updateDocumentStorage(successful);
  }
  
  // Delete local files if requested
  if (config.deleteLocal && successful.length > 0 && !config.dryRun) {
    console.log('\n🗑️  Deleting local files...');
    let deletedCount = 0;
    
    for (const result of successful) {
      try {
        await fs.unlink(result.originalPath);
        deletedCount++;
      } catch (error) {
        console.warn(`⚠️  Could not delete ${result.originalPath}:`, error.message);
      }
    }
    
    console.log(`🗑️  Deleted ${deletedCount} local files`);
  }
  
  console.log('\n🎉 Migration completed!');
}

// Run migration
migrateFiles().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});












