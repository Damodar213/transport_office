import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { createApiResponse, createApiError } from "@/lib/api-utils"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return createApiError("Database not available", null, 503)
    }

    // Get vehicle document count
    const countResult = await dbQuery("SELECT COUNT(*) as count FROM vehicle_documents")
    const documentCount = countResult.rows[0].count

    // Get sample vehicle documents
    const documentsResult = await dbQuery(`
      SELECT 
        vd.id, vd.vehicle_id, vd.supplier_id, vd.vehicle_number, vd.document_type, 
        vd.document_url, vd.submitted_at, vd.status,
        u.name as supplier_name, u.company_name
      FROM vehicle_documents vd
      LEFT JOIN users u ON vd.supplier_id = u.user_id
      ORDER BY vd.submitted_at DESC 
      LIMIT 10
    `)

    return createApiResponse({
      documentCount: parseInt(documentCount),
      sampleDocuments: documentsResult.rows,
      message: `Found ${documentCount} vehicle documents`
    })

  } catch (error) {
    console.error("Test vehicle documents error:", error)
    return createApiError(
      "Failed to test vehicle documents",
      error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      500
    )
  }
}


