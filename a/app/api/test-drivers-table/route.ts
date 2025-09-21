import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check drivers table
    const driversResult = await dbQuery("SELECT COUNT(*) as count FROM drivers")
    const driverCount = driversResult.rows[0].count

    // Get sample drivers
    const sampleDrivers = await dbQuery(`
      SELECT d.id, d.supplier_id, d.driver_name, d.license_document_url, d.created_at
      FROM drivers d 
      ORDER BY d.created_at DESC 
      LIMIT 5
    `)

    const response = NextResponse.json({
      success: true,
      driverCount: parseInt(driverCount)    
    ,
      sampleDrivers: sampleDrivers.rows,
      message: `Found ${driverCount} drivers in database`
  } catch (error) {
    console.error("Drivers table test error:", error)
    const response = NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
  }
  })
    return addCorsHeaders(response)
  }
