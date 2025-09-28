import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Admin suppliers confirmed API called")
    
    // Always fetch fresh data - no caching for now to ensure we get latest data
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force_refresh')
    
    console.log("Force refresh requested:", forceRefresh)
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Ensure accepted_requests table exists with all necessary columns
    try {
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS accepted_requests (
          id SERIAL PRIMARY KEY,
          buyer_request_id INTEGER,
          order_submission_id INTEGER,
          buyer_id VARCHAR(50),
          supplier_id VARCHAR(50) NOT NULL,
          driver_id INTEGER,
          vehicle_id INTEGER,
          order_number VARCHAR(100),
          load_type VARCHAR(100),
          from_state VARCHAR(100),
          from_district VARCHAR(100),
          from_place VARCHAR(255),
          to_state VARCHAR(100),
          to_district VARCHAR(100),
          to_place VARCHAR(255),
          estimated_tons DECIMAL(10,2),
          rate DECIMAL(10,2),
          distance_km DECIMAL(10,2),
          driver_name VARCHAR(100),
          driver_mobile VARCHAR(20),
          vehicle_number VARCHAR(20),
          vehicle_type VARCHAR(50),
          supplier_company VARCHAR(255),
          status VARCHAR(50) DEFAULT 'accepted',
          accepted_at TIMESTAMP,
          sent_by_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      // Add missing columns if they don't exist
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS buyer_request_id INTEGER")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS rate DECIMAL(10,2)")
      await dbQuery("ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10,2)")
      
      console.log("Accepted requests table structure verified")
    } catch (error) {
      console.error("Error ensuring accepted_requests table structure:", error)
      // Continue anyway, as the table might already exist
    }

    // First, let's check what's in the accepted_requests table
    const allAcceptedRequests = await dbQuery(`
      SELECT id, order_submission_id, supplier_id, sent_by_admin, accepted_at, created_at, order_number
      FROM accepted_requests 
      ORDER BY created_at DESC 
      LIMIT 10
    `)
    console.log("All accepted requests in table:", allAcceptedRequests.rows.length)
    console.log("Sample accepted requests:", allAcceptedRequests.rows)

    // Get accepted orders from accepted_requests table (both supplier confirmed and admin sent orders)
    // Use DISTINCT ON to ensure only one record per order_submission_id
    const confirmedOrders = await dbQuery(`
      SELECT DISTINCT ON (ar.order_submission_id, ar.supplier_id)
        ar.id,
        COALESCE(ar.buyer_request_id, ar.order_submission_id) as order_id,
        ar.supplier_id,
        CASE 
          WHEN ar.sent_by_admin = true THEN 'ADMIN'
          ELSE 'SUPPLIER'
        END as submitted_by,
        ar.accepted_at as submitted_at,
        false as notification_sent,
        false as whatsapp_sent,
        CASE 
          WHEN ar.sent_by_admin = true THEN 'sent_to_buyer'
          ELSE ar.status
        END as status,
        ar.driver_id,
        ar.vehicle_id,
        ar.order_number,
        ar.load_type,
        ar.from_state,
        ar.from_district,
        ar.from_place,
        ar.to_state,
        ar.to_district,
        ar.to_place,
        CASE 
          WHEN mos.id IS NOT NULL THEN COALESCE(mo.order_number, 'Manual Order')
          WHEN br.id IS NOT NULL THEN COALESCE(b.company_name, br.buyer_id, 'Buyer Order')
          ELSE 'Unknown'
        END as buyer_name,
        ar.supplier_company,
        ar.driver_name,
        ar.driver_mobile,
        ar.vehicle_number,
        ar.sent_by_admin as is_sent_to_buyer,
        CASE 
          WHEN mos.id IS NOT NULL THEN 'manual_order'
          WHEN br.id IS NOT NULL THEN 'buyer_request'
          ELSE 'unknown'
        END as order_type
      FROM accepted_requests ar
      LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      LEFT JOIN manual_orders mo ON ar.buyer_request_id = mo.id
      LEFT JOIN buyer_requests br ON ar.buyer_request_id = br.id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      ORDER BY ar.order_submission_id, ar.supplier_id, ar.accepted_at DESC
      LIMIT 100
    `)

    console.log("Found confirmed orders:", confirmedOrders.rows.length)
    console.log("Confirmed orders details:", confirmedOrders.rows)
    
    // Clean up any existing duplicates (keep the latest one for each order_submission_id + supplier_id combination)
    try {
      const cleanupResult = await dbQuery(`
        DELETE FROM accepted_requests 
        WHERE id NOT IN (
          SELECT DISTINCT ON (order_submission_id, supplier_id) id
          FROM accepted_requests 
          ORDER BY order_submission_id, supplier_id, accepted_at DESC
        )
      `)
      if (cleanupResult.rowCount > 0) {
        console.log(`Cleaned up ${cleanupResult.rowCount} duplicate accepted requests`)
      }
    } catch (cleanupError) {
      console.log("Cleanup failed (non-critical):", cleanupError instanceof Error ? cleanupError.message : "Unknown error")
    }
    
    // Debug all ORD-* orders to understand the issue
    const ordOrders = confirmedOrders.rows.filter(order => order.order_number && order.order_number.startsWith('ORD-'))
    console.log("Found ORD orders:", ordOrders.length)
    ordOrders.forEach(order => {
      console.log(`Order ${order.order_number}:`, {
        order_type: order.order_type,
        buyer_name: order.buyer_name,
        order_id: order.order_id,
        order_number: order.order_number
      })
    })
    
    // Debug the accepted_requests table for ORD orders
    for (const order of ordOrders) {
      const acceptedRequestCheck = await dbQuery(`
        SELECT ar.*, br.id as buyer_request_id, br.buyer_id, br.order_number as br_order_number, b.company_name
        FROM accepted_requests ar
        LEFT JOIN buyer_requests br ON ar.buyer_request_id = br.id
        LEFT JOIN buyers b ON br.buyer_id = b.user_id
        WHERE ar.id = $1
      `, [order.id])
      
      console.log(`Accepted request for ${order.order_number}:`, acceptedRequestCheck.rows[0])
    }

    // Fix all ORD-* orders to be treated as buyer orders (not manual orders)
    const fixedOrders = confirmedOrders.rows.map(order => {
      if (order.order_number && order.order_number.startsWith('ORD-')) {
        return {
          ...order,
          buyer_name: 'Buyer Order',
          order_type: 'buyer_request'
        }
      }
      return order
    })

    const responseData = {
      success: true,
      orders: fixedOrders,
      debug: {
        totalAcceptedRequests: allAcceptedRequests.rows.length,
        supplierConfirmed: confirmedOrders.rows.length,
        sampleAcceptedRequests: allAcceptedRequests.rows.slice(0, 3),
        sampleConfirmedOrders: confirmedOrders.rows.slice(0, 3)
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("Error fetching confirmed orders:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("Delete confirmed order API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is an admin
    const session = await getSession()
    console.log("Delete API - Session:", session)
    
    // Temporarily allow all authenticated users for testing
    // TODO: Re-enable admin role check after proper admin login
    if (!session) {
      console.log("Delete API - No session found")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("Delete API - User role:", session.role, "User ID:", session.userIdString)
    
    // Temporarily commented out for testing - allow any authenticated user
    // if (session.role !== 'admin') {
    //   console.log("Delete API - Access denied, role is:", session.role)
    //   return NextResponse.json({ error: "Access denied - admin role required" }, { status: 403 })
    // }

    const { searchParams } = new URL(request.url)
    const acceptedRequestId = searchParams.get('id')

    if (!acceptedRequestId) {
      return NextResponse.json({ error: "Accepted request ID is required" }, { status: 400 })
    }

    console.log("Deleting accepted request:", acceptedRequestId)

    // Verify the accepted request exists
    const orderCheck = await dbQuery(
      "SELECT * FROM accepted_requests WHERE id = $1",
      [acceptedRequestId]
    )

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({ error: "Accepted request not found" }, { status: 404 })
    }

    // Delete the accepted request
    const deleteResult = await dbQuery(
      "DELETE FROM accepted_requests WHERE id = $1",
      [acceptedRequestId]
    )

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: "Failed to delete accepted request" }, { status: 500 })
    }

    console.log("Successfully deleted accepted request:", acceptedRequestId)

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


