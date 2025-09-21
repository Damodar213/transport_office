import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all driver documents (SIMPLE VERSION - NO AUTH)
export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Query with JOIN to get supplier information
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
        dd.reviewed_at,
        u.name as supplier_name,
        s.company_name
      FROM driver_documents dd
      LEFT JOIN users u ON dd.supplier_id = u.user_id
      LEFT JOIN suppliers s ON dd.supplier_id = s.user_id
      ORDER BY dd.submitted_at DESC
    `)

    const response = NextResponse.json({
      success: true,
      documents: result.rows,
      total: result.rows.length,
      message: "Driver documents retrieved successfully"
  }
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Driver documents error:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch driver documents",
      details: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
    return addCorsHeaders(response)
  }
