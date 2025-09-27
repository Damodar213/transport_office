import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Debug update status API called")
    
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

    console.log("Debug update status for orderId:", orderId)

    // Step 1: Check current state of manual_orders
    const manualOrderCheck = await dbQuery(
      "SELECT id, order_number, status FROM manual_orders WHERE id = $1",
      [orderId]
    )
    console.log("Manual order current state:", manualOrderCheck.rows)

    // Step 2: Check current state of accepted_requests
    const acceptedRequestsCheck = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, mos.order_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])
    console.log("Accepted requests current state:", acceptedRequestsCheck.rows)

    // Step 3: Update manual_orders
    console.log("Updating manual_orders...")
    const updateManualOrder = await dbQuery(
      "UPDATE manual_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [orderId]
    )
    console.log("Manual order update result:", updateManualOrder.rows)

    // Step 4: Update accepted_requests
    console.log("Updating accepted_requests...")
    const updateAcceptedRequests = await dbQuery(`
      UPDATE accepted_requests 
      SET status = 'completed', updated_at = CURRENT_TIMESTAMP
      WHERE order_submission_id IN (
        SELECT id FROM manual_order_submissions WHERE order_id = $1
      )
      RETURNING *
    `, [orderId])
    console.log("Accepted requests update result:", updateAcceptedRequests.rows)

    // Step 5: Verify the updates
    const manualOrderVerify = await dbQuery(
      "SELECT id, order_number, status FROM manual_orders WHERE id = $1",
      [orderId]
    )
    console.log("Manual order after update:", manualOrderVerify.rows)

    const acceptedRequestsVerify = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, mos.order_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])
    console.log("Accepted requests after update:", acceptedRequestsVerify.rows)

    return NextResponse.json({
      success: true,
      message: "Debug update completed",
      before: {
        manualOrder: manualOrderCheck.rows,
        acceptedRequests: acceptedRequestsCheck.rows
      },
      after: {
        manualOrder: manualOrderVerify.rows,
        acceptedRequests: acceptedRequestsVerify.rows
      },
      updateResults: {
        manualOrder: updateManualOrder.rows,
        acceptedRequests: updateAcceptedRequests.rows
      }
    })

  } catch (error) {
    console.error("Error in debug update status:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
