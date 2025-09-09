import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - Fetch all orders sent to the authenticated supplier
export async function GET(request: Request) {
  try {
    // Verify the user is authenticated and is a supplier
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'supplier') {
      return NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    }

    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const supplierId = session.userIdString

    // Get all orders sent to this supplier
    const result = await dbQuery(`
      SELECT 
        os.*,
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
        b.company_name as buyer_company,
        u.name as buyer_name,
        u.email as buyer_email,
        u.mobile as buyer_mobile
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      WHERE os.supplier_id = $1
      ORDER BY os.submitted_at DESC
    `, [supplierId])

    return NextResponse.json({
      success: true,
      orders: result.rows
    })

  } catch (error) {
    console.error("Error fetching supplier orders:", error)
    return NextResponse.json({ 
      error: "Failed to fetch orders",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
