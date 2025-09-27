import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Test accept order API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const { orderSubmissionId, supplierId, driverId, vehicleId, driverMobile } = body

    if (!orderSubmissionId || !supplierId || !driverId || !vehicleId || !driverMobile) {
      return NextResponse.json({
        error: "Missing required fields: orderSubmissionId, supplierId, driverId, vehicleId, driverMobile"
      }, { status: 400 })
    }

    console.log("Test accept order with data:", { orderSubmissionId, supplierId, driverId, vehicleId, driverMobile })

    // Check if the order submission exists
    const orderCheck = await dbQuery(
      "SELECT id, order_id, supplier_id, status FROM manual_order_submissions WHERE id = $1",
      [orderSubmissionId]
    )

    if (orderCheck.rows.length === 0) {
      return NextResponse.json({
        error: "Order submission not found",
        orderSubmissionId
      }, { status: 404 })
    }

    console.log("Order submission found:", orderCheck.rows[0])

    // Check if manual order exists
    const manualOrderCheck = await dbQuery(
      "SELECT * FROM manual_orders WHERE id = $1",
      [orderCheck.rows[0].order_id]
    )

    if (manualOrderCheck.rows.length === 0) {
      return NextResponse.json({
        error: "Manual order not found",
        orderId: orderCheck.rows[0].order_id
      }, { status: 404 })
    }

    console.log("Manual order found:", manualOrderCheck.rows[0])

    // Check if driver exists
    const driverCheck = await dbQuery(
      "SELECT id, driver_name, mobile FROM drivers WHERE id = $1",
      [driverId]
    )

    if (driverCheck.rows.length === 0) {
      return NextResponse.json({
        error: "Driver not found",
        driverId
      }, { status: 404 })
    }

    console.log("Driver found:", driverCheck.rows[0])

    // Check if vehicle exists
    const vehicleCheck = await dbQuery(
      "SELECT id, vehicle_number, body_type FROM trucks WHERE id = $1",
      [vehicleId]
    )

    if (vehicleCheck.rows.length === 0) {
      return NextResponse.json({
        error: "Vehicle not found",
        vehicleId
      }, { status: 404 })
    }

    console.log("Vehicle found:", vehicleCheck.rows[0])

    // Check if supplier exists
    const supplierCheck = await dbQuery(
      "SELECT user_id, company_name FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    if (supplierCheck.rows.length === 0) {
      return NextResponse.json({
        error: "Supplier not found",
        supplierId
      }, { status: 404 })
    }

    console.log("Supplier found:", supplierCheck.rows[0])

    // Now try to create the accepted request
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
          accepted_at,
          sent_by_admin,
          created_at,
          updated_at
        ) 
        SELECT 
          NULL as buyer_request_id,
          $1 as order_submission_id,
          NULL as buyer_id,
          $2 as supplier_id,
          $3 as driver_id,
          $4 as vehicle_id,
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
        LEFT JOIN drivers d ON d.id = $3
        LEFT JOIN trucks t ON t.id = $4
        LEFT JOIN suppliers s ON mos.supplier_id = s.user_id
        WHERE mos.id = $1
        RETURNING *`,
        [orderSubmissionId, supplierId, driverId, vehicleId]
      )

      console.log("Accepted request created successfully:", acceptedRequestResult.rows[0])

      // Update the manual order submission status
      await dbQuery(
        "UPDATE manual_order_submissions SET status = 'accepted', updated_at = NOW() WHERE id = $1",
        [orderSubmissionId]
      )

      console.log("Manual order submission status updated to accepted")

      return NextResponse.json({
        success: true,
        message: "Order accepted successfully",
        acceptedRequest: acceptedRequestResult.rows[0],
        orderSubmissionId,
        supplierId
      })

    } catch (error) {
      console.error("Error creating accepted request:", error)
      return NextResponse.json({
        error: "Failed to create accepted request",
        details: error.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Error testing accept order:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

