import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"
import { createApiResponse, createApiError } from "@/lib/api-utils"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return createApiError("Database not available", null, 503)})
    return addCorsHeaders(response)
  }
    // Check if driver_documents table exists
    const tableCheck = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_documents'
      )
    `)

    if (!tableCheck.rows[0].exists) {
      return createApiError("driver_documents table does not exist", null, 404)
    }

    // Get driver document count
    const countResult = await dbQuery("SELECT COUNT(*) as count FROM driver_documents")
    const documentCount = countResult.rows[0].count

    // Get sample driver documents
    const documentsResult = await dbQuery(`
      SELECT 
        dd.id, dd.driver_id, dd.supplier_id, dd.driver_name, dd.document_type, 
        dd.document_url, dd.submitted_at, dd.status,
        u.name as supplier_name, u.company_name
      FROM driver_documents dd
      LEFT JOIN users u ON dd.supplier_id = u.user_id
      ORDER BY dd.submitted_at DESC 
      LIMIT 10
    `)

    return createApiResponse({
      documentCount: parseInt(documentCount),
      sampleDocuments: documentsResult.rows,
      message: `Found ${documentCount} driver documents`
    })

  } catch (error) {
    console.error("Test driver documents error:", error)
    return createApiError(
      "Failed to test driver documents",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}
