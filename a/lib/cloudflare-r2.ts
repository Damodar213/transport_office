import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Validate environment variables
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

// Cloudflare R2 configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL

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
    console.log("Uploading to R2:", {
      key,
      contentType,
      fileSize: file.length,
      bucketName: BUCKET_NAME,
      endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    })

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    })

    await r2Client.send(command)
    console.log("Successfully uploaded to R2:", key)

    return {
      url: `${PUBLIC_URL}/${key}`,
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
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
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
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    await r2Client.send(command)
  } catch (error) {
    console.error('Error deleting from R2:', error)
    throw new Error('Failed to delete file from Cloudflare R2')
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
  return url.includes('r2.cloudflarestorage.com') || url.includes(PUBLIC_URL)
}
