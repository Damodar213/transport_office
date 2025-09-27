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
    // Configure connection pool with Railway-friendly settings
    pool = new Pool({ 
      connectionString: url, 
      ssl: getSslOption(url),
      max: 3, // Reduced for free tier resource limits
      min: 1, // Minimum connections to maintain
      idleTimeoutMillis: 10000, // Reduced for faster cleanup
      connectionTimeoutMillis: 10000, // Reduced timeout
      maxUses: 100, // Reduced to free connections faster
      statement_timeout: 10000, // Reduced statement timeout
      query_timeout: 10000, // Reduced query timeout
      allowExitOnIdle: true, // Allow connections to close when idle
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
  const maxRetries = 5 // Increased retries
  
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
        error.message.includes('too many connections')
      )) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Retrying database query in ${retryCount * 500}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryCount * 500))
          // Reset pool on connection errors
          if (retryCount > 2) {
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

// Add connection health check function
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; message: string }> {
  try {
    const result = await dbQuery("SELECT 1 as health_check")
    if (result.rows.length > 0 && result.rows[0].health_check === 1) {
      return { healthy: true, message: "Database connection is healthy" }
    } else {
      return { healthy: false, message: "Database query returned unexpected result" }
    }
  } catch (error) {
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
      await pool.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '5 minutes'")
      console.log("Closed idle connections")
    } catch (error) {
      console.error("Error closing idle connections:", error)
    }
  }
}





