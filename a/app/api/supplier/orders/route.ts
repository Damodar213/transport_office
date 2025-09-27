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

    // Check if database is available
    if (!getPool()) {
      console.log("No database connection available, returning empty orders list")
      return NextResponse.json({ success: true, orders: [] })
    }

    const supplierId = session.userIdString

    // Get all orders sent to this supplier (buyer requests, manual orders, and assigned transport orders)
    const result = await dbQuery(`
      -- Get buyer request orders
      SELECT 
        os.id as submission_id,
        os.order_id,
        os.supplier_id,
        os.status as submission_status,
        os.submitted_at,
        os.created_at as submission_created_at,
        os.updated_at as submission_updated_at,
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
        u.mobile as buyer_mobile,
        'buyer_request' as order_type,
        NULL as vehicle_number,
        NULL as body_type,
        NULL as driver_name,
        NULL as admin_notes,
        CASE WHEN ar.id IS NOT NULL THEN 'accepted' ELSE os.status END as effective_status
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN accepted_requests ar ON os.id = ar.order_submission_id AND ar.supplier_id = os.supplier_id
      WHERE os.supplier_id = $1 AND br.id IS NOT NULL
      
      UNION ALL
      
      -- Get manual orders (schema-compatible mapping)
      SELECT 
        mos.id as submission_id,
        mos.order_id,
        mos.supplier_id,
        mos.status as submission_status,
        mos.submitted_at,
        mos.created_at as submission_created_at,
        mos.updated_at as submission_updated_at,
        mo.order_number,
        mo.load_type,
        mo.from_state,
        mo.from_district,
        mo.from_place,
        mo.from_taluk,
        mo.to_state,
        mo.to_district,
        mo.to_place,
        mo.to_taluk,
        mo.estimated_tons,
        mo.number_of_goods,
        mo.delivery_place,
        mo.required_date,
        mo.special_instructions,
        mo.status as order_status,
        NULL as rate,
        NULL as distance_km,
        mo.created_at as order_created_at,
        mo.updated_at as order_updated_at,
        'Manual Order' as buyer_company,
        'Admin' as buyer_name,
        'admin@transport.com' as buyer_email,
        NULL as buyer_mobile,
        'manual_order' as order_type,
        NULL as vehicle_number,
        NULL as body_type,
        NULL as driver_name,
        NULL as admin_notes,
        CASE WHEN ar.id IS NOT NULL THEN 'accepted' ELSE mos.status END as effective_status
      FROM manual_order_submissions mos
      LEFT JOIN manual_orders mo ON mos.order_id = mo.id
      LEFT JOIN accepted_requests ar ON mos.id = ar.order_submission_id AND ar.supplier_id = mos.supplier_id
      WHERE mos.supplier_id = $1 AND mo.id IS NOT NULL
      
      UNION ALL
      
      -- Get assigned transport orders
      SELECT 
        svl.id as submission_id,
        svl.id as order_id,
        svl.supplier_id,
        svl.status as submission_status,
        svl.submitted_at,
        svl.created_at as submission_created_at,
        svl.updated_at as submission_updated_at,
        CONCAT('TR-', svl.id) as order_number,
        svl.body_type as load_type,
        svl.state as from_state,
        svl.district as from_district,
        svl.place as from_place,
        svl.taluk as from_taluk,
        svl.state as to_state,
        svl.district as to_district,
        svl.place as to_place,
        svl.taluk as to_taluk,
        25.0 as estimated_tons,
        1 as number_of_goods,
        svl.place as delivery_place,
        svl.submitted_at::date as required_date,
        svl.admin_notes as special_instructions,
        svl.status as order_status,
        NULL as rate,
        NULL as distance_km,
        svl.created_at as order_created_at,
        svl.updated_at as order_updated_at,
        'Admin Assigned' as buyer_company,
        'Admin' as buyer_name,
        'admin@transport.com' as buyer_email,
        NULL as buyer_mobile,
        'transport_order' as order_type,
        svl.vehicle_number,
        svl.body_type,
        d.driver_name,
        svl.admin_notes,
        svl.status as effective_status
      FROM suppliers_vehicle_location svl
      LEFT JOIN drivers d ON svl.driver_id = d.id
      WHERE svl.supplier_id = $1 AND svl.status = 'confirmed'
      
      ORDER BY submission_created_at DESC
    `, [supplierId])

    // Transform the result to match the expected interface
    const transformedOrders = result.rows.map((row: any) => ({
      ...row,
      id: row.submission_id, // Map submission_id to id for frontend compatibility
      status: row.submission_status, // Use submission_status for filtering pending orders
      order_status: row.order_status // Keep original order_status for reference
    }))

    return NextResponse.json({
      success: true,
      orders: transformedOrders
    })

  } catch (error) {
    console.error("Error fetching supplier orders:", error)
    return NextResponse.json({ 
      error: "Failed to fetch orders",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
