import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all driver documents (SIMPLE VERSION - NO AUTH)
export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Simple query without JOIN for now
    const result = await dbQuery(`
      SELECT 
        dd.id,
        dd.driver_id,
        dd.supplier_id,
        dd.driver_name,
        dd.document_type,
        dd.document_url,
        dd.submitted_at,
        dd.status,
        dd.review_notes,
        dd.reviewed_by,
        dd.reviewed_at
      FROM driver_documents dd
      ORDER BY dd.submitted_at DESC
    `)

    return NextResponse.json({
      success: true,
      documents: result.rows,
      total: result.rows.length,
      message: "Driver documents retrieved successfully"
    })

  } catch (error) {
    console.error("Driver documents error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch driver documents",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


