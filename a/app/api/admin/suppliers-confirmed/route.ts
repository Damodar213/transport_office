import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Admin suppliers confirmed API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get all confirmed orders from order_submissions with related data
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
        br.order_number,
        br.load_type,
        br.from_state,
        br.from_district,
        br.from_place,
        br.from_taluk,
        br.to_state,
        br.to_district,
        br.to_place,
        br.to_taluk,
        br.estimated_tons,
        br.number_of_goods,
        br.delivery_place,
        br.required_date,
        br.special_instructions,
        br.status as order_status,
        br.rate,
        br.distance_km,
        br.created_at as order_created_at,
        br.updated_at as order_updated_at,
        br.buyer_company,
        br.buyer_name,
        br.buyer_email,
        br.buyer_mobile,
        s.company_name as supplier_company,
        s.name as supplier_name,
        d.driver_name,
        d.mobile as driver_mobile,
        t.vehicle_number,
        t.body_type as vehicle_type
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN suppliers s ON os.supplier_id = s.id
      LEFT JOIN drivers d ON os.driver_id = d.id
      LEFT JOIN trucks t ON os.vehicle_id = t.id
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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


