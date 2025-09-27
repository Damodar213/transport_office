import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Test supplier confirmed flow API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Step 1: Check manual_orders table
    const manualOrders = await dbQuery(`
      SELECT * FROM manual_orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    console.log("Manual orders:", manualOrders.rows.length)

    // Step 2: Check manual_order_submissions table
    const manualSubmissions = await dbQuery(`
      SELECT * FROM manual_order_submissions 
      ORDER BY created_at DESC 
      LIMIT 5
    `)
    console.log("Manual order submissions:", manualSubmissions.rows.length)

    // Step 3: Check accepted_requests table
    const acceptedRequests = await dbQuery(`
      SELECT * FROM accepted_requests 
      ORDER BY created_at DESC 
      LIMIT 10
    `)
    console.log("Accepted requests:", acceptedRequests.rows.length)

    // Step 4: Check accepted_requests where sent_by_admin = false
    const supplierConfirmed = await dbQuery(`
      SELECT * FROM accepted_requests 
      WHERE sent_by_admin = false 
      ORDER BY accepted_at DESC 
      LIMIT 10
    `)
    console.log("Supplier confirmed requests:", supplierConfirmed.rows.length)

    // Step 5: Test the admin query
    const adminQuery = await dbQuery(`
      SELECT 
        ar.id,
        ar.order_submission_id as order_id,
        ar.supplier_id,
        'SUPPLIER' as submitted_by,
        ar.accepted_at as submitted_at,
        ar.status,
        ar.order_number,
        ar.load_type,
        ar.from_state,
        ar.from_district,
        ar.from_place,
        ar.to_state,
        ar.to_district,
        ar.to_place,
        CASE 
          WHEN mos.id IS NOT NULL THEN 'Manual Order'
          WHEN os.id IS NOT NULL THEN 'Buyer Request'
          ELSE 'Unknown'
        END as buyer_name,
        ar.supplier_company,
        ar.driver_name,
        ar.driver_mobile,
        ar.vehicle_number,
        CASE 
          WHEN mos.id IS NOT NULL THEN 'manual_order'
          WHEN os.id IS NOT NULL THEN 'buyer_request'
          ELSE 'unknown'
        END as order_type
      FROM accepted_requests ar
      LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
      WHERE ar.sent_by_admin = false
      ORDER BY ar.accepted_at DESC
      LIMIT 10
    `)
    console.log("Admin query results:", adminQuery.rows.length)

    return NextResponse.json({
      success: true,
      data: {
        manualOrders: manualOrders.rows,
        manualSubmissions: manualSubmissions.rows,
        acceptedRequests: acceptedRequests.rows,
        supplierConfirmed: supplierConfirmed.rows,
        adminQueryResults: adminQuery.rows,
        counts: {
          manualOrders: manualOrders.rows.length,
          manualSubmissions: manualSubmissions.rows.length,
          acceptedRequests: acceptedRequests.rows.length,
          supplierConfirmed: supplierConfirmed.rows.length,
          adminQueryResults: adminQuery.rows.length
        }
      }
    })

  } catch (error) {
    console.error("Error testing supplier confirmed flow:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

