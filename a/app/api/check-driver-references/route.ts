import { NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driverId")

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    console.log("Checking references for driver ID:", driverId)

    const references = {
      confirmedOrders: 0,
      vehicleLocation: 0,
      totalReferences: 0
    }

    // Check confirmed_orders table
    try {
      const confirmedOrdersResult = await dbQuery(
        "SELECT COUNT(*) as count FROM confirmed_orders WHERE driver_id = $1",
        [driverId]
      )
      references.confirmedOrders = parseInt(confirmedOrdersResult.rows[0].count)
    } catch (error) {
      console.log("confirmed_orders check failed:", error)
    }

    // Check suppliers_vehicle_location table
    try {
      const vehicleLocationResult = await dbQuery(
        "SELECT COUNT(*) as count FROM suppliers_vehicle_location WHERE driver_id = $1",
        [driverId]
      )
      references.vehicleLocation = parseInt(vehicleLocationResult.rows[0].count)
    } catch (error) {
      console.log("suppliers_vehicle_location check failed:", error)
    }

    references.totalReferences = references.confirmedOrders + references.vehicleLocation

    return NextResponse.json({
      driverId,
      references,
      canDelete: references.totalReferences === 0,
      message: references.totalReferences === 0 
        ? "Driver can be deleted safely" 
        : `Driver has ${references.totalReferences} references and cannot be deleted`
    })

  } catch (error) {
    console.error("Check driver references error:", error)
    return NextResponse.json({ 
      error: "Failed to check driver references",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}