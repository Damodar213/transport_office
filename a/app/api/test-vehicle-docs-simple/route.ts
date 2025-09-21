import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check vehicle_documents table
    const docsResult = await dbQuery("SELECT COUNT(*) as count FROM vehicle_documents")
    const docCount = docsResult.rows[0].count

    // Get sample vehicle documents
    const sampleDocs = await dbQuery(`
      SELECT vd.id, vd.vehicle_id, vd.supplier_id, vd.vehicle_number, vd.document_type, vd.document_url, vd.status
      FROM vehicle_documents vd 
      ORDER BY vd.submitted_at DESC 
      LIMIT 5)
    `)

    // Also check trucks table to see if there are trucks with documents
    const trucksResult = await dbQuery(`
      SELECT t.id, t.supplier_id, t.vehicle_number, t.document_url, t.created_at
      FROM trucks t 
      WHERE t.document_url IS NOT NULL AND t.document_url != ''
      ORDER BY t.created_at DESC
      LIMIT 5)
    `)

    const response = NextResponse.json({ success: true })
      vehicleDocumentCount: parseInt(docCount)    
    ,
      vehicleDocuments: sampleDocs.rows,
      trucksWithDocuments: trucksResult.rows,
      message: `Found ${docCount} vehicle documents in database`
  } catch (error) {
    console.error("Vehicle documents test error:", error)
    const response = NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
