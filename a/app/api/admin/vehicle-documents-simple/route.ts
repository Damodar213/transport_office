import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all vehicle documents (SIMPLE VERSION - NO AUTH)
export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Simple query without JOIN for now
    const result = await dbQuery(`
      SELECT 
        vd.id,
        vd.vehicle_id,
        vd.supplier_id,
        vd.vehicle_number,
        vd.document_type,
        vd.document_url,
        vd.submitted_at,
        vd.status,
        vd.review_notes,
        vd.reviewed_by,
        vd.reviewed_at
      FROM vehicle_documents vd
      ORDER BY vd.submitted_at DESC
    `)

    return NextResponse.json({
      success: true,
      documents: result.rows,
      total: result.rows.length,
      message: "Vehicle documents retrieved successfully"
    })

  } catch (error) {
    console.error("Vehicle documents error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch vehicle documents",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


