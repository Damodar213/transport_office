import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

// Simple in-memory cache
let cache: { data: any; timestamp: number } | null = null
const CACHE_DURATION = 5000 // 5 seconds (reduced for better responsiveness)

export async function GET(request: NextRequest) {
  try {
    console.log("Admin suppliers confirmed API called")
    
    // Check for cache-busting parameter
    const { searchParams } = new URL(request.url)
    const cacheBust = searchParams.get('cache_bust')
    
    // Check cache first (skip if cache-busting)
    if (!cacheBust && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log("Returning cached data")
      return NextResponse.json(cache.data)
    }
    
    if (cacheBust) {
      console.log("Cache busting requested, clearing cache")
      cache = null
    }
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get accepted orders from accepted_requests table where sent_by_admin = false (all supplier confirmed orders)
    const confirmedOrders = await dbQuery(`
      SELECT 
        ar.id,
        ar.order_submission_id as order_id,
        ar.supplier_id,
        'SUPPLIER' as submitted_by,
        ar.accepted_at as submitted_at,
        false as notification_sent,
        false as whatsapp_sent,
        ar.status,
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
          WHEN mos.id IS NOT NULL THEN 'Manual Order'
          WHEN os.id IS NOT NULL THEN COALESCE(b.company_name, u.name, br.buyer_id, 'Unknown Buyer')
          ELSE 'Unknown'
        END as buyer_name,
        ar.supplier_company,
        ar.driver_name,
        ar.driver_mobile,
        ar.vehicle_number,
        CASE WHEN sent_orders.id IS NOT NULL THEN true ELSE false END as is_sent_to_buyer,
        CASE 
          WHEN mos.id IS NOT NULL THEN 'manual_order'
          WHEN os.id IS NOT NULL THEN 'buyer_request'
          ELSE 'unknown'
        END as order_type
      FROM accepted_requests ar
      LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN accepted_requests sent_orders ON ar.order_submission_id = sent_orders.order_submission_id 
        AND sent_orders.sent_by_admin = true
      WHERE ar.sent_by_admin = false
      ORDER BY ar.accepted_at DESC
      LIMIT 100
    `)

    console.log("Found confirmed orders:", confirmedOrders.rows.length)

    const responseData = {
      success: true,
      orders: confirmedOrders.rows
    }

    // Cache the response
    cache = {
      data: responseData,
      timestamp: Date.now()
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

    // Clear cache after deletion
    cache = null

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


