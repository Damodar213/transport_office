import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all vehicle documents (SIMPLE VERSION - NO AUTH)
export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Ensure required tables exist
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id SERIAL PRIMARY KEY,
        vehicle_id VARCHAR(50),
        supplier_id VARCHAR(50),
        vehicle_number VARCHAR(50),
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
        vd.id,
        vd.vehicle_id,
        vd.supplier_id,
        vd.vehicle_number,
        vd.document_type,
        vd.document_url,
        vd.submitted_at,
        vd.status,
        vd.review_notes,
        vd.reviewed_by,
        vd.reviewed_at,
        u.name as supplier_name,
        s.company_name
      FROM vehicle_documents vd
      LEFT JOIN users u ON vd.supplier_id = u.user_id
      LEFT JOIN suppliers s ON vd.supplier_id = s.user_id
      ORDER BY vd.submitted_at DESC
    `)

    return NextResponse.json({
      success: true,
      documents: result.rows,
      total: result.rows.length,
      message: "Vehicle documents retrieved successfully"
    })

  } catch (error) {
    console.error("Vehicle documents error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch vehicle documents",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


