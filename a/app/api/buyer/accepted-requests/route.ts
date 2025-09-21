import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Buyer accepted requests API called")
    
    if (!getPool()) {
      console.log("Database not available")
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is a buyer
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'buyer') {
      const response = NextResponse.json({ error: "Access denied - buyer role required" }, { status: 403 })
    }

    const buyerId = session.userIdString
    console.log("Buyer ID:", buyerId)

    // Get accepted requests for this buyer (only admin-sent orders)
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
        ar.updated_at,
        ar.sent_by_admin
      FROM accepted_requests ar
      WHERE ar.buyer_id = $1 AND ar.sent_by_admin = true
      ORDER BY ar.accepted_at DESC)
    `, [buyerId])

    console.log("Found accepted requests:", acceptedRequests.rows.length)

    const response = NextResponse.json({
      success: true,
      requests: acceptedRequests.rows


})
    })

  } catch (error) {
    console.error("Error fetching accepted requests:", error)
    const response = NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
)
    )
  }
export async function DELETE(request: NextRequest) {
  try {
    console.log("Delete accepted request API called")
    
    if (!getPool()) {
      console.log("Database not available")
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is a buyer
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'buyer') {
      const response = NextResponse.json({ error: "Access denied - buyer role required" }, { status: 403 })
    }

    const buyerId = session.userIdString
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')

    if (!requestId) {
      const response = NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    console.log("Deleting accepted request:", requestId, "for buyer:", buyerId)

    // Verify the accepted request belongs to this buyer
    const requestCheck = await dbQuery("SELECT * FROM accepted_requests WHERE id = $1 AND buyer_id = $2",
      [requestId, buyerId])
    )

    if (requestCheck.rows.length === 0) {
      const response = NextResponse.json({ error: "Accepted request not found or access denied" }, { status: 404 })
    }

    // Delete the accepted request
    const deleteResult = await dbQuery("DELETE FROM accepted_requests WHERE id = $1 AND buyer_id = $2",
      [requestId, buyerId])
    )

    if (deleteResult.rows.length === 0) {
      const response = NextResponse.json({ error: "Failed to delete accepted request" }, { status: 500 })
    }

    console.log("Successfully deleted accepted request:", requestId)

    const response = NextResponse.json({
      success: true,
      message: "Accepted request deleted successfully"


})
    })

  } catch (error) {
    console.error("Error deleting accepted request:", error)
    const response = NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
)
    )
  }
