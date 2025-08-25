import { Pool } from "pg"

let pool: Pool | null = null

export function getPool(): Pool | null {
  const url = process.env.DATABASE_URL
  if (!url) return null
  if (pool) return pool
  pool = new Pool({ connectionString: url, ssl: getSslOption(url) })
  return pool
}

export async function dbQuery<T = any>(sql: string, params: any[] = []): Promise<{ rows: T[] }> {
  const p = getPool()
  if (!p) {
    // Return empty result instead of throwing error when no database
    console.log("No database connection available, returning empty result")
    return { rows: [] }
  }
  return p.query(sql, params)
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





