import { Pool } from "pg"

let pool: Pool | null = null

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (pool) return pool
  
  // Configure connection pool with better settings for reliability
  pool = new Pool({ 
    connectionString: url, 
    ssl: getSslOption(url),
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
  })
  
  // Handle pool errors
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
    // Reset pool on error
    pool = null
  })
  
  return pool
}

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
  const p = getPool()
  if (!p) {
    // Return empty result instead of throwing error when no database
    console.log("No database connection available, returning empty result")
    return { rows: [] }
  }
  
  try {
    return await p.query(sql, params)
  } catch (error) {
    console.error("Database query error:", error)
    
    // If it's a connection error, reset the pool
    if (error instanceof Error && (
      error.message.includes('connection') || 
      error.message.includes('timeout') ||
      error.message.includes('ECONNRESET')
    )) {
      console.log("Connection error detected, resetting pool")
      pool = null
    }
    
    throw error
  }
}

function getSslOption(url: string) {
  // Neon, Railway, Render often require SSL in production; allow local without
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    const likelyCloud = /(neon|railway|render|amazonaws|gcp|azure)/.test(host)
    return likelyCloud ? { rejectUnauthorized: false } : undefined
  } catch {
    return undefined
  }
}





