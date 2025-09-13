import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Buyer accepted requests API called")
    
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
    console.log("Buyer ID:", buyerId)

    // Get accepted requests for this buyer
    const acceptedRequests = await dbQuery(`
      SELECT 
        ar.id,
        ar.buyer_request_id,
        ar.order_submission_id,
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
        ar.updated_at
      FROM accepted_requests ar
      WHERE ar.buyer_id = $1 
      AND ar.sent_by_admin = true
      ORDER BY ar.accepted_at DESC
    `, [buyerId])

    console.log("Found accepted requests:", acceptedRequests.rows.length)

    return NextResponse.json({
      success: true,
      requests: acceptedRequests.rows
    })

  } catch (error) {
    console.error("Error fetching accepted requests:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
