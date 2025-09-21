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
    // Check if supplier_documents table exists
    const tableCheck = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_documents'
      )
    `)

    if (!tableCheck.rows[0].exists) {
      return createApiError("supplier_documents table does not exist", null, 404)
    }

    // Get document count
    const countResult = await dbQuery("SELECT COUNT(*) as count FROM supplier_documents")
    const documentCount = countResult.rows[0].count

    // Get sample documents
    const documentsResult = await dbQuery(`
      SELECT 
        id, user_id, supplier_name, company_name, document_type, 
        document_url, submitted_at, status
      FROM supplier_documents 
      ORDER BY submitted_at DESC 
      LIMIT 10
    `)

    return createApiResponse({
      tableExists: true,
      documentCount: parseInt(documentCount),
      sampleDocuments: documentsResult.rows,
      message: `Found ${documentCount} documents in supplier_documents table`
    })

  } catch (error) {
    console.error("Test supplier documents error:", error)
    return createApiError(
      "Failed to test supplier documents",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}


