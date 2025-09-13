import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// Cache clearing mechanism - we need to clear the cache in suppliers-confirmed API
// Since we can't directly import the cache variable, we'll use a different approach

export async function POST(request: NextRequest) {
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

    // Get the order submission details with all related data
    const orderDetails = await dbQuery(`
      SELECT 
        os.id as order_submission_id,
        os.order_id as buyer_request_id,
        os.supplier_id,
        os.status,
        br.buyer_id as original_buyer_id,
        br.order_number,
        br.load_type,
        br.from_state,
        br.from_district,
        br.from_place,
        br.to_state,
        br.to_district,
        br.to_place,
        br.estimated_tons,
        br.rate,
        br.distance_km,
        d.driver_name,
        d.mobile as driver_mobile,
        t.vehicle_number,
        t.body_type as vehicle_type,
        s.company_name as supplier_company
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN drivers d ON os.driver_id = d.id
      LEFT JOIN trucks t ON os.vehicle_id = t.id
      LEFT JOIN suppliers s ON os.supplier_id = s.user_id
      WHERE os.id = $1 AND os.status = 'confirmed'
    `, [orderSubmissionId])

    if (orderDetails.rows.length === 0) {
      return NextResponse.json(
        { error: "Order submission not found or not confirmed" },
        { status: 404 }
      )
    }

    const order = orderDetails.rows[0]

    // Check if accepted request already exists for this buyer
    // Only check for records that were sent by admin (sent_by_admin = true)
    const existingRequest = await dbQuery(`
      SELECT id, sent_by_admin, status FROM accepted_requests 
      WHERE order_submission_id = $1 AND buyer_id = $2 AND sent_by_admin = true
    `, [orderSubmissionId, buyerId])

    console.log("Checking for existing requests:", {
      orderSubmissionId,
      buyerId,
      existingCount: existingRequest.rows.length,
      existingRequests: existingRequest.rows
    })

    if (existingRequest.rows.length > 0) {
      console.log("Found existing request, preventing duplicate send")
      
      // Check if there are any orphaned records (sent_by_admin = false) that might be causing confusion
      const orphanedRecords = await dbQuery(`
        SELECT id, sent_by_admin, status FROM accepted_requests 
        WHERE order_submission_id = $1 AND buyer_id = $2 AND sent_by_admin = false
      `, [orderSubmissionId, buyerId])
      
      if (orphanedRecords.rows.length > 0) {
        console.log("Found orphaned records, cleaning them up:", orphanedRecords.rows)
        // Clean up orphaned records
        await dbQuery(
          `DELETE FROM accepted_requests 
           WHERE order_submission_id = $1 AND buyer_id = $2 AND sent_by_admin = false`,
          [orderSubmissionId, buyerId]
        )
        console.log("Orphaned records cleaned up, proceeding with send")
      } else {
        return NextResponse.json(
          { error: "This order has already been sent to the selected buyer" },
          { status: 409 }
        )
      }
    }

    // Create accepted request for the selected buyer
    const acceptedRequest = await dbQuery(`
      INSERT INTO accepted_requests (
        buyer_request_id,
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
        rate,
        distance_km,
        driver_name,
        driver_mobile,
        vehicle_number,
        vehicle_type,
        supplier_company,
        status,
        accepted_at,
        sent_by_admin
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *
    `, [
      order.buyer_request_id,
      order.order_submission_id,
      buyerId, // Use the selected buyer ID
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
      order.rate,
      order.distance_km,
      order.driver_name,
      order.driver_mobile,
      order.vehicle_number,
      order.vehicle_type,
      order.supplier_company,
      'accepted',
      new Date().toISOString(),
      true  // sent_by_admin = true
    ])

    console.log("Created accepted request for buyer:", acceptedRequest.rows[0].id)

    // Clear the cache by making a request with cache-busting parameter
    try {
      const cacheBustUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/admin/suppliers-confirmed?cache_bust=${Date.now()}`
      console.log("Clearing cache with URL:", cacheBustUrl)
      // We don't need to wait for this response, just trigger the cache clear
      fetch(cacheBustUrl).catch(err => console.log("Cache clear request failed:", err.message))
    } catch (cacheError) {
      console.log("Cache clearing failed:", cacheError.message)
    }

    // Create notification for the buyer in buyer_notifications table
    try {
      const notificationResult = await dbQuery(
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
        ) VALUES ($1, $2, $3, $4, $5, $6, false, $7, NOW(), NOW())`,
        [
          buyerId,
          "order_sent_to_buyer",
          "Order Sent to You",
          `Your order ${order.order_number} has been sent to you by admin. Driver: ${order.driver_name} (${order.driver_mobile}), Vehicle: ${order.vehicle_number}. You can now track your order in the Accepted Requests section.`,
          "order_management",
          "high",
          order.order_id
        ]
      )
      console.log("Buyer notification created successfully")
    } catch (notificationError) {
      console.log("Buyer notification creation failed:", notificationError.message)
      // Don't fail the whole operation if notification fails
    }

    // Create notification for the admin
    try {
      const adminNotificationResult = await dbQuery(
        `INSERT INTO notifications (
          type,
          title,
          message,
          category,
          priority,
          is_read,
          user_id,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, false, $6, NOW(), NOW())`,
        [
          "order_sent_by_admin",
          "Order Sent Successfully",
          `Order ${order.order_number} has been successfully sent to buyer. Driver: ${order.driver_name} (${order.driver_mobile}), Vehicle: ${order.vehicle_number}. The buyer will receive a notification and can track the order in their dashboard.`,
          "order_management",
          "medium",
          "admin"  // Admin user ID
        ]
      )
      console.log("Admin notification created")
    } catch (adminNotificationError) {
      console.log("Admin notification creation failed:", adminNotificationError.message)
      // Don't fail the whole operation if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Order sent to buyer successfully",
      request: acceptedRequest.rows[0]
    })

  } catch (error) {
    console.error("Error sending order to buyer:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
