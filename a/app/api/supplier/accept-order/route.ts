import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Accept order API called")
    const { orderId, driverId, vehicleId, driverMobile } = await request.json()
    console.log("Request data:", { orderId, driverId, vehicleId, driverMobile })

    if (!orderId || !driverId || !vehicleId || !driverMobile) {
      console.log("Missing required fields")
      const response = NextResponse.json(
        { error: "Missing required fields: orderId, driverId, vehicleId, driverMobile" },
        { status: 400 }
      )
    return addCorsHeaders(response)
    }

    if (!getPool()) {
      console.log("Database not available")
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
    }

    // Verify the user is authenticated and is a supplier
    const session = await getSession()
    if (!session) {
      console.log("No session found - user not authenticated")
      const response = NextResponse.json({ error: "Authentication required. Please log in as a supplier." }, { status: 401 })
    return addCorsHeaders(response)
    }

    if (session.role !== 'supplier') {
      console.log("User role is not supplier:", session.role)
      const response = NextResponse.json({ error: "Access denied - supplier role required. Current role: " + session.role }, { status: 403 })
    return addCorsHeaders(response)
    }

    const supplierId = session.userIdString
    console.log("Authenticated supplier ID:", supplierId)
    console.log("Supplier ID:", supplierId)

    // Verify the order belongs to this supplier
    console.log("Checking order:", orderId, "for supplier:", supplierId, "Type:", typeof supplierId)
    const parsedOrderId = parseInt(orderId)
    console.log("Parsed order ID:", parsedOrderId, "Type:", typeof parsedOrderId)
    
    // Check both order_submissions and manual_order_submissions tables
    let orderCheck = await dbQuery(
      "SELECT *, 'buyer_request' as order_type FROM order_submissions WHERE id = $1 AND supplier_id = $2",
      [parsedOrderId, supplierId]
    )
    console.log("Order submissions check result:", orderCheck.rows.length, "rows")

    let orderType = 'buyer_request'
    if (orderCheck.rows.length === 0) {
      // Check manual order submissions
      orderCheck = await dbQuery(
        "SELECT *, 'manual_order' as order_type FROM manual_order_submissions WHERE id = $1 AND supplier_id = $2",
        [parsedOrderId, supplierId]
      )
      console.log("Manual order submissions check result:", orderCheck.rows.length, "rows")
      orderType = 'manual_order'
    }

    if (orderCheck.rows.length === 0) {
      console.log("Order not found or not authorized")
      const response = NextResponse.json({ error: "Order not found or not authorized" }, { status: 404 })
    return addCorsHeaders(response)
    }

    console.log("Order type:", orderType)

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
      const response = NextResponse.json({ 
        error: `Driver not found. Please ensure you have drivers registered in your account. Supplier: ${supplierId}, Driver ID: ${parsedDriverId}` 
      }, { status: 404 })
    return addCorsHeaders(response)
    }

    if (vehicleResult.rows.length === 0) {
      console.log("Vehicle not found for supplier:", supplierId, "vehicle ID:", parsedVehicleId)
      const response = NextResponse.json({ 
        error: `Vehicle not found. Please ensure you have vehicles registered in your account. Supplier: ${supplierId}, Vehicle ID: ${parsedVehicleId}` 
      }, { status: 404 })
    return addCorsHeaders(response)
    }

    const driver = driverResult.rows[0]
    const vehicle = vehicleResult.rows[0]

    // Update the order status to confirmed and store driver/vehicle info
    console.log("Updating order status to confirmed...")
    let updateResult
    if (orderType === 'manual_order') {
      // Update manual_order_submissions table
      updateResult = await dbQuery(
        "UPDATE manual_order_submissions SET status = 'accepted', updated_at = NOW() AT TIME ZONE 'Asia/Kolkata' WHERE id = $1",
        [parsedOrderId]
      )
      console.log("Manual order update result:", updateResult.rows.length, "rows affected")
    } else {
      // Update order_submissions table (just update timestamp, don't change status due to constraint)
      updateResult = await dbQuery(
      "UPDATE order_submissions SET updated_at = NOW() AT TIME ZONE 'Asia/Kolkata' WHERE id = $1",
      [parsedOrderId]
    )
      console.log("Order submissions update result:", updateResult.rows.length, "rows affected")
    }

    // Get order details for notification (simplified)
    console.log("Getting order details for notification...")
    let orderNumber = `Order #${orderId}`
    
    try {
      let orderDetails
      if (orderType === 'manual_order') {
        orderDetails = await dbQuery(
          `SELECT mo.order_number 
           FROM manual_order_submissions mos 
           LEFT JOIN manual_orders mo ON mos.order_id = mo.id 
           WHERE mos.id = $1`,
          [parsedOrderId]
        )
      } else {
        orderDetails = await dbQuery(
        `SELECT br.order_number 
         FROM order_submissions os 
         LEFT JOIN buyer_requests br ON os.order_id = br.id 
         WHERE os.id = $1`,
        [parsedOrderId]
      )
      }
      console.log("Order details result:", orderDetails.rows.length, "rows")
      
      if (orderDetails.rows.length > 0 && orderDetails.rows[0].order_number) {
        orderNumber = orderDetails.rows[0].order_number
      }
    } catch (joinError) {
      console.log("JOIN query failed, using fallback order number:", joinError instanceof Error ? joinError.message : "Unknown error")
    }
    
    console.log("Order number for notification:", orderNumber)

    // Create notification for admin with detailed information
    console.log("Creating notification for admin...")
    try {
      // Get supplier company name for better notification
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
          "order_confirmed",
          "🚛 Order Confirmed by Supplier",
          `Order ${orderNumber} has been confirmed by supplier ${supplierCompany}.\n\n📋 Order Details:\n• Load Type: ${orderType === 'manual_order' ? 'Manual Order' : 'Buyer Request'}\n• Driver: ${driver.driver_name} (${driverMobile})\n• Vehicle: ${vehicle.vehicle_number}\n• Supplier: ${supplierCompany}\n\n✅ Order is now ready for admin review${orderType === 'manual_order' ? ' and will be handled by admin.' : ' and can be sent to buyer.'}`,
          "order_management",
          "high"
        ]
      )
      console.log("Admin notification created successfully with ID:", notificationResult.rows[0]?.id)
    } catch (notificationError) {
      console.log("Admin notification creation failed:", notificationError instanceof Error ? notificationError.message : "Unknown error")
      // Don't fail the whole operation if notification fails
    }

    // Create accepted request for buyer
    console.log("Creating accepted request for buyer...")
    console.log("Order type:", orderType)
    console.log("Parsed order ID:", parsedOrderId)
    try {
      let acceptedRequestResult
      if (orderType === 'manual_order') {
        console.log("Creating accepted request for manual order...")
        
        // First, try to get the order details to ensure they exist
        const orderDetailsCheck = await dbQuery(
          "SELECT id, order_id, supplier_id, status FROM manual_order_submissions WHERE id = $1",
          [parsedOrderId]
        )
        
        if (orderDetailsCheck.rows.length === 0) {
          console.log("Manual order submission not found, creating simple accepted request")
          // Create a simple accepted request without complex joins
          acceptedRequestResult = await dbQuery(
            `INSERT INTO accepted_requests (
              order_submission_id,
              supplier_id,
              order_number,
              status,
              sent_by_admin,
              created_at,
              updated_at
            ) VALUES (
              $1,
              'admin',
              'MO-' || $1,
              'accepted',
              false,
              NOW() AT TIME ZONE 'Asia/Kolkata',
              NOW() AT TIME ZONE 'Asia/Kolkata'
            )
            RETURNING *`,
            [parsedOrderId]
          )
        } else {
          console.log("Manual order submission found, creating full accepted request")
          // Create accepted request for manual order with full details
          acceptedRequestResult = await dbQuery(
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
            accepted_at,
            sent_by_admin,
            created_at,
            updated_at
          ) 
          SELECT 
            mos.order_id,
            mos.id,
            NULL as buyer_id,
            $4 as supplier_id,
            $2 as driver_id,
            $3 as vehicle_id,
            COALESCE(mo.order_number, 'MO-' || mos.order_id),
            mo.load_type,
            mo.from_state,
            mo.from_district,
            mo.from_place,
            mo.to_state,
            mo.to_district,
            mo.to_place,
            mo.estimated_tons,
            NULL as rate,
            NULL as distance_km,
            d.driver_name,
            d.mobile,
            t.vehicle_number,
            t.body_type,
            s.company_name,
            'accepted',
            NOW() AT TIME ZONE 'Asia/Kolkata',
            false,
            NOW() AT TIME ZONE 'Asia/Kolkata',
            NOW() AT TIME ZONE 'Asia/Kolkata'
          FROM manual_order_submissions mos
          LEFT JOIN manual_orders mo ON mos.order_id = mo.id
          LEFT JOIN drivers d ON d.id = $2
          LEFT JOIN trucks t ON t.id = $3
          LEFT JOIN suppliers s ON mos.supplier_id = s.user_id
          WHERE mos.id = $1
          RETURNING *`,
          [parsedOrderId, parsedDriverId, parsedVehicleId, supplierId]
        )
        console.log("Manual order accepted request created successfully")
        }
      } else {
        console.log("Creating accepted request for buyer request...")
        
        // First, try to get the order details to ensure they exist
        const orderDetailsCheck = await dbQuery(
          "SELECT id, order_id, supplier_id, status FROM order_submissions WHERE id = $1",
          [parsedOrderId]
        )
        
        if (orderDetailsCheck.rows.length === 0) {
          console.log("Order submission not found, creating simple accepted request")
          // Create a simple accepted request without complex joins
          acceptedRequestResult = await dbQuery(
            `INSERT INTO accepted_requests (
              order_submission_id,
              supplier_id,
              order_number,
              status,
              sent_by_admin,
              created_at,
              updated_at
            ) VALUES (
              $1,
              'admin',
              'ORD-' || $1,
              'accepted',
              false,
              NOW() AT TIME ZONE 'Asia/Kolkata',
              NOW() AT TIME ZONE 'Asia/Kolkata'
            )
            RETURNING *`,
            [parsedOrderId]
          )
        } else {
          console.log("Order submission found, creating full accepted request")
          // Create accepted request for buyer request with full details
          acceptedRequestResult = await dbQuery(
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
            accepted_at,
            sent_by_admin,
            created_at,
            updated_at
        ) 
        SELECT 
          os.order_id,
          os.id,
          br.buyer_id,
            $4 as supplier_id,
          $2 as driver_id,
          $3 as vehicle_id,
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
            NOW() AT TIME ZONE 'Asia/Kolkata',
            false,
            NOW() AT TIME ZONE 'Asia/Kolkata',
          NOW() AT TIME ZONE 'Asia/Kolkata'
        FROM order_submissions os
        LEFT JOIN buyer_requests br ON os.order_id = br.id
        LEFT JOIN drivers d ON d.id = $2
        LEFT JOIN trucks t ON t.id = $3
        LEFT JOIN suppliers s ON os.supplier_id = s.user_id
        WHERE os.id = $1
        RETURNING *`,
          [parsedOrderId, parsedDriverId, parsedVehicleId, supplierId]
        )
        console.log("Buyer request accepted request created successfully")
        }
      }
      console.log("Accepted request created successfully:", acceptedRequestResult.rows[0]?.id)
    } catch (acceptedRequestError) {
      console.error("Accepted request creation failed:", acceptedRequestError)
      console.error("Error details:", {
        message: acceptedRequestError instanceof Error ? acceptedRequestError.message : "Unknown error",
        stack: acceptedRequestError instanceof Error ? acceptedRequestError.stack : "No stack trace"
      })
      // Don't fail the whole operation if accepted request creation fails
    }

    const response = NextResponse.json({
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
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error accepting order:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace")
    console.error("Error details:", {
      message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      name: error instanceof Error ? error.name : "Unknown",
      cause: error instanceof Error ? error.cause : undefined
    })
    const response = NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined)
    return addCorsHeaders(response) : undefined
      },
      { status: 500 }
    )
  }
}
