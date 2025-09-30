import { Pool } from "pg"

let pool: Pool | null = null
let connectionRetries = 0
const MAX_RETRIES = 3

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.warn("DATABASE_URL not found in environment variables")
    return null
  }
  if (pool) return pool
  
  try {
    // Configure connection pool optimized for serverless (Vercel)
    const isProduction = process.env.NODE_ENV === 'production'
    
    pool = new Pool({ 
      connectionString: url, 
      ssl: getSslOption(url),
      // Serverless-optimized settings
      max: isProduction ? 3 : 1, // Allow more connections in production
      min: 0, // No minimum connections to maintain
      idleTimeoutMillis: isProduction ? 30000 : 10000, // Longer idle timeout for production
      connectionTimeoutMillis: isProduction ? 15000 : 10000, // Longer connection timeout
      maxUses: isProduction ? 100 : 50, // More uses before recycling connection
      statement_timeout: isProduction ? 30000 : 10000, // Longer statement timeout
      query_timeout: isProduction ? 30000 : 10000, // Longer query timeout
      allowExitOnIdle: true, // Allow connections to close when idle
      // Additional serverless optimizations
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    })
    
    // Handle pool errors with better error handling
    pool.on('error', (err) => {
      console.error('Database pool error:', err.message)
      // Only reset pool for critical errors, not for individual client errors
      if (err.message.includes('server closed') || 
          err.message.includes('connection terminated') ||
          err.message.includes('ECONNRESET')) {
        console.log("Critical connection error detected, resetting pool")
        pool = null
        connectionRetries++
      }
    })

    // Handle successful connections
    pool.on('connect', () => {
      connectionRetries = 0 // Reset retry counter on successful connection
    })
    
    return pool
  } catch (error) {
    console.error("Failed to create database pool:", error)
    pool = null
    return null
  }
}

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
  let retryCount = 0
  const isProduction = process.env.NODE_ENV === 'production'
  const maxRetries = isProduction ? 3 : 5 // Fewer retries in production to avoid timeouts
  
  while (retryCount <= maxRetries) {
    const p = getPool()
    if (!p) {
      console.warn("No database connection available, returning empty result")
      return { rows: [] }
    }
    
    try {
      const result = await p.query(sql, params)
      return result
    } catch (error) {
      console.error(`Database query error (attempt ${retryCount + 1}):`, error)
      
      // Check if it's a retryable error
      if (error instanceof Error && (
        error.message.includes('connection') || 
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('server closed') ||
        error.message.includes('connection terminated') ||
        error.message.includes('too many connections') ||
        error.message.includes('Client has encountered a connection error')
      )) {
        if (retryCount < maxRetries) {
          retryCount++
          // Exponential backoff with jitter for serverless
          const baseDelay = isProduction ? 200 : 500
          const delay = baseDelay * Math.pow(2, retryCount) + Math.random() * 100
          console.log(`Retrying database query in ${Math.round(delay)}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
          
          // Reset pool on connection errors (less aggressive in production)
          if (retryCount > (isProduction ? 1 : 2)) {
            console.log("Resetting database pool due to connection errors")
            pool = null
          }
          continue
        } else {
          console.error("Max retries reached, resetting pool")
          pool = null
        }
      }
      
      throw error
    }
  }
  
  // This should never be reached, but just in case
  return { rows: [] }
}

function getSslOption(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const likelyCloud = /(neon|railway|render|amazonaws|gcp|azure|supabase|planetscale)/.test(host)
    
    if (likelyCloud) {
      if (host.includes('supabase')) {
        return { 
          rejectUnauthorized: false,
          ssl: { rejectUnauthorized: false }
        }
      }
      return { rejectUnauthorized: false }
    }
    return undefined
  } catch {
    return undefined
  }
}

// Add connection health check function optimized for serverless
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    // Use a simple, fast query for health check
    const result = await dbQuery("SELECT 1 as health_check", [])
    if (result.rows.length > 0 && result.rows[0].health_check === 1) {
      return { healthy: true, message: "Database connection is healthy" }
    } else {
      return { healthy: false, message: "Database query returned unexpected result" }
    }
  } catch (error) {
    // Reset pool on health check failure
    pool = null
    return { 
      healthy: false, 
      message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }
  }
}

// Add graceful shutdown function
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    try {
      await pool.end()
      console.log("Database pool closed gracefully")
    } catch (error) {
      console.error("Error closing database pool:", error)
    } finally {
      pool = null
    }
  }
}

// Add function to check current connection count
export async function getConnectionCount(): Promise<number> {
  try {
    const result = await dbQuery("SELECT count(*) as connection_count FROM pg_stat_activity WHERE state = 'active'")
    return result.rows[0]?.connection_count || 0
  } catch (error) {
    console.error("Error getting connection count:", error)
    return 0
  }
}

// Add function to close idle connections
export async function closeIdleConnections(): Promise<void> {
  if (pool) {
    try {
      await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '2 minutes'")
      console.log("Closed idle connections")
    } catch (error) {
      console.error("Error closing idle connections:", error)
    }
  }
}

// Add function to force close all connections (for deployment cleanup)
export async function forceCloseAllConnections(): Promise<void> {
  if (pool) {
    try {
      await pool.end()
      console.log("Force closed all database connections")
    } catch (error) {
      console.error("Error force closing connections:", error)
    } finally {
      pool = null
    }
  }
}





