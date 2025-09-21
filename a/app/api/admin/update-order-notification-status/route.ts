import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("Update order notification status API called")
    const { orderSubmissionId, orderType, notificationSent, whatsappSent } = await request.json()
    console.log("Request data:", { orderSubmissionId, orderType, notificationSent, whatsappSent })

    if (!orderSubmissionId || !orderType) {
      return NextResponse.json(
        { error: "Missing required fields: orderSubmissionId, orderType" },
        { status: 400 }
      )
    }

    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is an admin
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: "Access denied - admin role required" }, { status: 403 })
    }

    const parsedOrderSubmissionId = parseInt(orderSubmissionId)

    // Update the appropriate table based on order type
    let updateResult
    if (orderType === 'manual_order') {
      updateResult = await dbQuery(
        `UPDATE manual_order_submissions 
         SET notification_sent = $2, whatsapp_sent = $3, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata' 
         WHERE id = $1`,
        [parsedOrderSubmissionId, notificationSent || false, whatsappSent || false]
      )
    } else {
      updateResult = await dbQuery(
        `UPDATE order_submissions 
         SET notification_sent = $2, whatsapp_sent = $3, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata' 
         WHERE id = $1`,
        [parsedOrderSubmissionId, notificationSent || false, whatsappSent || false]
      )
    }

    console.log("Update result:", updateResult.rowCount, "rows affected")

    return NextResponse.json({
      success: true,
      message: "Order notification status updated successfully",
      updatedRows: updateResult.rowCount
    })

  } catch (error) {
    console.error("Error updating order notification status:", error)
    return NextResponse.json(
      { 
        error: "Internal server error", 
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      },
      { status: 500 }
    )
  }
}




