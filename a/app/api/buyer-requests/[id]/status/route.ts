import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status) {
      const response = NextResponse.json({ 
        error: "Status is required" 
  }
    // Validate status value
    const validStatuses = ['draft', 'submitted', 'pending', 'assigned', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'rejected']
    if (!validStatuses.includes(status)) {
      const response = NextResponse.json({ 
        error: "Invalid status value" 
  }
    if (!getPool()) {
      const response = NextResponse.json({ 
        error: "Database not available" 
  }
    // Update the order status
    const result = await dbQuery(`
      UPDATE buyer_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id])

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Order not found" 
  }
    const updatedOrder = result.rows[0]

    // Create notification for admin when buyer submits order (status changes to 'pending')
    if (status === 'pending') {
      try {
        console.log("Creating notification for new buyer order submission...")
        
        // Get buyer details for the notification
        const buyerResult = await dbQuery(
          "SELECT b.company_name, u.name FROM buyers b LEFT JOIN users u ON b.user_id = u.user_id WHERE b.user_id = $1",
          [updatedOrder.buyer_id]
        )
        
        const buyerDetails = buyerResult.rows.length > 0 
          ? buyerResult.rows[0]
          : { company_name: "Unknown Company", name: "Unknown Buyer" }

        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/admin/transport-request-notifications`, {
          method: 'POST',
          headers: {
  }
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
  }
            type: "info",
            title: "New Buyer Order Submitted",
            message: `New transport order ${updatedOrder.order_number} submitted by ${buyerDetails.company_name} (${buyerDetails.name}). Load: ${updatedOrder.load_type}, Route: ${updatedOrder.from_place} → ${updatedOrder.to_place}${updatedOrder.estimated_tons ? `, ${updatedOrder.estimated_tons} tons` : ''}${updatedOrder.number_of_goods ? `, ${updatedOrder.number_of_goods} goods` : ''}${updatedOrder.delivery_place ? `, Delivery: ${updatedOrder.delivery_place}` : ''}`,
            category: "order",
            priority: "high",
            orderId: updatedOrder.id,
            buyerId: updatedOrder.buyer_id,
            status: status
  }
          })
        })

        if (notificationResponse.ok) {
          console.log("✅ Notification created successfully for buyer order submission")
        } else {
          console.error("❌ Failed to create notification:", await notificationResponse.text())
        }

      } catch (notificationError) {
        console.error("Error creating notification for buyer order submission:", notificationError)
        // Don't fail the main operation if notification creation fails
  }
    // Create notification for buyer when order status changes (except when buyer submits)
    if (status !== 'pending') {
      try {
        console.log("Creating notification for buyer about order status change...")
        
        const buyerNotificationResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/buyer/notifications`, {
          method: 'POST',
          headers: {
  }
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
  }
            type: "info",
            title: "Order Status Updated",
            message: `Your transport order ${updatedOrder.order_number} status has been updated to: ${status.toUpperCase()}. Load: ${updatedOrder.load_type}, Route: ${updatedOrder.from_place} → ${updatedOrder.to_place}`,
            category: "order",
            priority: "medium",
            buyerId: updatedOrder.buyer_id,
            orderId: updatedOrder.id
  }
          })
        })

        if (buyerNotificationResponse.ok) {
          console.log("✅ Buyer notification created successfully for order status change")
        } else {
          console.error("❌ Failed to create buyer notification:", await buyerNotificationResponse.text())
        }

      } catch (notificationError) {
        console.error("Error creating buyer notification for order status change:", notificationError)
        // Don't fail the main operation if notification creation fails
  }
    // Also create a notification when buyer submits order (status changes to 'pending')
    if (status === 'pending') {
      try {
        console.log("Creating notification for buyer about order submission...")
        
        const buyerNotificationResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/buyer/notifications`, {
          method: 'POST',
          headers: {
  }
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
  }
            type: "success",
            title: "Order Submitted Successfully",
            message: `Your transport order ${updatedOrder.order_number} has been submitted successfully and is now pending admin approval. Load: ${updatedOrder.load_type}, Route: ${updatedOrder.from_place} → ${updatedOrder.to_place}`,
            category: "order",
            priority: "high",
            buyerId: updatedOrder.buyer_id,
            orderId: updatedOrder.id
  }
          })
        })

        if (buyerNotificationResponse.ok) {
          console.log("✅ Buyer notification created successfully for order submission")
        } else {
          console.error("❌ Failed to create buyer notification:", await buyerNotificationResponse.text())
        }

      } catch (notificationError) {
        console.error("Error creating buyer notification for order submission:", notificationError)
        // Don't fail the main operation if notification creation fails
  }
    const response = NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      data: updatedOrder})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error updating order status:", error)
    const response = NextResponse.json({ 
      error: "Failed to update order status",
      details: error instanceof Error ? error.message : "Unknown error"
  }
  })
    return addCorsHeaders(response)
  }
