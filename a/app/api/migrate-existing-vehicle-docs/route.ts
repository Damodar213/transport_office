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

    console.log("Migrating existing vehicle documents...")

    // Get all trucks with documents
    const trucksResult = await dbQuery(`
      SELECT t.id, t.supplier_id, t.vehicle_number, t.document_url, t.created_at
      FROM trucks t 
      WHERE t.document_url IS NOT NULL AND t.document_url != ''
    `)
    
    console.log(`Found ${trucksResult.rows.length} trucks with documents to migrate`)
    
    let migratedCount = 0
    for (const truck of trucksResult.rows) {
      try {
        // Check if document submission already exists
        const existingDoc = await dbQuery(
          `SELECT id FROM vehicle_documents WHERE vehicle_id = $1 AND document_type = 'rc'`,
          [truck.id]
        )
        
        if (existingDoc.rows.length === 0) {
          await dbQuery(
            `INSERT INTO vehicle_documents (vehicle_id, supplier_id, vehicle_number, document_type, document_url, submitted_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
            [
              truck.id,
              truck.supplier_id,
              truck.vehicle_number,
              'rc',
              truck.document_url,
              truck.created_at || new Date().toISOString()
            ]
          )
          migratedCount++
          console.log(`Migrated vehicle document for truck ${truck.id}`)
        } else {
          console.log(`Vehicle document already exists for truck ${truck.id}`)
        }
      } catch (error) {
        console.error(`Error migrating vehicle document ${truck.id}:`, error)
      }
    }
    
    console.log(`Migration completed. ${migratedCount} vehicle documents migrated.`)

    return createApiResponse({
      message: "Vehicle document migration completed",
      migratedCount,
      totalTrucks: trucksResult.rows.length
    })

  } catch (error) {
    console.error("Migration error:", error)
    return createApiError(
      "Failed to migrate vehicle documents",
      error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      500
    )
  }
}


