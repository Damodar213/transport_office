import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug accepted requests API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const orderSubmissionId = searchParams.get('orderSubmissionId')
    const buyerId = searchParams.get('buyerId')

    let query = `
      SELECT 
        ar.id,
        ar.order_submission_id,
        ar.buyer_id,
        ar.sent_by_admin,
        ar.status,
        ar.created_at,
        ar.accepted_at,
        ar.order_number,
        os.status as order_status
      FROM accepted_requests ar
      LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramCount = 0

    if (orderSubmissionId) {
      paramCount++
      query += ` AND ar.order_submission_id = $${paramCount}`
      params.push(orderSubmissionId)
    }

    if (buyerId) {
      paramCount++
      query += ` AND ar.buyer_id = $${paramCount}`
      params.push(buyerId)
    }

    query += ` ORDER BY ar.created_at DESC`

    const result = await dbQuery(query, params)

    console.log("Debug query result:", {
      orderSubmissionId,
      buyerId,
      totalRecords: result.rows.length,
      records: result.rows
    })

    return NextResponse.json({
      success: true,
      debug: {
        orderSubmissionId,
        buyerId,
        totalRecords: result.rows.length,
        records: result.rows
      }
    })

  } catch (error) {
    console.error("Error in debug accepted requests:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    console.log("Clean up orphaned accepted requests API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const orderSubmissionId = searchParams.get('orderSubmissionId')
    const buyerId = searchParams.get('buyerId')

    if (!orderSubmissionId || !buyerId) {
      return NextResponse.json(
        { error: "Both orderSubmissionId and buyerId are required" },
        { status: 400 }
      )
    }

    // Delete orphaned records for this specific order and buyer
    const deleteResult = await dbQuery(
      `DELETE FROM accepted_requests 
       WHERE order_submission_id = $1 AND buyer_id = $2 AND sent_by_admin = false`,
      [orderSubmissionId, buyerId]
    )

    console.log("Cleaned up orphaned records:", {
      orderSubmissionId,
      buyerId,
      deletedCount: deleteResult.rowCount
    })

    return NextResponse.json({
      success: true,
      message: "Orphaned records cleaned up",
      deletedCount: deleteResult.rowCount
    })

  } catch (error) {
    console.error("Error cleaning up orphaned records:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

