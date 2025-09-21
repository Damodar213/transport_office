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
      version: process.version})
    return addCorsHeaders(response)
  }

    if (!dbHealth.healthy) {
    }

  } catch (error) {
    const response = NextResponse.json({
      status: "unhealthy",)
      timestamp: new Date()    
    .toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"


}
  })
    return addCorsHeaders(response)
  }
