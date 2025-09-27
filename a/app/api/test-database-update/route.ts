import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Test database update API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({
        error: "Missing required field: orderId"
      }, { status: 400 })
    }

    console.log("Testing database update for orderId:", orderId)

    // Step 1: Check initial state
    console.log("=== STEP 1: CHECKING INITIAL STATE ===")
    const initialManualOrder = await dbQuery(
      "SELECT id, order_number, status, updated_at FROM manual_orders WHERE id = $1",
      [orderId]
    )
    console.log("Initial manual order:", initialManualOrder.rows)

    const initialAcceptedRequests = await dbQuery(`
      SELECT ar.id, ar.status, ar.updated_at, mos.order_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])
    console.log("Initial accepted requests:", initialAcceptedRequests.rows)

    // Step 2: Update manual_orders
    console.log("=== STEP 2: UPDATING MANUAL_ORDERS ===")
    const updateManualOrder = await dbQuery(
      "UPDATE manual_orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [orderId]
    )
    console.log("Manual order update result:", updateManualOrder.rows)

    // Step 3: Update accepted_requests
    console.log("=== STEP 3: UPDATING ACCEPTED_REQUESTS ===")
    let updateAcceptedRequests = null
    if (initialAcceptedRequests.rows.length > 0) {
      const acceptedRequestId = initialAcceptedRequests.rows[0].id
      updateAcceptedRequests = await dbQuery(
        "UPDATE accepted_requests SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
        [acceptedRequestId]
      )
      console.log("Accepted requests update result:", updateAcceptedRequests.rows)
    } else {
      console.log("No accepted requests found to update")
    }

    // Step 4: Wait a moment and verify
    console.log("=== STEP 4: WAITING AND VERIFYING ===")
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second

    const verifyManualOrder = await dbQuery(
      "SELECT id, order_number, status, updated_at FROM manual_orders WHERE id = $1",
      [orderId]
    )
    console.log("Verify manual order:", verifyManualOrder.rows)

    const verifyAcceptedRequests = await dbQuery(`
      SELECT ar.id, ar.status, ar.updated_at, mos.order_id
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      WHERE mos.order_id = $1
    `, [orderId])
    console.log("Verify accepted requests:", verifyAcceptedRequests.rows)

    // Step 5: Test the suppliers-confirmed API query
    console.log("=== STEP 5: TESTING SUPPLIERS-CONFIRMED QUERY ===")
    const suppliersConfirmedQuery = await dbQuery(`
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
      WHERE ar.sent_by_admin = false AND mos.order_id = $1
      ORDER BY ar.accepted_at DESC
    `, [orderId])
    console.log("Suppliers confirmed query result:", suppliersConfirmedQuery.rows)

    return NextResponse.json({
      success: true,
      message: "Database update test completed",
      orderId: orderId,
      results: {
        initial: {
          manualOrder: initialManualOrder.rows,
          acceptedRequests: initialAcceptedRequests.rows
        },
        updates: {
          manualOrder: updateManualOrder.rows,
          acceptedRequests: updateAcceptedRequests?.rows || []
        },
        verification: {
          manualOrder: verifyManualOrder.rows,
          acceptedRequests: verifyAcceptedRequests.rows
        },
        suppliersConfirmedQuery: suppliersConfirmedQuery.rows
      }
    })

  } catch (error) {
    console.error("Error testing database update:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
