import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all vehicle documents (SIMPLE VERSION - NO AUTH)
export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    // Query with JOIN to get supplier information
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
        vd.reviewed_at,
        u.name as supplier_name,
        s.company_name
      FROM vehicle_documents vd
      LEFT JOIN users u ON vd.supplier_id = u.user_id
      LEFT JOIN suppliers s ON vd.supplier_id = s.user_id
      ORDER BY vd.submitted_at DESC
    `)

    const response = NextResponse.json({
      success: true,
      documents: result.rows,
      total: result.rows.length,
      message: "Vehicle documents retrieved successfully"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Vehicle documents error:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch vehicle documents",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }