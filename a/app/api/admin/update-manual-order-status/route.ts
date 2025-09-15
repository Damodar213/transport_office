import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId || !status) {
      return NextResponse.json({ 
        error: "Order ID and status are required" 
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    console.log(`Updating manual order ${orderId} status to ${status}`)

    // Update manual order status
    // Note: We don't update assigned_supplier_id and assigned_supplier_name here
    // as they should already be set when the order was sent to suppliers
    await dbQuery(`
      UPDATE manual_orders 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [status, orderId])

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

