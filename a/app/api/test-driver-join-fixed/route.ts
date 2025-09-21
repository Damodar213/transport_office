import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Test the JOIN with explicit casting
    const joinTest = await dbQuery(`
      SELECT 
        dd.id,
        dd.driver_id,
        dd.supplier_id,
        dd.driver_name,
        dd.document_type,
        dd.document_url,
        dd.submitted_at,
        dd.status,
        u.name as supplier_name,
        u.company_name
      FROM driver_documents dd
      LEFT JOIN users u ON dd.supplier_id::text = u.user_id
      ORDER BY dd.submitted_at DESC
      LIMIT 5)
    `)

    const response = NextResponse.json({ success: true,
      documents: joinTest.rows })
      message: "Join test with casting completed"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Join test error:", error)
    const response = NextResponse.json({ 
      error: "Join test failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
