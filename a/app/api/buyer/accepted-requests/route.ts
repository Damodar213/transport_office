import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Buyer accepted requests API called")
    
    // Check database connection first
    const pool = getPool()
    console.log("Database pool available:", !!pool)
    
    if (!pool) {
      console.log("Database not available, returning empty list")
      return NextResponse.json({ 
        success: true, 
        requests: [],
        message: "Database not available, returning empty list"
      })
    }

    // Verify the user is authenticated and is a buyer
    const session = await getSession()
    console.log("Session:", session)
    
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'buyer') {
      return NextResponse.json({ error: "Access denied - buyer role required" }, { status: 403 })
    }

    const buyerId = session.userIdString
    console.log("Buyer ID:", buyerId)

    // Ensure accepted_requests table exists
    try {
      console.log("Creating accepted_requests table...")
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS accepted_requests (
          id SERIAL PRIMARY KEY,
          buyer_request_id INTEGER,
          order_submission_id INTEGER,
          buyer_id VARCHAR(50) NOT NULL,
          supplier_id VARCHAR(50),
          driver_id INTEGER,
          vehicle_id INTEGER,
          order_number VARCHAR(100),
          load_type VARCHAR(100),
          from_state VARCHAR(100),
          from_district VARCHAR(100),
          from_place VARCHAR(200),
          to_state VARCHAR(100),
          to_district VARCHAR(100),
          to_place VARCHAR(200),
          estimated_tons DECIMAL(8,2),
          rate DECIMAL(10,2),
          distance_km DECIMAL(8,2),
          driver_name VARCHAR(100),
          driver_mobile VARCHAR(20),
          vehicle_number VARCHAR(20),
          vehicle_type VARCHAR(50),
          supplier_company VARCHAR(200),
          status VARCHAR(50) DEFAULT 'pending',
          accepted_at TIMESTAMP,
          sent_by_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Add missing columns if they don't exist (for existing tables)
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS buyer_request_id INTEGER")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS order_submission_id INTEGER")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS buyer_id VARCHAR(50)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS driver_id INTEGER")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS vehicle_id INTEGER")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS order_number VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS load_type VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS from_state VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS from_district VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS from_place VARCHAR(200)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS to_state VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS to_district VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS to_place VARCHAR(200)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS estimated_tons DECIMAL(8,2)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8,2)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS driver_name VARCHAR(100)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS driver_mobile VARCHAR(20)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(20)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS supplier_company VARCHAR(200)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending'")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS sent_by_admin BOOLEAN DEFAULT false")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
      console.log("Table created/verified successfully")
    } catch (tableError) {
      console.error("Error creating table:", tableError)
      return NextResponse.json({ 
        error: "Failed to create table", 
        details: tableError instanceof Error ? tableError.message : "Unknown error" 
      }, { status: 500 })
    }

    // Get accepted requests for this buyer (only admin-sent orders)
    try {
      console.log("Querying accepted requests...")
      
      // First, check if the table has the expected columns
      const columnCheck = await dbQuery(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'accepted_requests' 
        AND column_name IN ('buyer_request_id', 'order_submission_id', 'buyer_id')
      `)
      
      console.log("Available columns:", columnCheck.rows.map(r => r.column_name))
      
      // Use a simpler query that only selects columns that definitely exist
      const acceptedRequests = await dbQuery(`
        SELECT 
          ar.id,
          ar.order_number,
          ar.load_type,
          ar.from_state,
          ar.from_district,
          ar.from_place,
          ar.to_state,
          ar.to_district,
          ar.to_place,
          ar.estimated_tons,
          ar.rate,
          ar.distance_km,
          ar.driver_name,
          ar.driver_mobile,
          ar.vehicle_number,
          ar.vehicle_type,
          ar.supplier_company,
          ar.status,
          ar.accepted_at,
          ar.created_at,
          ar.updated_at,
          ar.sent_by_admin
        FROM accepted_requests ar
        WHERE ar.buyer_id = $1 AND ar.sent_by_admin = true
        ORDER BY ar.accepted_at DESC
      `, [buyerId])
      
      console.log("Query successful, found:", acceptedRequests.rows.length, "requests")
      
      return NextResponse.json({
        success: true,
        requests: acceptedRequests.rows
      })
      
    } catch (queryError) {
      console.error("Error querying accepted requests:", queryError)
      return NextResponse.json({ 
        error: "Failed to query accepted requests", 
        details: queryError instanceof Error ? queryError.message : "Unknown error" 
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error fetching accepted requests:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("Delete accepted request API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is a buyer
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'buyer') {
      return NextResponse.json({ error: "Access denied - buyer role required" }, { status: 403 })
    }

    const buyerId = session.userIdString
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    console.log("Deleting accepted request:", requestId, "for buyer:", buyerId)

    // Verify the accepted request belongs to this buyer
    const requestCheck = await dbQuery(
      "SELECT * FROM accepted_requests WHERE id = $1 AND buyer_id = $2",
      [requestId, buyerId]
    )

    if (requestCheck.rows.length === 0) {
      return NextResponse.json({ error: "Accepted request not found or access denied" }, { status: 404 })
    }

    // Delete the accepted request
    const deleteResult = await dbQuery(
      "DELETE FROM accepted_requests WHERE id = $1 AND buyer_id = $2",
      [requestId, buyerId]
    )

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: "Failed to delete accepted request" }, { status: 500 })
    }

    console.log("Successfully deleted accepted request:", requestId)

    return NextResponse.json({
      success: true,
      message: "Accepted request deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting accepted request:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
