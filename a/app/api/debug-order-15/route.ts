import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Debugging order 15...")
    
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    // Check order 15 in buyer_requests
    const buyerRequestResult = await dbQuery(`
      SELECT * FROM buyer_requests 
      WHERE order_number = 'ORD-15' OR id = 15
      ORDER BY id DESC
      LIMIT 5
    `)
    console.log("Buyer requests for order 15:", buyerRequestResult.rows)

    // Check order_submissions for order 15
    const orderSubmissionsResult = await dbQuery(`
      SELECT os.*, br.order_number, br.buyer_id
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      WHERE br.order_number = 'ORD-15' OR os.order_id = 15
      ORDER BY os.id DESC
    `)
    console.log("Order submissions for order 15:", orderSubmissionsResult.rows)

    // Check accepted_requests for order 15
    const acceptedRequestsResult = await dbQuery(`
      SELECT ar.*, os.order_id as buyer_request_id, br.order_number
      FROM accepted_requests ar
      LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      WHERE br.order_number = 'ORD-15' OR os.order_id = 15
      ORDER BY ar.id DESC
    `)
    console.log("Accepted requests for order 15:", acceptedRequestsResult.rows)

    // Check manual orders for order 15
    const manualOrdersResult = await dbQuery(`
      SELECT * FROM manual_orders 
      WHERE order_number = 'ORD-15' OR id = 15
      ORDER BY id DESC
      LIMIT 5
    `)
    console.log("Manual orders for order 15:", manualOrdersResult.rows)

    // Check manual_order_submissions for order 15
    const manualOrderSubmissionsResult = await dbQuery(`
      SELECT mos.*, mo.order_number
      FROM manual_order_submissions mos
      LEFT JOIN manual_orders mo ON mos.order_id = mo.id
      WHERE mo.order_number = 'ORD-15' OR mos.order_id = 15
      ORDER BY mos.id DESC
    `)
    console.log("Manual order submissions for order 15:", manualOrderSubmissionsResult.rows)

    // Check what the admin suppliers-confirmed API would return
    const adminConfirmedResult = await dbQuery(`
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
          WHEN br.id IS NOT NULL THEN COALESCE(b.company_name, u.name, br.buyer_id, 'Unknown Buyer')
          ELSE 'Unknown'
        END as buyer_name,
        ar.supplier_company,
        ar.driver_name,
        ar.driver_mobile,
        ar.vehicle_number,
        ar.sent_by_admin as is_sent_to_buyer,
        CASE 
          WHEN mos.id IS NOT NULL THEN 'manual_order'
          WHEN br.id IS NOT NULL THEN 'buyer_request'
          ELSE 'unknown'
        END as order_type
      FROM accepted_requests ar
      LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      WHERE ar.sent_by_admin = false
      AND (br.order_number = 'ORD-15' OR mos.order_number = 'ORD-15')
      ORDER BY ar.accepted_at DESC
    `)
    console.log("Admin confirmed result for order 15:", adminConfirmedResult.rows)

    return NextResponse.json({
      success: true,
      message: "Order 15 debug completed",
      results: {
        buyerRequests: buyerRequestResult.rows,
        orderSubmissions: orderSubmissionsResult.rows,
        acceptedRequests: acceptedRequestsResult.rows,
        manualOrders: manualOrdersResult.rows,
        manualOrderSubmissions: manualOrderSubmissionsResult.rows,
        adminConfirmedResult: adminConfirmedResult.rows
      }
    })

  } catch (error) {
    console.error("Order 15 debug error:", error)
    return NextResponse.json({ 
      error: "Debug failed",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
