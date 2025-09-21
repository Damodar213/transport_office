import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"
import { createApiResponse, createApiError } from "@/lib/api-utils"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
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

    console.log("Migrating existing driver documents...")

    // Get all drivers with license documents
    const driversResult = await dbQuery(`
      SELECT d.id, d.supplier_id, d.driver_name, d.license_document_url, d.created_at
      FROM drivers d 
      WHERE d.license_document_url IS NOT NULL AND d.license_document_url != ''
    `)
    
    console.log(`Found ${driversResult.rows.length} drivers with documents to migrate`)
    
    let migratedCount = 0
    for (const driver of driversResult.rows) {
      try {
        // Check if document submission already exists
        const existingDoc = await dbQuery(
          `SELECT id FROM driver_documents WHERE driver_id = $1 AND document_type = 'license'`,
          [driver.id]
        )
        
        if (existingDoc.rows.length === 0) {
          await dbQuery(
            `INSERT INTO driver_documents (driver_id, supplier_id, driver_name, document_type, document_url, submitted_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
            [
              driver.id,
              driver.supplier_id,
              driver.driver_name,
              'license',
              driver.license_document_url,
              driver.created_at || new Date().toISOString()
            ]
          )
          migratedCount++
          console.log(`Migrated driver document for driver ${driver.id}`)
        } else {
          console.log(`Driver document already exists for driver ${driver.id}`)
        }

      } catch (error) {
        console.error(`Error migrating driver document ${driver.id}:`, error)
      }

    }

    console.log(`Migration completed. ${migratedCount} driver documents migrated.`)

    return createApiResponse({
      message: "Driver document migration completed",
      migratedCount,
      totalDrivers: driversResult.rows.length



      }

      }

      }

    })

  } catch (error) {
    console.error("Migration error:", error)
    return createApiError(
      "Failed to migrate driver documents",
      error instanceof Error ? error.message : "Unknown error",
      500
    )
  }

}
