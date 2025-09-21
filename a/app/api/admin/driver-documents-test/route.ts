import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { withDatabase, createApiResponse, createApiError } from "@/lib/api-utils"

// GET - Fetch all driver documents (TEST VERSION - NO AUTH)
export async function GET(request: NextRequest) {
  return withDatabase(async () => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `
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
        u.company_name
      FROM driver_documents dd
      LEFT JOIN users u ON dd.supplier_id = u.user_id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (status && status !== 'all') {
      paramCount++
      query += ` AND dd.status = $${paramCount}`
      params.push(status)
    }

    query += ` ORDER BY dd.submitted_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(limit, offset)

    const result = await dbQuery(query, params)
    
    // Group documents by driver for better organization
    const groupedDocuments = result.rows.reduce((acc, doc) => {
      const key = `${doc.driver_id}_${doc.supplier_id}`
      if (!acc[key]) {
        acc[key] = {
          driverId: doc.driver_id,
          supplierId: doc.supplier_id,
          driverName: doc.driver_name,
          supplierName: doc.supplier_name,
          companyName: doc.company_name,
          documents: []
  }
      }

      acc[key].documents.push({
        id: doc.id,
        documentType: doc.document_type,
        documentUrl: doc.document_url,
        submittedAt: doc.submitted_at,
        status: doc.status,
        reviewNotes: doc.review_notes,
        reviewedBy: doc.reviewed_by,
        reviewedAt: doc.reviewed_at
  }
      })
      return acc
    }, {} as Record<string, any>)

    return createApiResponse({
      documents: Object.values(groupedDocuments),
      total: result.rows.length,
      limit,
      offset,
      rawData: result.rows // Include raw data for debugging
  }
    })
  })
}
