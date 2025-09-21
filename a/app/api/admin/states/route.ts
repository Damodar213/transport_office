import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch unique states from districts
export async function GET() {
  try {
    console.log("Fetching unique states from districts...")
    
    // Check if database is available
    const pool = getPool()
    if (!pool) {
      const response = NextResponse.json({ error: "Database not available",
        states: [] })
        message: "Database connection failed"})
    return addCorsHeaders(response)
  }

    // Fetch unique states from districts
    const result = await dbQuery(`
      SELECT DISTINCT state
      FROM districts
      WHERE is_active = true
      ORDER BY state)
    `)

    const states = result.rows.map(row => row.state)

    const response = NextResponse.json({ states: states,
      total: states.length })
      message: "States fetched successfully"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error fetching states:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch states",
      states: [],
      message: error instanceof Error ? error.message : "Unknown error"


})
    }, { status: 500 })
    return addCorsHeaders(response)
  }
