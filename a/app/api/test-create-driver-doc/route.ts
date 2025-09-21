import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Get the first driver from the database
    const driverResult = await dbQuery(`
      SELECT d.id, d.supplier_id, d.driver_name, d.license_document_url
      FROM drivers d 
      WHERE d.license_document_url IS NOT NULL
      LIMIT 1
    `)

    if (driverResult.rows.length === 0) {
      return NextResponse.json({ 
        error: "No drivers with documents found",
        message: "Please create a driver with a document first"
      }, { status: 404 })
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

    return NextResponse.json({
      success: true,
      message: "Driver document submission created successfully",
      document: result.rows[0]
    })

  } catch (error) {
    console.error("Create driver document test error:", error)
    return NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


