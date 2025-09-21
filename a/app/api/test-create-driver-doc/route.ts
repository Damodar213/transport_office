import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

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
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get the first driver from the database
    const driverResult = await dbQuery(`
      SELECT d.id, d.supplier_id, d.driver_name, d.license_document_url
      FROM drivers d 
      WHERE d.license_document_url IS NOT NULL
      LIMIT 1
    `)

    if (driverResult.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "No drivers with documents found",
        message: "Please create a driver with a document first"



        }

        }

        }

    }

    const driver = driverResult.rows[0]
    console.log("Found driver:", driver)

    // Create a driver document submission
    const now = new Date().toISOString()
    const result = await dbQuery(
      `INSERT INTO driver_documents (driver_id, supplier_id, driver_name, document_type, document_url, submitted_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [driver.id, driver.supplier_id, driver.driver_name, 'license', driver.license_document_url, now]
    )

    const response = NextResponse.json({
      success: true,
      message: "Driver document submission created successfully",
      document: result.rows[0]})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Create driver document test error:", error)
    const response = NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }
