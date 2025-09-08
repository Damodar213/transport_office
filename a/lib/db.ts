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
    // Configure connection pool with better settings for reliability
    pool = new Pool({ 
      connectionString: url, 
      ssl: getSslOption(url),
      max: 20, // Increased pool size for better concurrency
      min: 2, // Minimum connections to maintain
      idleTimeoutMillis: 30000, // Increased idle timeout
      connectionTimeoutMillis: 30000, // Increased connection timeout
      maxUses: 7500, // Increased max uses per connection
      statement_timeout: 30000, // Increased statement timeout
      query_timeout: 30000, // Increased query timeout
      allowExitOnIdle: false, // Keep pool alive
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
  const maxRetries = 3
  
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
        error.message.includes('server closed')
      )) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Retrying database query in ${retryCount * 1000}ms...`)
          await new Promise(resolve => setTimeout(resolve, retryCount * 1000))
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
  // Neon, Railway, Render often require SSL in production; allow local without
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const likelyCloud = /(neon|railway|render|amazonaws|gcp|azure|supabase|planetscale)/.test(host)
    return likelyCloud ? { rejectUnauthorized: false } : undefined
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





