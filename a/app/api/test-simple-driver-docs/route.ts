import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Simple test - just check if table exists
    const result = await dbQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' )
      AND table_name IN ('driver_documents', 'vehicle_documents')
    `)

    const response = NextResponse.json({
      success: true,)
      tables: result.rows.map(row => row.table_name)    
    ,
      message: "Tables check completed"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Simple test error:", error)
    const response = NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
