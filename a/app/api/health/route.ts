import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { checkDatabaseHealth } from "@/lib/db"

export async function GET() {
  try {
    // Check database health
    const dbHealth = await checkDatabaseHealth()
    
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: dbHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }
    
    if (!dbHealth.healthy) {
      const response = NextResponse.json(health, { status: 503 })
    return addCorsHeaders(response)
    }
    
    const response = NextResponse.json(health, { status: 200 })
    return addCorsHeaders(response)
  } catch (error) {
    const response = NextResponse.json({
      status: "unhealthy",
      timestamp: new Date()
    return addCorsHeaders(response).toISOString(),
      error: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 503 })
  }
}
