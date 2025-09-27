import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Check admin suppliers confirmed API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // First, let's see what's in the accepted_requests table
    const allAcceptedRequests = await dbQuery(`
      SELECT id, order_submission_id, supplier_id, sent_by_admin, accepted_at, 
             status, order_number, created_at
      FROM accepted_requests 
      ORDER BY created_at DESC 
      LIMIT 20
    `)

    console.log("All accepted requests:", allAcceptedRequests.rows.length)

    // Check specifically for supplier confirmed orders
    const supplierConfirmed = allAcceptedRequests.rows.filter(ar => ar.sent_by_admin === false)
    console.log("Supplier confirmed orders:", supplierConfirmed.length)

    // Now test the exact query that the admin suppliers-confirmed API uses
    const adminQuery = await dbQuery(`
      SELECT 
        ar.id,
        ar.order_submission_id as order_id,
        ar.supplier_id,
        'SUPPLIER' as submitted_by,
        ar.accepted_at as submitted_at,
        false as notification_sent,
        false as whatsapp_sent,
        ar.status,
        ar.driver_id,
        ar.vehicle_id,
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
          WHEN os.id IS NOT NULL THEN COALESCE(b.company_name, u.name, br.buyer_id, 'Unknown Buyer')
          ELSE 'Unknown'
        END as buyer_name,
        ar.supplier_company,
        ar.driver_name,
        ar.driver_mobile,
        ar.vehicle_number,
        CASE WHEN sent_orders.id IS NOT NULL THEN true ELSE false END as is_sent_to_buyer,
        CASE 
          WHEN mos.id IS NOT NULL THEN 'manual_order'
          WHEN os.id IS NOT NULL THEN 'buyer_request'
          ELSE 'unknown'
        END as order_type
      FROM accepted_requests ar
      LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN accepted_requests sent_orders ON ar.order_submission_id = sent_orders.order_submission_id 
        AND sent_orders.sent_by_admin = true
      WHERE ar.sent_by_admin = false
      ORDER BY ar.accepted_at DESC
      LIMIT 100
    `)

    console.log("Admin query results:", adminQuery.rows.length)

    // Let's also check what manual order submissions exist
    const manualSubmissions = await dbQuery(`
      SELECT id, order_id, supplier_id, status, created_at
      FROM manual_order_submissions 
      ORDER BY created_at DESC 
      LIMIT 10
    `)

    console.log("Manual order submissions:", manualSubmissions.rows.length)

    // Check what manual orders exist
    const manualOrders = await dbQuery(`
      SELECT id, order_number, load_type, from_state, from_district, to_state, to_district, status
      FROM manual_orders 
      ORDER BY created_at DESC 
      LIMIT 10
    `)

    console.log("Manual orders:", manualOrders.rows.length)

    return NextResponse.json({
      success: true,
      data: {
        allAcceptedRequests: allAcceptedRequests.rows,
        supplierConfirmed: supplierConfirmed,
        adminQueryResults: adminQuery.rows,
        manualSubmissions: manualSubmissions.rows,
        manualOrders: manualOrders.rows,
        counts: {
          totalAcceptedRequests: allAcceptedRequests.rows.length,
          supplierConfirmed: supplierConfirmed.length,
          adminQueryResults: adminQuery.rows.length,
          manualSubmissions: manualSubmissions.rows.length,
          manualOrders: manualOrders.rows.length
        }
      },
      analysis: {
        hasAcceptedRequests: allAcceptedRequests.rows.length > 0,
        hasSupplierConfirmed: supplierConfirmed.length > 0,
        adminQueryWorks: adminQuery.rows.length > 0,
        hasManualSubmissions: manualSubmissions.rows.length > 0,
        hasManualOrders: manualOrders.rows.length > 0
      }
    })

  } catch (error) {
    console.error("Error checking admin suppliers confirmed:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

