import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { withAuth, withDatabase, createApiResponse, createApiError } from "@/lib/api-utils"

export interface SupplierDocument {
  id: number
  user_id: string
  supplier_name: string
  company_name: string
  document_type: string
  document_url: string
  submitted_at: string
  status: "pending" | "approved" | "rejected"
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  email?: string
  mobile?: string
}

// GET - Fetch all supplier documents
export async function GET(request: NextRequest) {
  return withAuth(async (session) => {
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

      const result = await dbQuery<SupplierDocument>(query, params)
      
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
        })
        return acc
      }, {} as Record<string, any>)

      return createApiResponse({
        documents: Object.values(groupedDocuments),
        total: result.rows.length,
        limit,
        offset
      })
    })
  }, ["admin"])
}

// PATCH - Update document status
export async function PATCH(request: NextRequest) {
  return withAuth(async (session) => {
    return withDatabase(async () => {
      const body = await request.json()
      const { id, status, reviewNotes, reviewer } = body

      if (!id || !status) {
        return createApiError("Document ID and status are required", null, 400)
      }

      if (!["approved", "rejected"].includes(status)) {
        return createApiError("Status must be 'approved' or 'rejected'", null, 400)
      }

      const now = new Date().toISOString()
      const result = await dbQuery(
        `UPDATE supplier_documents 
         SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = $4
         WHERE id = $5
         RETURNING *`,
        [status, reviewNotes || null, reviewer || session.name || "Admin", now, id]
      )

      if (result.rows.length === 0) {
        return createApiError("Document not found", null, 404)
      }

      return createApiResponse(result.rows[0], "Document status updated successfully")
    })
  }, ["admin"])
}

// POST - Create document submission (for testing or manual entry)
export async function POST(request: NextRequest) {
  return withAuth(async (session) => {
    return withDatabase(async () => {
      const body = await request.json()
      const { userId, supplierName, companyName, documentType, documentUrl } = body

      if (!userId || !documentType || !documentUrl) {
        return createApiError("userId, documentType, and documentUrl are required", null, 400)
      }

      const now = new Date().toISOString()
      const result = await dbQuery(
        `INSERT INTO supplier_documents (user_id, supplier_name, company_name, document_type, document_url, submitted_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')
         RETURNING *`,
        [userId, supplierName || null, companyName || null, documentType, documentUrl, now]
      )

      return createApiResponse(result.rows[0], "Document submission created successfully")
    })
  }, ["admin"])
}


