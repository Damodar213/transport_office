import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { checkDatabaseHealth, getPool, dbQuery } from "@/lib/db"
import { config } from "@/lib/config"
import { createApiResponse, createApiError } from "@/lib/api-utils"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Check if database is configured
    if (!config.database.enabled) {
      return createApiError(
        "Database not configured",
        "DATABASE_URL environment variable is not set",
        503
      )})
    return addCorsHeaders(response)
  }
    const pool = getPool()
    if (!pool) {
      return createApiError(
        "Database pool not available",
        "Failed to create database connection pool",
        503
      )
    }

    // Test basic connection with health check
    const health = await checkDatabaseHealth()
    
    if (health.healthy) {
      // Get additional database info
      const versionResult = await dbQuery("SELECT version()")
      const tablesResult = await dbQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 10
      `)
      
      return createApiResponse({
        connected: true,
        message: "Database connection successful",
        health: health.message,
        version: versionResult.rows[0]?.version?.split(' ')[0] + ' ' + versionResult.rows[0]?.version?.split(' ')[1],
        tables: tablesResult.rows.length,
        config: {
          databaseEnabled: config.database.enabled,
          nodeEnv: config.app.nodeEnv,
          websiteUrl: config.app.websiteUrl
        }
      }, "Database connection test successful")
    } else {
      return createApiError(
        "Database health check failed",
        health.message,
        503
      )
    }

  } catch (error) {
    console.error("Database connection test failed:", error)
    return createApiError(
      "Database connection failed",
      error instanceof Error ? error.message : "Unknown error",
      503
    )
  }
}