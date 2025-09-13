import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// Simple in-memory cache
let cache: { data: any; timestamp: number } | null = null
const CACHE_DURATION = 5000 // 5 seconds (reduced for better responsiveness)

export async function GET(request: NextRequest) {
  try {
    console.log("Admin suppliers confirmed API called")
    
    // Check for cache-busting parameter
    const { searchParams } = new URL(request.url)
    const cacheBust = searchParams.get('cache_bust')
    
    // Check cache first (skip if cache-busting)
    if (!cacheBust && cache && Date.now() - cache.timestamp < CACHE_DURATION) {
      console.log("Returning cached data")
      return NextResponse.json(cache.data)
    }
    
    if (cacheBust) {
      console.log("Cache busting requested, clearing cache")
      cache = null
    }
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Optimized query - get confirmed orders first, then join only if needed
    const confirmedOrders = await dbQuery(`
      SELECT DISTINCT
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
        COALESCE(br.order_number, 'ORD-' || os.order_id) as order_number,
        COALESCE(br.load_type, 'Unknown') as load_type,
        COALESCE(br.from_state, 'Unknown') as from_state,
        COALESCE(br.from_district, 'Unknown') as from_district,
        COALESCE(br.from_place, 'Unknown') as from_place,
        COALESCE(br.to_state, 'Unknown') as to_state,
        COALESCE(br.to_district, 'Unknown') as to_district,
        COALESCE(br.to_place, 'Unknown') as to_place,
        COALESCE(u.name, 'Unknown Buyer') as buyer_name,
        COALESCE(s.company_name, 'Unknown Supplier') as supplier_company,
        COALESCE(d.driver_name, 'Unknown Driver') as driver_name,
        COALESCE(d.mobile, 'N/A') as driver_mobile,
        COALESCE(t.vehicle_number, 'Unknown Vehicle') as vehicle_number,
        CASE WHEN EXISTS (
          SELECT 1 FROM accepted_requests ar 
          WHERE ar.order_submission_id = os.id 
          AND ar.sent_by_admin = true
        ) THEN true ELSE false END as is_sent_to_buyer
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN suppliers s ON os.supplier_id = s.user_id
      LEFT JOIN drivers d ON os.driver_id = d.id
      LEFT JOIN trucks t ON os.vehicle_id = t.id
      WHERE os.status = 'confirmed'
      ORDER BY os.submitted_at DESC
      LIMIT 100
    `)

    console.log("Found confirmed orders:", confirmedOrders.rows.length)

    const responseData = {
      success: true,
      orders: confirmedOrders.rows
    }

    // Cache the response
    cache = {
      data: responseData,
      timestamp: Date.now()
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error("Error fetching confirmed orders:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}


