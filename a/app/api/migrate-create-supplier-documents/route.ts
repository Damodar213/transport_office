import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"
import { createApiResponse, createApiError } from "@/lib/api-utils"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
  }
export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const pool = getPool()
    if (!pool) {
      return createApiError("Database not available", null, 503)
    }
    console.log("Creating supplier_documents table...")

    // Create supplier_documents table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS supplier_documents (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        supplier_name VARCHAR(255),
        company_name VARCHAR(255),
        document_type VARCHAR(50) NOT NULL,
        document_url TEXT NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        review_notes TEXT,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create indexes for better performance
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_supplier_documents_user_id ON supplier_documents(user_id)
    `)
    
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_supplier_documents_status ON supplier_documents(status)
    `)
    
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_supplier_documents_submitted_at ON supplier_documents(submitted_at)
    `)

    // Migrate existing data from JSON file if it exists
    try {
      const fs = require('fs')
      const path = require('path')
      const documentsPath = path.join(process.cwd(), 'data', 'documents.json')
      
      if (fs.existsSync(documentsPath)) {
        const documentsData = JSON.parse(fs.readFileSync(documentsPath, 'utf8'))
        console.log(`Found ${documentsData.submissions?.length || 0} existing document submissions to migrate`)
        
        if (documentsData.submissions && documentsData.submissions.length > 0) {
          for (const submission of documentsData.submissions) {
            try {
              await dbQuery(
                `INSERT INTO supplier_documents (user_id, supplier_name, company_name, document_type, document_url, submitted_at, status, review_notes, reviewed_by, reviewed_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                 ON CONFLICT DO NOTHING`,
                [
                  submission.userId,
                  submission.supplierName,
                  submission.companyName,
                  submission.documentType,
                  submission.documentUrl,
                  submission.submittedAt ? new Date(submission.submittedAt).toISOString() : new Date().toISOString(),
                  submission.status || 'pending',
                  submission.reviewNotes || null,
                  submission.reviewedBy || null,
                  submission.reviewedAt ? new Date(submission.reviewedAt).toISOString() : null
                ]
              )})
    return addCorsHeaders(response)

  } catch (error) {
              console.error(`Error migrating document ${submission.id}:`, error)
            }
          }
          console.log("Document migration completed")
        }
      }
    } catch (migrationError) {
      console.warn("Could not migrate existing documents:", migrationError)
    }

    // Also migrate documents from users table
    try {
      const usersResult = await dbQuery(`
        SELECT user_id, name, company_name, documents, email, mobile
        FROM users 
        WHERE role = 'supplier' AND documents IS NOT NULL AND documents != '{}'
      `)
      
      console.log(`Found ${usersResult.rows.length} suppliers with documents to migrate`)
      
      for (const user of usersResult.rows) {
        const documents = typeof user.documents === 'string' ? JSON.parse(user.documents) : user.documents
        
        for (const [docType, docUrl] of Object.entries(documents)) {
          if (docUrl && typeof docUrl === 'string') {
            try {
              await dbQuery(
                `INSERT INTO supplier_documents (user_id, supplier_name, company_name, document_type, document_url, submitted_at, status)
                 VALUES ($1, $2, $3, $4, $5, $6, 'pending')
                 ON CONFLICT DO NOTHING`,
                [
                  user.user_id,
                  user.name,
                  user.company_name,
                  docType,
                  docUrl,
                  new Date().toISOString()
                ]
              )})
    return addCorsHeaders(response)

  } catch (error) {
              console.error(`Error migrating user document ${user.user_id}-${docType}:`, error)
            }
          }
        }
      }
      console.log("User document migration completed")
    } catch (userMigrationError) {
      console.warn("Could not migrate user documents:", userMigrationError)
    }

    return createApiResponse({
      message: "supplier_documents table created successfully",
      migrated: true
    })

  } catch (error) {
    console.error("Migration error:", error)
    return createApiError(
      "Failed to create supplier_documents table",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }
}


