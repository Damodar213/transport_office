import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("Accept order API called")
    const { orderId, driverId, vehicleId, driverMobile } = await request.json()
    console.log("Request data:", { orderId, driverId, vehicleId, driverMobile })

    if (!orderId || !driverId || !vehicleId || !driverMobile) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: orderId, driverId, vehicleId, driverMobile" },
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
    console.log("Supplier ID:", supplierId)

    // Verify the order belongs to this supplier
    console.log("Checking order:", orderId, "for supplier:", supplierId, "Type:", typeof supplierId)
    const parsedOrderId = parseInt(orderId)
    console.log("Parsed order ID:", parsedOrderId, "Type:", typeof parsedOrderId)
    
    const orderCheck = await dbQuery(
      "SELECT * FROM order_submissions WHERE id = $1 AND supplier_id = $2",
      [parsedOrderId, supplierId]
    )
    console.log("Order check result:", orderCheck.rows.length, "rows")

    if (orderCheck.rows.length === 0) {
      console.log("Order not found or not authorized")
      return NextResponse.json({ error: "Order not found or not authorized" }, { status: 404 })
    }

    // Get driver and vehicle details
    console.log("Checking driver:", driverId, "for supplier:", supplierId, "Type:", typeof supplierId)
    const parsedDriverId = parseInt(driverId)
    console.log("Parsed driver ID:", parsedDriverId, "Type:", typeof parsedDriverId)
    
    const driverResult = await dbQuery(
      "SELECT driver_name, mobile FROM drivers WHERE id = $1 AND supplier_id = $2",
      [parsedDriverId, supplierId]
    )
    console.log("Driver result:", driverResult.rows.length, "rows")

    console.log("Checking vehicle:", vehicleId, "for supplier:", supplierId)
    const parsedVehicleId = parseInt(vehicleId)
    console.log("Parsed vehicle ID:", parsedVehicleId, "Type:", typeof parsedVehicleId)
    
    const vehicleResult = await dbQuery(
      "SELECT vehicle_number, body_type FROM trucks WHERE id = $1 AND supplier_id = $2",
      [parsedVehicleId, supplierId]
    )
    console.log("Vehicle result:", vehicleResult.rows.length, "rows")

    if (driverResult.rows.length === 0) {
      console.log("Driver not found for supplier:", supplierId, "driver ID:", parsedDriverId)
      return NextResponse.json({ 
        error: `Driver not found. Please ensure you have drivers registered in your account. Supplier: ${supplierId}, Driver ID: ${parsedDriverId}` 
      }, { status: 404 })
    }

    if (vehicleResult.rows.length === 0) {
      console.log("Vehicle not found for supplier:", supplierId, "vehicle ID:", parsedVehicleId)
      return NextResponse.json({ 
        error: `Vehicle not found. Please ensure you have vehicles registered in your account. Supplier: ${supplierId}, Vehicle ID: ${parsedVehicleId}` 
      }, { status: 404 })
    }

    const driver = driverResult.rows[0]
    const vehicle = vehicleResult.rows[0]

    // Update the order status to confirmed and store driver/vehicle info
    console.log("Updating order status to confirmed...")
    const updateResult = await dbQuery(
      "UPDATE order_submissions SET status = 'confirmed', driver_id = $2, vehicle_id = $3, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata' WHERE id = $1",
      [parsedOrderId, parsedDriverId, parsedVehicleId]
    )
    console.log("Update result:", updateResult.rowCount, "rows affected")

    // Get order details for notification (simplified)
    console.log("Getting order details for notification...")
    let orderNumber = `Order #${orderId}`
    
    try {
      const orderDetails = await dbQuery(
        `SELECT br.order_number 
         FROM order_submissions os 
         LEFT JOIN buyer_requests br ON os.order_id = br.id 
         WHERE os.id = $1`,
        [parsedOrderId]
      )
      console.log("Order details result:", orderDetails.rows.length, "rows")
      
      if (orderDetails.rows.length > 0 && orderDetails.rows[0].order_number) {
        orderNumber = orderDetails.rows[0].order_number
      }
    } catch (joinError) {
      console.log("JOIN query failed, using fallback order number:", joinError.message)
    }
    
    console.log("Order number for notification:", orderNumber)

    // Create notification for admin (simplified)
    console.log("Creating notification for admin...")
    try {
      const notificationResult = await dbQuery(
        `INSERT INTO notifications (
          type,
          title,
          message,
          category,
          priority,
          is_read
        ) VALUES ($1, $2, $3, $4, $5, false)`,
        [
          "order_confirmed",
          "Order Confirmed by Supplier",
          `Order ${orderNumber} has been confirmed by supplier. Driver: ${driver.driver_name} (${driverMobile}), Vehicle: ${vehicle.vehicle_number}`,
          "order_management",
          "high"
        ]
      )
      console.log("Notification created successfully")
    } catch (notificationError) {
      console.log("Notification creation failed:", notificationError.message)
      // Don't fail the whole operation if notification fails
    }

    // Create accepted request for buyer
    console.log("Creating accepted request for buyer...")
    try {
      const acceptedRequestResult = await dbQuery(
        `INSERT INTO accepted_requests (
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
          accepted_at
        ) 
        SELECT 
          os.order_id,
          os.id,
          br.buyer_id,
          os.supplier_id,
          os.driver_id,
          os.vehicle_id,
          COALESCE(br.order_number, 'ORD-' || os.order_id),
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
          d.mobile,
          t.vehicle_number,
          t.body_type,
          s.company_name,
          'accepted',
          NOW() AT TIME ZONE 'Asia/Kolkata'
        FROM order_submissions os
        LEFT JOIN buyer_requests br ON os.order_id = br.id
        LEFT JOIN drivers d ON os.driver_id = d.id
        LEFT JOIN trucks t ON os.vehicle_id = t.id
        LEFT JOIN suppliers s ON os.supplier_id = s.user_id
        WHERE os.id = $1
        RETURNING *`,
        [parsedOrderId]
      )
      console.log("Accepted request created successfully:", acceptedRequestResult.rows[0]?.id)
    } catch (acceptedRequestError) {
      console.log("Accepted request creation failed:", acceptedRequestError.message)
      // Don't fail the whole operation if accepted request creation fails
    }

    return NextResponse.json({
      success: true,
      message: "Order accepted successfully",
      confirmation: {
        orderId,
        driverName: driver.driver_name,
        driverMobile,
        vehicleNumber: vehicle.vehicle_number,
        vehicleType: vehicle.body_type
      }
    })

  } catch (error) {
    console.error("Error accepting order:", error)
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
