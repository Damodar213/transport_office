import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, orderNumber, status } = body

    if ((!orderId && !orderNumber) || !status) {
      return NextResponse.json({ 
        error: "Order ID or Order Number and status are required" 
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    // Use orderNumber if provided, otherwise use orderId
    const searchField = orderNumber ? 'order_number' : 'id'
    const searchValue = orderNumber || orderId
    
    console.log(`Updating manual order ${searchField}=${searchValue} status to ${status}`)

    // Update manual order status
    // Note: We don't update assigned_supplier_id and assigned_supplier_name here
    // as they should already be set when the order was sent to suppliers
    await dbQuery(`
      UPDATE manual_orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE ${searchField} = $2
    `, [status, searchValue])

    // Also update the corresponding accepted_requests status
    // This is important because the admin suppliers-confirmed API reads from accepted_requests
    console.log("Updating accepted_requests for manual order:", searchValue)
    
    // First, let's see what manual_order_submissions exist for this order
    const manualSubmissions = await dbQuery(
      `SELECT mos.id, mos.order_id, mos.supplier_id, mo.order_number
       FROM manual_order_submissions mos
       JOIN manual_orders mo ON mos.order_id = mo.id
       WHERE mo.${searchField} = $1`,
      [searchValue]
    )
    console.log("Manual order submissions found:", manualSubmissions.rows)
    
    // Find the accepted_requests record directly
    const acceptedRequests = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, mos.order_id, mo.order_number
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      JOIN manual_orders mo ON mos.order_id = mo.id
      WHERE mo.${searchField} = $1
    `, [searchValue])
    console.log("Accepted requests found:", acceptedRequests.rows)
    
    // Update accepted_requests by direct ID
    if (acceptedRequests.rows.length > 0) {
      const acceptedRequestId = acceptedRequests.rows[0].id
      const updateResult = await dbQuery(
        "UPDATE accepted_requests SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
        [status, acceptedRequestId]
      )
      console.log("Accepted requests update result:", updateResult.rowCount, "rows affected")
      console.log("Updated accepted request:", updateResult.rows)
    } else {
      console.log("No accepted_requests found to update")
    }

    // Log the current state for debugging
    const orderResult = await dbQuery(`
      SELECT id, status, assigned_supplier_id, assigned_supplier_name 
      FROM manual_orders 
      WHERE id = $1
    `, [orderId])
    
    if (orderResult.rows.length > 0) {
      const order = orderResult.rows[0]
      console.log(`Successfully updated manual order ${orderId}:`, {
        status: order.status,
        assigned_supplier_id: order.assigned_supplier_id,
        assigned_supplier_name: order.assigned_supplier_name
      })
    }

    // Also log the accepted_requests update
    const acceptedRequestsResult = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])
    
    console.log(`Updated accepted_requests for manual order ${orderId}:`, acceptedRequestsResult.rows)

    return NextResponse.json({
      success: true,
      message: `Manual order status updated to ${status}`
    })

  } catch (error) {
    console.error("Error updating manual order status:", error)
    return NextResponse.json({ 
      error: "Failed to update manual order status",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

