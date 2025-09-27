import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Check driver_documents table
    const docsResult = await dbQuery("SELECT COUNT(*) as count FROM driver_documents")
    const docCount = docsResult.rows[0].count

    // Get sample driver documents
    const sampleDocs = await dbQuery(`
      SELECT dd.id, dd.driver_id, dd.supplier_id, dd.driver_name, dd.document_type, dd.document_url, dd.status
      FROM driver_documents dd 
      ORDER BY dd.submitted_at DESC 
      LIMIT 5
    `)

    return NextResponse.json({
      success: true,
      documentCount: parseInt(docCount),
      sampleDocuments: sampleDocs.rows,
      message: `Found ${docCount} driver documents in database`
    })

  } catch (error) {
    console.error("Driver documents test error:", error)
    return NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


