import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { withAuth, withDatabase, createApiResponse, createApiError } from "@/lib/api-utils"
import { deleteFromR2, extractKeyFromUrl, isR2Url } from "@/lib/cloudflare-r2"

export interface DriverDocument {
  id: number
  driver_id: number
  supplier_id: string
  driver_name: string
  document_type: string
  document_url: string
  submitted_at: string
  status: "pending" | "approved" | "rejected"
  review_notes?: string
  reviewed_by?: string
  reviewed_at?: string
  supplier_name?: string
  company_name?: string
}

// GET - Fetch all driver documents
export async function GET(request: NextRequest) {
  return withAuth(async (session) => {
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

      const result = await dbQuery<DriverDocument>(query, params)
      
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

// PATCH - Update driver document status
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
        `UPDATE driver_documents 
         SET status = $1, review_notes = $2, reviewed_by = $3, reviewed_at = $4
         WHERE id = $5
         RETURNING *`,
        [status, reviewNotes || null, reviewer || session.name || "Admin", now, id]
      )

      if (result.rows.length === 0) {
        return createApiError("Document not found", null, 404)
      }

      return createApiResponse(result.rows[0], "Driver document status updated successfully")
    })
  }, ["admin"])
}

// DELETE - Delete driver document
export async function DELETE(request: NextRequest) {
  return withAuth(async (session) => {
    return withDatabase(async () => {
      const { searchParams } = new URL(request.url)
      const id = searchParams.get('id')

      if (!id) {
        return createApiError("Document ID is required", null, 400)
      }

      // First, get the document to retrieve the file URL before deleting
      const getResult = await dbQuery(
        `SELECT document_url FROM driver_documents WHERE id = $1`,
        [id]
      )

      if (getResult.rows.length === 0) {
        return createApiError("Document not found", null, 404)
      }

      const documentUrl = getResult.rows[0].document_url

      // Delete from database
      const result = await dbQuery(
        `DELETE FROM driver_documents WHERE id = $1 RETURNING *`,
        [id]
      )

      // Delete from Cloudflare R2 if the URL is an R2 URL
      if (documentUrl && isR2Url(documentUrl)) {
        try {
          const key = extractKeyFromUrl(documentUrl)
          await deleteFromR2(key)
          console.log(`Successfully deleted file from R2: ${key}`)
        } catch (error) {
          console.error(`Failed to delete file from R2: ${error}`)
          // Don't fail the entire operation if R2 deletion fails
        }
      }

      return createApiResponse(result.rows[0], "Driver document deleted successfully")
    })
  }, ["admin"])
}


