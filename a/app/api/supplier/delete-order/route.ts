import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  try {
    console.log("Delete order API called")
    const { orderId } = await request.json()
    console.log("Request data:", { orderId })

    if (!orderId) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required field: orderId" },
        { status: 400 }
      )
    }

    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is a supplier
    const session = await getSession()
    if (!session) {
      console.log("No session found - user not authenticated")
      return NextResponse.json({ error: "Authentication required. Please log in as a supplier." }, { status: 401 })
    }

    if (session.role !== 'supplier') {
      console.log("User role is not supplier:", session.role)
      return NextResponse.json({ error: "Access denied - supplier role required. Current role: " + session.role }, { status: 403 })
    }

    const supplierId = session.userIdString
    console.log("Authenticated supplier ID:", supplierId)

    const parsedOrderId = parseInt(orderId)
    console.log("Parsed order ID:", parsedOrderId, "Type:", typeof parsedOrderId)
    console.log("Supplier ID:", supplierId, "Type:", typeof supplierId)

    // Check if the order belongs to this supplier and get order details
    let orderCheck = await dbQuery(
      "SELECT *, 'buyer_request' as order_type FROM order_submissions WHERE id = $1 AND supplier_id = $2",
      [parsedOrderId, supplierId]
    )
    console.log("Order submissions check result:", orderCheck.rows.length, "rows")
    if (orderCheck.rows.length > 0) {
      console.log("Found order in order_submissions:", orderCheck.rows[0])
    }

    let orderType = 'buyer_request'
    if (orderCheck.rows.length === 0) {
      // Check manual order submissions
      orderCheck = await dbQuery(
        "SELECT *, 'manual_order' as order_type FROM manual_order_submissions WHERE id = $1 AND supplier_id = $2",
        [parsedOrderId, supplierId]
      )
      console.log("Manual order submissions check result:", orderCheck.rows.length, "rows")
      if (orderCheck.rows.length > 0) {
        console.log("Found order in manual_order_submissions:", orderCheck.rows[0])
      }
      orderType = 'manual_order'
    }

    if (orderCheck.rows.length === 0) {
      console.log("Order not found or not authorized")
      
      // Debug: Check if order exists at all (regardless of supplier)
      const debugCheck1 = await dbQuery(
        "SELECT id, supplier_id FROM order_submissions WHERE id = $1",
        [parsedOrderId]
      )
      const debugCheck2 = await dbQuery(
        "SELECT id, supplier_id FROM manual_order_submissions WHERE id = $1",
        [parsedOrderId]
      )
      
      console.log("Debug - Order exists in order_submissions:", debugCheck1.rows.length > 0, debugCheck1.rows)
      console.log("Debug - Order exists in manual_order_submissions:", debugCheck2.rows.length > 0, debugCheck2.rows)
      
      return NextResponse.json({ error: "Order not found or not authorized" }, { status: 404 })
    }

    const order = orderCheck.rows[0]
    console.log("Order type:", orderType)

    // Check if this order has been accepted by the current supplier
    const acceptedRequest = await dbQuery(
      "SELECT id, supplier_id, supplier_company FROM accepted_requests WHERE order_submission_id = $1 AND supplier_id = $2",
      [parsedOrderId, supplierId]
    )
    
    if (acceptedRequest.rows.length > 0) {
      console.log("Order has been accepted by current supplier, cannot delete")
      return NextResponse.json({ 
        error: "Cannot delete order. This order has been accepted by you and cannot be deleted." 
      }, { status: 409 })
    }

    // Delete the order submission
    let deleteResult
    if (orderType === 'manual_order') {
      // Delete from manual_order_submissions table
      deleteResult = await dbQuery(
        "DELETE FROM manual_order_submissions WHERE id = $1 AND supplier_id = $2",
        [parsedOrderId, supplierId]
      )
      console.log("Manual order deletion result:", deleteResult.rowCount, "rows affected")
    } else {
      // Delete from order_submissions table
      deleteResult = await dbQuery(
        "DELETE FROM order_submissions WHERE id = $1 AND supplier_id = $2",
        [parsedOrderId, supplierId]
      )
      console.log("Order submissions deletion result:", deleteResult.rowCount, "rows affected")
    }

    if (deleteResult.rowCount === 0) {
      console.log("No rows were deleted - order may not exist or not belong to supplier")
      return NextResponse.json({ error: "Order not found or not authorized for deletion" }, { status: 404 })
    }

    // Create notification for admin about the deletion
    console.log("Creating notification for admin...")
    try {
      // Get supplier company name for notification
      const supplierInfo = await dbQuery(
        `SELECT company_name FROM suppliers WHERE user_id = $1`,
        [supplierId]
      )
      const supplierCompany = supplierInfo.rows.length > 0 ? supplierInfo.rows[0].company_name : 'Unknown Company'
      
      const notificationResult = await dbQuery(
        `INSERT INTO notifications (
          type,
          title,
          message,
          category,
          priority,
          is_read,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, false, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')`,
        [
          "order_deleted",
          "🗑️ Order Deleted by Supplier",
          `Order ${order.order_number || `#${orderId}`} has been deleted by supplier ${supplierCompany}.\n\n📋 Order Details:\n• Load Type: ${order.load_type || 'Unknown'}\n• From: ${order.from_place || 'Unknown'}\n• To: ${order.to_place || 'Unknown'}\n• Supplier: ${supplierCompany}\n\n⚠️ This order is no longer available for acceptance.`,
          "order_management",
          "medium"
        ]
      )
      console.log("Admin notification created successfully with ID:", notificationResult.rows[0]?.id)
    } catch (notificationError) {
      console.log("Admin notification creation failed:", notificationError instanceof Error ? notificationError.message : "Unknown error")
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully",
      deletedOrder: {
        orderId,
        orderNumber: order.order_number || `#${orderId}`,
        orderType
      }
    })

  } catch (error) {
    console.error("Error deleting order:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      cause: error instanceof Error ? error.cause : undefined
    })
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}
