import { NextResponse } from "next/server"
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
      return NextResponse.json(health, { status: 503 })
    }
    
    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 503 })
  }
}
