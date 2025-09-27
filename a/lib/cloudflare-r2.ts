// Conditional imports to avoid issues in browser environment
let S3Client: any, PutObjectCommand: any, GetObjectCommand: any, DeleteObjectCommand: any, ListObjectsV2Command: any, getSignedUrl: any

try {
  if (typeof window === 'undefined') {
    // Only import AWS SDK on server side
    const s3Module = require('@aws-sdk/client-s3')
    const presignerModule = require('@aws-sdk/s3-request-presigner')
    
    S3Client = s3Module.S3Client
    PutObjectCommand = s3Module.PutObjectCommand
    GetObjectCommand = s3Module.GetObjectCommand
    DeleteObjectCommand = s3Module.DeleteObjectCommand
    ListObjectsV2Command = s3Module.ListObjectsV2Command
    getSignedUrl = presignerModule.getSignedUrl
  }
} catch (error) {
  console.log('AWS SDK not available:', error)
}

// Validate environment variables (only in runtime, not during build)
const validateCloudflareConfig = () => {
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID environment variable is required')
  }
  if (!process.env.CLOUDFLARE_ACCESS_KEY_ID) {
    throw new Error('CLOUDFLARE_ACCESS_KEY_ID environment variable is required')
  }
  if (!process.env.CLOUDFLARE_SECRET_ACCESS_KEY) {
    throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY environment variable is required')
  }
  if (!process.env.CLOUDFLARE_R2_BUCKET_NAME) {
    throw new Error('CLOUDFLARE_R2_BUCKET_NAME environment variable is required')
  }
  if (!process.env.CLOUDFLARE_R2_PUBLIC_URL) {
    throw new Error('CLOUDFLARE_R2_PUBLIC_URL environment variable is required')
  }
}

// Cloudflare R2 configuration (created when needed)
const getR2Client = () => {
  if (!S3Client) {
    throw new Error('AWS SDK not available - cannot create R2 client')
  }
  validateCloudflareConfig()
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    },
  })
}

const getBucketName = () => {
  validateCloudflareConfig()
  return process.env.CLOUDFLARE_R2_BUCKET_NAME!
}

const getPublicUrl = () => {
  validateCloudflareConfig()
  return process.env.CLOUDFLARE_R2_PUBLIC_URL!
}

export interface CloudflareUploadResult {
  url: string
  key: string
  size: number
  type: string
}

export interface CloudflareFileInfo {
  key: string
  url: string
  size: number
  type: string
  lastModified: Date
}

/**
 * Upload a file to Cloudflare R2
 */
export async function uploadToR2(
  file: Buffer,
  key: string,
  contentType: string,
  metadata?: Record<string, string>
): Promise<CloudflareUploadResult> {
  try {
    if (!PutObjectCommand) {
      throw new Error('AWS SDK not available - PutObjectCommand not loaded')
    }
    
    const r2Client = getR2Client()
    const bucketName = getBucketName()
    const publicUrl = getPublicUrl()
    
    console.log("Uploading to R2:", {
      key,
      contentType,
      fileSize: file.length,
      bucketName,
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    })

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    })

    await r2Client.send(command)
    console.log("Successfully uploaded to R2:", key)

    return {
      url: `${publicUrl}/${key}`,
      key,
      size: file.length,
      type: contentType,
    }
  } catch (error) {
    console.error('Error uploading to R2:', error)
    console.error('R2 Configuration:', {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? 'Set' : 'Missing',
      accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID ? 'Set' : 'Missing',
      secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    })
    throw new Error(`Failed to upload file to Cloudflare R2: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get a signed URL for private file access
 */
export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    if (!GetObjectCommand || !getSignedUrl) {
      throw new Error('AWS SDK not available - GetObjectCommand or getSignedUrl not loaded')
    }
    
    const r2Client = getR2Client()
    const bucketName = getBucketName()
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    return await getSignedUrl(r2Client, command, { expiresIn })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    throw new Error('Failed to generate download URL')
  }
}

/**
 * Delete a file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    if (!DeleteObjectCommand) {
      throw new Error('AWS SDK not available - DeleteObjectCommand not loaded')
    }
    
    const r2Client = getR2Client()
    const bucketName = getBucketName()
    
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('Error deleting from R2:', error)
    throw new Error('Failed to delete file from Cloudflare R2')
  }
}

/**
 * List all files in R2 bucket
 */
export async function listR2Files(prefix?: string): Promise<CloudflareFileInfo[]> {
  try {
    if (!ListObjectsV2Command) {
      throw new Error('AWS SDK not available - ListObjectsV2Command not loaded')
    }
    
    const r2Client = getR2Client()
    const bucketName = getBucketName()
    const publicUrl = getPublicUrl()
    
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    })

    const response = await r2Client.send(command)
    
    return (response.Contents || []).map((obj: any) => ({
      key: obj.Key,
      url: `${publicUrl}/${obj.Key}`,
      size: obj.Size,
      type: obj.ContentType || 'application/octet-stream',
      lastModified: obj.LastModified,
    }))
  } catch (error) {
    console.error('Error listing R2 files:', error)
    throw new Error('Failed to list files from Cloudflare R2')
  }
}

/**
 * Generate a unique key for file storage
 */
export function generateFileKey(category: string, filename: string, userId?: string): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  if (userId) {
    return `${category}/${userId}/${timestamp}_${sanitizedFilename}`
  }
  
  return `${category}/${timestamp}_${sanitizedFilename}`
}

/**
 * Extract key from R2 URL
 */
export function extractKeyFromUrl(url: string): string {
  const urlObj = new URL(url)
  return urlObj.pathname.substring(1) // Remove leading slash
}

/**
 * Check if URL is a Cloudflare R2 URL
 */
export function isR2Url(url: string): boolean {
  try {
    const publicUrl = getPublicUrl()
    return url.includes('r2.cloudflarestorage.com') || url.includes(publicUrl)
  } catch {
    // If environment variables are not set, just check for R2 domain
    return url.includes('r2.cloudflarestorage.com')
  }
}