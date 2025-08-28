import { NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    // Test simple query
    const result = await dbQuery("SELECT NOW() as current_time")
    
    return NextResponse.json({ 
      success: true, 
      message: "Database connection successful",
      data: result.rows[0],
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}








