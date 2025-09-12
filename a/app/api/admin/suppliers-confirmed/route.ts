import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Admin suppliers confirmed API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // First, let's check if we have any confirmed orders at all
    const confirmedOrdersCheck = await dbQuery(`
      SELECT COUNT(*) as count FROM order_submissions WHERE status = 'confirmed'
    `)
    
    console.log("Confirmed orders count:", confirmedOrdersCheck.rows[0].count)

    if (confirmedOrdersCheck.rows[0].count === 0) {
      console.log("No confirmed orders found")
      return NextResponse.json({
        success: true,
        orders: []
      })
    }

    // Get all confirmed orders from order_submissions (working version)
    const confirmedOrders = await dbQuery(`
      SELECT 
        os.id,
        os.order_id,
        os.supplier_id,
        os.submitted_by,
        os.submitted_at,
        os.notification_sent,
        os.whatsapp_sent,
        os.status,
        os.driver_id,
        os.vehicle_id,
        'ORD-' || os.order_id as order_number,
        'Unknown' as load_type,
        'Unknown' as from_state,
        'Unknown' as from_district,
        'Unknown' as from_place,
        'Unknown' as to_state,
        'Unknown' as to_district,
        'Unknown' as to_place,
        'Unknown Company' as buyer_company,
        'Unknown Buyer' as buyer_name,
        'Unknown Supplier' as supplier_company,
        'Unknown Driver' as driver_name,
        'Unknown Vehicle' as vehicle_number
      FROM order_submissions os
      WHERE os.status = 'confirmed'
      ORDER BY os.submitted_at DESC
    `)

    console.log("Found confirmed orders:", confirmedOrders.rows.length)

    return NextResponse.json({
      success: true,
      orders: confirmedOrders.rows
    })

  } catch (error) {
    console.error("Error fetching confirmed orders:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}


