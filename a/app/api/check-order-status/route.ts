import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Check order status API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({
        error: "Missing required parameter: orderId"
      }, { status: 400 })
    }

    console.log("Checking status for orderId:", orderId)

    // Check manual_orders table
    const manualOrder = await dbQuery(
      "SELECT id, order_number, status, created_at, updated_at FROM manual_orders WHERE id = $1",
      [orderId]
    )

    // Check accepted_requests table
    const acceptedRequests = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, ar.created_at, ar.updated_at,
             mos.order_id, mos.supplier_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])

    // Check manual_order_submissions table
    const manualSubmissions = await dbQuery(
      "SELECT id, order_id, supplier_id, status, created_at, updated_at FROM manual_order_submissions WHERE order_id = $1",
      [orderId]
    )

    return NextResponse.json({
      success: true,
      orderId: orderId,
      manualOrder: manualOrder.rows,
      acceptedRequests: acceptedRequests.rows,
      manualSubmissions: manualSubmissions.rows,
      summary: {
        manualOrderStatus: manualOrder.rows[0]?.status || 'not found',
        acceptedRequestsStatus: acceptedRequests.rows[0]?.status || 'not found',
        manualSubmissionsStatus: manualSubmissions.rows[0]?.status || 'not found'
      }
    })

  } catch (error) {
    console.error("Error checking order status:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
