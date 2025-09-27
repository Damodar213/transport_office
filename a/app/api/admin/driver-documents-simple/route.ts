import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all driver documents (SIMPLE VERSION - NO AUTH)
export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Ensure required tables exist
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS driver_documents (
        id SERIAL PRIMARY KEY,
        driver_id VARCHAR(50),
        supplier_id VARCHAR(50),
        driver_name VARCHAR(200),
        document_type VARCHAR(50),
        document_url TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'pending',
        review_notes TEXT,
        reviewed_by VARCHAR(100),
        reviewed_at TIMESTAMP
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS users (
        user_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200),
        email VARCHAR(200),
        mobile VARCHAR(20),
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS suppliers (
        user_id VARCHAR(50) PRIMARY KEY,
        company_name VARCHAR(200),
        gst_number VARCHAR(50),
        number_of_vehicles INTEGER,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Query with JOIN to get supplier information
    const result = await dbQuery(`
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
        s.company_name
      FROM driver_documents dd
      LEFT JOIN users u ON dd.supplier_id = u.user_id
      LEFT JOIN suppliers s ON dd.supplier_id = s.user_id
      ORDER BY dd.submitted_at DESC
    `)

    return NextResponse.json({
      success: true,
      documents: result.rows,
      total: result.rows.length,
      message: "Driver documents retrieved successfully"
    })

  } catch (error) {
    console.error("Driver documents error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch driver documents",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


