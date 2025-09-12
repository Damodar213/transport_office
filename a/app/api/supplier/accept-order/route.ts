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
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'supplier') {
      return NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    }

    const supplierId = session.userIdString
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
      console.log("Driver not found")
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    if (vehicleResult.rows.length === 0) {
      console.log("Vehicle not found")
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
    }

    const driver = driverResult.rows[0]
    const vehicle = vehicleResult.rows[0]

    // Update the order status to confirmed and store driver/vehicle info
    await dbQuery(
      "UPDATE order_submissions SET status = 'confirmed', driver_id = $2, vehicle_id = $3, updated_at = NOW() WHERE id = $1",
      [parsedOrderId, parsedDriverId, parsedVehicleId]
    )

    // Get order details for notification
    const orderDetails = await dbQuery(
      `SELECT br.order_number 
       FROM order_submissions os 
       LEFT JOIN buyer_requests br ON os.order_id = br.id 
       WHERE os.id = $1`,
      [parsedOrderId]
    )
    
    const orderNumber = orderDetails.rows[0]?.order_number || `Order #${orderId}`

    // Create notification for admin
    await dbQuery(
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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
