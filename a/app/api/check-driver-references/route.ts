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

    const references = {}

    // Check confirmed_orders table
    try {
      const confirmedOrders = await dbQuery(
        "SELECT id, transport_order_id, status, created_at FROM confirmed_orders WHERE driver_id = $1",
        [driverId]
      )
      references.confirmedOrders = confirmedOrders.rows
    } catch (error) {
      references.confirmedOrders = []
      console.log("confirmed_orders check failed:", error)
    }

    // Check transport_orders table
    try {
      const transportOrders = await dbQuery(
        "SELECT id, state, district, place, status, created_at FROM transport_orders WHERE driver_id = $1",
        [driverId]
      )
      references.transportOrders = transportOrders.rows
    } catch (error) {
      references.transportOrders = []
      console.log("transport_orders check failed:", error)
    }

    // Check any other tables that might reference drivers
    try {
      const otherReferences = await dbQuery(`
        SELECT 
          tc.table_name,
          kcu.column_name,
          COUNT(*) as reference_count
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND kcu.column_name = 'driver_id'
          AND tc.table_name NOT IN ('confirmed_orders', 'transport_orders')
        GROUP BY tc.table_name, kcu.column_name
      `)
      references.otherTables = otherReferences.rows
    } catch (error) {
      references.otherTables = []
      console.log("Other tables check failed:", error)
    }

    return NextResponse.json({ 
      message: "Driver references checked successfully",
      driverId: driverId,
      references: references
    })
    
  } catch (error) {
    console.error("Check driver references failed:", error)
    return NextResponse.json({ 
      error: "Failed to check driver references", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
