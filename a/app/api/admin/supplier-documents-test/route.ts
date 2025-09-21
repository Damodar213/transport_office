import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { withDatabase, createApiResponse, createApiError } from "@/lib/api-utils"

// GET - Fetch all supplier documents (TEST VERSION - NO AUTH)
export async function GET(request: NextRequest) {
  return withDatabase(async () => {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `
      SELECT 
        sd.id,
        sd.user_id,
        sd.supplier_name,
        sd.company_name,
        sd.document_type,
        sd.document_url,
        sd.submitted_at,
        sd.status,
        sd.review_notes,
        sd.reviewed_by,
        sd.reviewed_at,
        u.email,
        u.mobile
      FROM supplier_documents sd
      LEFT JOIN users u ON sd.user_id = u.user_id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (status && status !== 'all') {
      paramCount++
      query += ` AND sd.status = $${paramCount}`
      params.push(status)
    }

    query += ` ORDER BY sd.submitted_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(limit, offset)

    const result = await dbQuery(query, params)
    
    // Group documents by supplier for better organization
    const groupedDocuments = result.rows.reduce((acc, doc) => {
      const key = doc.user_id
      if (!acc[key]) {
        acc[key] = {
          userId: doc.user_id,
          supplierName: doc.supplier_name,
          companyName: doc.company_name,
          email: doc.email,
          mobile: doc.mobile,
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
