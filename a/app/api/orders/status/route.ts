import { type NextRequest, NextResponse } from "next/server"

// PUT - Update order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, status, notes, updatedBy } = body

    if (!orderId || !status) {
      return NextResponse.json({ error: "Order ID and status are required" }, { status: 400 })
    }

    const validStatuses = [
      "draft",
      "pending",
      "assigned",
      "confirmed",
      "picked_up",
      "in_transit",
      "delivered",
      "cancelled",
      "rejected",
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Mock status update - replace with actual database update
    const statusUpdate = {
      orderId,
      status,
      notes,
      updatedBy,
      updatedAt: new Date().toISOString(),
    }

    console.log("Order status update:", statusUpdate)

    // In real implementation, update the order status in database
    // await updateOrderStatus(orderId, statusUpdate)

    return NextResponse.json({
      message: "Order status updated successfully",
      update: statusUpdate,
    })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 })
  }
}
