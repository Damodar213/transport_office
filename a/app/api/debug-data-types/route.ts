import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
    }

    // Check data types
    const driverDocsTypes = await dbQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'driver_documents' 
      AND column_name IN ('supplier_id', 'driver_id')
      ORDER BY column_name
    `)

    const usersTypes = await dbQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'user_id'
    `)

    // Get sample data
    const sampleDriverDoc = await dbQuery(`
      SELECT supplier_id, driver_id, driver_name
      FROM driver_documents 
      LIMIT 1
    `)

    const sampleUser = await dbQuery(`
      SELECT user_id, name
      FROM users 
      WHERE role = 'supplier'
      LIMIT 1
    `)

    const response = NextResponse.json({
      success: true,
      driverDocsTypes: driverDocsTypes.rows,
      usersTypes: usersTypes.rows,
      sampleDriverDoc: sampleDriverDoc.rows[0] || null,
      sampleUser: sampleUser.rows[0] || null,
      message: "Data types debug completed"
  } catch (error) {
    console.error("Data types debug error:", error)
    const response = NextResponse.json({ 
      error: "Data types debug failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}


