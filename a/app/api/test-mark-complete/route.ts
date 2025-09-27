import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Test mark complete API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({
        error: "Missing required fields: orderId, status"
      }, { status: 400 })
    }

    console.log("Test mark complete with data:", { orderId, status })

    // First, check if the order exists
    const orderCheck = await dbQuery(
      "SELECT id, order_number, status FROM manual_orders WHERE id = $1",
      [orderId]
    )

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({
        error: "Manual order not found",
        orderId
      }, { status: 404 })
    }

    console.log("Order found:", orderCheck.rows[0])

    // Update the order status
    const updateResult = await dbQuery(
      "UPDATE manual_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
      [status, orderId]
    )

    if (updateResult.rows.length === 0) {
      return NextResponse.json({
        error: "Failed to update order status"
      }, { status: 500 })
    }

    console.log("Order updated successfully:", updateResult.rows[0])

    // Also check if there are any accepted_requests for this order
    const acceptedRequests = await dbQuery(
      "SELECT id, status FROM accepted_requests WHERE order_submission_id IN (SELECT id FROM manual_order_submissions WHERE order_id = $1)",
      [orderId]
    )

    console.log("Related accepted requests:", acceptedRequests.rows)

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order: updateResult.rows[0],
      acceptedRequests: acceptedRequests.rows
    })

  } catch (error) {
    console.error("Error testing mark complete:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
