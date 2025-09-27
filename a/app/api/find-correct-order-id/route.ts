import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Find correct order ID API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('orderNumber')

    if (!orderNumber) {
      return NextResponse.json({
        error: "Missing required parameter: orderNumber"
      }, { status: 400 })
    }

    console.log("Finding correct order ID for orderNumber:", orderNumber)

    // Find manual order by order_number
    const manualOrder = await dbQuery(
      "SELECT id, order_number, status FROM manual_orders WHERE order_number = $1",
      [orderNumber]
    )
    console.log("Manual order found by order_number:", manualOrder.rows)

    // Find accepted requests by order_number
    const acceptedRequests = await dbQuery(`
      SELECT ar.id, ar.status, ar.order_submission_id, mos.order_id, mo.order_number
      FROM accepted_requests ar
      JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      JOIN manual_orders mo ON mos.order_id = mo.id
      WHERE mo.order_number = $1
    `, [orderNumber])
    console.log("Accepted requests found by order_number:", acceptedRequests.rows)

    // Find manual order submissions by order_number
    const manualSubmissions = await dbQuery(`
      SELECT mos.id, mos.order_id, mos.supplier_id, mos.status, mo.order_number
      FROM manual_order_submissions mos
      JOIN manual_orders mo ON mos.order_id = mo.id
      WHERE mo.order_number = $1
    `, [orderNumber])
    console.log("Manual order submissions found by order_number:", manualSubmissions.rows)

    return NextResponse.json({
      success: true,
      orderNumber: orderNumber,
      results: {
        manualOrder: manualOrder.rows,
        acceptedRequests: acceptedRequests.rows,
        manualSubmissions: manualSubmissions.rows
      },
      correctOrderId: manualOrder.rows[0]?.id || null
    })

  } catch (error) {
    console.error("Error finding correct order ID:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
