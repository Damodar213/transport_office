// Environment configuration with validation
export interface AppConfig {
  database: {
    url: string
    enabled: boolean
  }
  cloudflare: {
    accountId: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    publicUrl: string
    enabled: boolean
  }
  app: {
    websiteUrl: string
    nodeEnv: string
    isDevelopment: boolean
    isProduction: boolean
  }
  auth: {
    sessionMaxAge: number
    cookieSecure: boolean
  }
}

function getRequiredEnvVar(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`)
  }
  return value
}

function getOptionalEnvVar(name: string, defaultValue: string = ""): string {
  return process.env[name] || defaultValue
}

function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name]
  if (!value) return defaultValue
  return value.toLowerCase() === 'true'
}

function getNumberEnvVar(name: string, defaultValue: number): number {
  const value = process.env[name]
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

export function getConfig(): AppConfig {
  const nodeEnv = getOptionalEnvVar('NODE_ENV', 'development')
  const isDevelopment = nodeEnv === 'development'
  const isProduction = nodeEnv === 'production'
  
  return {
    database: {
      url: getOptionalEnvVar('DATABASE_URL', ''),
      enabled: !!process.env.DATABASE_URL,
    },
    cloudflare: {
      accountId: getOptionalEnvVar('CLOUDFLARE_ACCOUNT_ID'),
      accessKeyId: getOptionalEnvVar('CLOUDFLARE_ACCESS_KEY_ID'),
      secretAccessKey: getOptionalEnvVar('CLOUDFLARE_SECRET_ACCESS_KEY'),
      bucketName: getOptionalEnvVar('CLOUDFLARE_R2_BUCKET_NAME'),
      publicUrl: getOptionalEnvVar('CLOUDFLARE_R2_PUBLIC_URL'),
      enabled: !!(
        process.env.CLOUDFLARE_ACCOUNT_ID &&
        process.env.CLOUDFLARE_ACCESS_KEY_ID &&
        process.env.CLOUDFLARE_SECRET_ACCESS_KEY &&
        process.env.CLOUDFLARE_R2_BUCKET_NAME
      ),
    },
    app: {
      websiteUrl: getOptionalEnvVar('NEXT_PUBLIC_WEBSITE_URL', 'http://localhost:3000'),
      nodeEnv,
      isDevelopment,
      isProduction,
    },
    auth: {
      sessionMaxAge: getNumberEnvVar('SESSION_MAX_AGE', 60 * 60 * 24 * 7), // 7 days
      cookieSecure: getBooleanEnvVar('COOKIE_SECURE', isProduction),
    },
  }
}

// Validate configuration on startup
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const config = getConfig()
  
  // Check database configuration
  if (!config.database.enabled) {
    console.warn("Database is not configured - some features will be disabled")
  }
  
  // Check Cloudflare configuration
  if (!config.cloudflare.enabled) {
    console.warn("Cloudflare R2 is not configured - file uploads will be disabled")
  }
  
  // Validate URLs
  try {
    new URL(config.app.websiteUrl)
  } catch {
    errors.push("NEXT_PUBLIC_WEBSITE_URL is not a valid URL")
  }
  
  if (config.cloudflare.enabled) {
    try {
      new URL(config.cloudflare.publicUrl)
    } catch {
      errors.push("CLOUDFLARE_R2_PUBLIC_URL is not a valid URL")
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Export singleton config instance
export const config = getConfig()

// Log configuration status on import
if (typeof window === 'undefined') { // Only log on server side
  const validation = validateConfig()
  if (validation.valid) {
    console.log("✅ Configuration validated successfully")
  } else {
    console.error("❌ Configuration validation failed:", validation.errors)
  }
}