import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Fix order completion API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({
        error: "Missing required field: orderId"
      }, { status: 400 })
    }

    console.log("Fixing order completion for orderId:", orderId)

    // Step 1: Check what exists in the database
    const manualOrder = await dbQuery(
      "SELECT id, order_number, status FROM manual_orders WHERE id = $1",
      [orderId]
    )
    console.log("Manual order found:", manualOrder.rows)

    const manualSubmissions = await dbQuery(
      "SELECT id, order_id, supplier_id, status FROM manual_order_submissions WHERE order_id = $1",
      [orderId]
    )
    console.log("Manual order submissions found:", manualSubmissions.rows)

    const acceptedRequests = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, mos.order_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])
    console.log("Accepted requests found:", acceptedRequests.rows)

    // Step 2: Update manual_orders table
    if (manualOrder.rows.length > 0) {
      const updateManualOrder = await dbQuery(
        "UPDATE manual_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [orderId]
      )
      console.log("Manual order updated:", updateManualOrder.rows)
    }

    // Step 3: Update accepted_requests table directly by ID
    if (acceptedRequests.rows.length > 0) {
      const acceptedRequestId = acceptedRequests.rows[0].id
      const updateAcceptedRequest = await dbQuery(
        "UPDATE accepted_requests SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [acceptedRequestId]
      )
      console.log("Accepted request updated:", updateAcceptedRequest.rows)
    } else {
      console.log("No accepted_requests found to update")
    }

    // Step 4: Verify the updates
    const manualOrderVerify = await dbQuery(
      "SELECT id, order_number, status FROM manual_orders WHERE id = $1",
      [orderId]
    )

    const acceptedRequestsVerify = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, mos.order_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])

    return NextResponse.json({
      success: true,
      message: "Order completion fixed",
      orderId: orderId,
      before: {
        manualOrder: manualOrder.rows,
        manualSubmissions: manualSubmissions.rows,
        acceptedRequests: acceptedRequests.rows
      },
      after: {
        manualOrder: manualOrderVerify.rows,
        acceptedRequests: acceptedRequestsVerify.rows
      }
    })

  } catch (error) {
    console.error("Error fixing order completion:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
