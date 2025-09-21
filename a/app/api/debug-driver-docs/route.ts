import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get driver documents with simple query
    const docsResult = await dbQuery(`
      SELECT 
        dd.id,
        dd.driver_id,
        dd.supplier_id,
        dd.driver_name,
        dd.document_type,
        dd.document_url,
        dd.submitted_at,
        dd.status
      FROM driver_documents dd
      ORDER BY dd.submitted_at DESC 
      LIMIT 5)
    `)

    // Get users table structure
    const usersResult = await dbQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position)
    `)

    const response = NextResponse.json({
      success: true,
      driverDocuments: docsResult.rows,
      usersTableStructure: usersResult.rows,)
      message: "Debug info retrieved"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Debug error:", error)
    const response = NextResponse.json({ 
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
