import { NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    console.log("Getting blocking orders for driver ID:", driverId)

    const blockingOrders = {
      confirmedOrders: [],
      vehicleLocationOrders: []
    }

    // Get confirmed orders that reference this driver
    try {
      const confirmedOrdersResult = await dbQuery(`
        SELECT 
          co.id,
          co.transport_order_id,
          co.status,
          co.created_at,
          t.state,
          t.district,
          t.place,
          t.vehicle_number
        FROM confirmed_orders co
        LEFT JOIN transport_orders t ON co.transport_order_id = t.id
        WHERE co.driver_id = $1
      `, [driverId])
      
      blockingOrders.confirmedOrders = confirmedOrdersResult.rows
    } catch (error) {
      console.log("confirmed_orders query failed:", error)
    }

    // Get vehicle location orders that reference this driver
    try {
      const vehicleLocationResult = await dbQuery(`
        SELECT 
          id,
          state,
          district,
          place,
          taluk,
          vehicle_number,
          body_type,
          status,
          created_at
        FROM suppliers_vehicle_location 
        WHERE driver_id = $1
      `, [driverId])
      
      blockingOrders.vehicleLocationOrders = vehicleLocationResult.rows
    } catch (error) {
      console.log("suppliers_vehicle_location query failed:", error)
    }

    const totalBlockingOrders = blockingOrders.confirmedOrders.length + blockingOrders.vehicleLocationOrders.length

    return NextResponse.json({
      driverId,
      blockingOrders,
      totalBlockingOrders,
      canDelete: totalBlockingOrders === 0,
      message: totalBlockingOrders === 0 
        ? "Driver can be deleted safely" 
        : `Driver has ${totalBlockingOrders} active orders that prevent deletion`
    })

  } catch (error) {
    console.error("Get driver blocking orders error:", error)
    return NextResponse.json({ 
      error: "Failed to get driver blocking orders",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}

