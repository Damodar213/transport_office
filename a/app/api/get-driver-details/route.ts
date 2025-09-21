import { NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    console.log("Getting details for driver ID:", driverId)

    // Get driver information
    const driverResult = await dbQuery(
      "SELECT * FROM drivers WHERE id = $1",
      [driverId]
    )

    if (driverResult.rows.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    const driver = driverResult.rows[0]
    const references = {}

    // Get confirmed orders referencing this driver
    try {
      const confirmedOrders = await dbQuery(
        `SELECT 
          co.id, co.transport_order_id, co.status, co.created_at,
          to.state, to.district, to.place, to.vehicle_number
        FROM confirmed_orders co
        LEFT JOIN transport_orders to ON co.transport_order_id = to.id
        WHERE co.driver_id = $1`,
        [driverId]
      )
      references.confirmedOrders = confirmedOrders.rows
    } catch (error) {
      references.confirmedOrders = []
      console.log("confirmed_orders check failed:", error)
    }

    // Get transport orders referencing this driver
    try {
      const transportOrders = await dbQuery(
        "SELECT id, state, district, place, status, created_at, vehicle_number FROM transport_orders WHERE driver_id = $1",
        [driverId]
      )
      references.transportOrders = transportOrders.rows
    } catch (error) {
      references.transportOrders = []
      console.log("transport_orders check failed:", error)
    }

    // Get buyer requests referencing this driver
    try {
      const buyerRequests = await dbQuery(
        "SELECT id, pickup_location, delivery_location, status, created_at FROM buyer_requests WHERE driver_id = $1",
        [driverId]
      )
      references.buyerRequests = buyerRequests.rows
    } catch (error) {
      references.buyerRequests = []
      console.log("buyer_requests check failed:", error)
    }

    // Get vehicle location requests referencing this driver
    try {
      const vehicleLocation = await dbQuery(
        "SELECT id, place, district, state, status, created_at FROM suppliers_vehicle_location WHERE driver_id = $1",
        [driverId]
      )
      references.vehicleLocation = vehicleLocation.rows
    } catch (error) {
      references.vehicleLocation = []
      console.log("suppliers_vehicle_location check failed:", error)
    }

    // Calculate total references
    const totalReferences = 
      references.confirmedOrders.length + 
      references.transportOrders.length + 
      references.buyerRequests.length + 
      references.vehicleLocation.length

    return NextResponse.json({ 
      message: "Driver details retrieved successfully",
      driver: driver,
      references: references,
      totalReferences: totalReferences,
      canDelete: totalReferences === 0,
      deletionBlockers: totalReferences > 0 ? {
        confirmedOrders: references.confirmedOrders.length,
        transportOrders: references.transportOrders.length,
        buyerRequests: references.buyerRequests.length,
        vehicleLocation: references.vehicleLocation.length
      } : null
    })
    
  } catch (error) {
    console.error("Get driver details failed:", error)
    return NextResponse.json({ 
      error: "Failed to get driver details", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
  }
}
