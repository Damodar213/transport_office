import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ 
        error: "Status is required" 
      }, { status: 400 })
    }

    // Validate status value
    const validStatuses = ['draft', 'submitted', 'pending', 'assigned', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'rejected']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: "Invalid status value" 
      }, { status: 400 })
    }

    if (!getPool()) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    // Update the order status
    const result = await dbQuery(`
      UPDATE buyer_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Order not found" 
      }, { status: 404 })
    }

    const updatedOrder = result.rows[0]

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder
    })

  } catch (error) {
    console.error("Error updating order status:", error)
    return NextResponse.json({ 
      error: "Failed to update order status",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

