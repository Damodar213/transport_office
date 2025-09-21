import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    console.log("Send to buyer API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { orderSubmissionId, buyerId } = await request.json()
    console.log("Order submission ID:", orderSubmissionId, "Buyer ID:", buyerId)

    if (!orderSubmissionId || !buyerId) {
      return NextResponse.json(
        { error: "Order submission ID and buyer ID are required" },
        { status: 400 }
      )
    }

    // Get the order submission details from accepted_requests table
    const orderDetails = await dbQuery(`
      SELECT 
        ar.id as order_submission_id,
        ar.order_submission_id as original_order_submission_id,
        ar.supplier_id,
        ar.status,
        ar.driver_id,
        ar.vehicle_id,
        ar.order_number,
        ar.load_type,
        ar.from_state,
        ar.from_district,
        ar.from_place,
        ar.to_state,
        ar.to_district,
        ar.to_place,
        ar.estimated_tons,
        ar.driver_name,
        ar.driver_mobile,
        ar.vehicle_number,
        ar.vehicle_type,
        ar.supplier_company,
        ar.buyer_id as original_buyer_id
      FROM accepted_requests ar
      WHERE ar.id = $1
    `, [orderSubmissionId])

    if (orderDetails.rows.length === 0) {
      return NextResponse.json(
        { error: "Order submission not found" },
        { status: 404 }
      )
    }

    const orderSubmission = orderDetails.rows[0]

    // The order data is already complete from accepted_requests table
    const order = {
      ...orderSubmission,
      buyer_request_id: orderSubmission.original_order_submission_id
    }

    // Check if accepted request already exists for this buyer
    const existingRequest = await dbQuery(`
      SELECT id, sent_by_admin, status FROM accepted_requests 
      WHERE order_submission_id = $1 AND buyer_id = $2 AND sent_by_admin = true
    `, [orderSubmissionId, buyerId])

    if (existingRequest.rows.length > 0) {
      return NextResponse.json(
        { error: "This order has already been sent to the selected buyer" },
        { status: 409 }
      )
    }

    // Create accepted request for the selected buyer
    const acceptedRequest = await dbQuery(`
      INSERT INTO accepted_requests (
        order_submission_id,
        buyer_id,
        supplier_id,
        driver_id,
        vehicle_id,
        order_number,
        load_type,
        from_state,
        from_district,
        from_place,
        to_state,
        to_district,
        to_place,
        estimated_tons,
        driver_name,
        driver_mobile,
        vehicle_number,
        vehicle_type,
        supplier_company,
        status,
        accepted_at,
        sent_by_admin,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      RETURNING *
    `, [
      order.original_order_submission_id,
      buyerId,
      order.supplier_id,
      order.driver_id || null,
      order.vehicle_id || null,
      order.order_number,
      order.load_type,
      order.from_state,
      order.from_district,
      order.from_place,
      order.to_state,
      order.to_district,
      order.to_place,
      order.estimated_tons,
      order.driver_name,
      order.driver_mobile,
      order.vehicle_number,
      order.vehicle_type,
      order.supplier_company,
      'sent_to_buyer',
      new Date().toISOString(),
      true,
      new Date().toISOString(),
      new Date().toISOString()
    ])

    console.log("Created accepted request for buyer:", acceptedRequest.rows[0].id)

    // Update notification and WhatsApp status in the original order submission
    try {
      await dbQuery(
        `UPDATE order_submissions 
         SET notification_sent = true, whatsapp_sent = true, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata' 
         WHERE id = $1`,
        [orderSubmissionId]
      )
      console.log("Updated order submission notification status")
    } catch (statusUpdateError) {
      console.log("Failed to update notification status:", statusUpdateError instanceof Error ? statusUpdateError.message : "Unknown error")
    }

    // Create notification for the buyer
    try {
      await dbQuery(
        `INSERT INTO buyer_notifications (
          buyer_id,
          type,
          title,
          message,
          category,
          priority,
          is_read,
          order_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')`,
        [
          buyerId,
          "order_sent_to_buyer",
          "Order Sent to You",
          `Your order ${order.order_number} has been sent to you by admin. Driver: ${order.driver_name} (${order.driver_mobile}), Vehicle: ${order.vehicle_number}.`,
          "order_management",
          "high",
          order.order_id
        ]
      )
      console.log("Buyer notification created successfully")
    } catch (notificationError) {
      console.log("Buyer notification creation failed:", notificationError instanceof Error ? notificationError.message : "Unknown error")
    }

    return NextResponse.json({
      success: true,
      message: "Order sent to buyer successfully",
      request: acceptedRequest.rows[0]
    })

  } catch (error) {
    console.error("Error sending order to buyer:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" },
      { status: 500 }
    )
  }
}