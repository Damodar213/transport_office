import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("Debug notifications API called")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check all notifications in the database
    const allNotifications = await dbQuery(`
      SELECT 
        id, type, title, message, category, priority, is_read, created_at, updated_at
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 20
    `)
    
    console.log("All notifications found:", allNotifications.rows.length)
    console.log("Sample notifications:", allNotifications.rows)

    // Check for manual order confirmation notifications specifically
    const manualOrderNotifications = await dbQuery(`
      SELECT 
        id, type, title, message, category, priority, is_read, created_at, updated_at
      FROM notifications 
      WHERE title LIKE '%Order Confirmed%' OR message LIKE '%Manual Order%'
      ORDER BY created_at DESC 
      LIMIT 10
    `)
    
    console.log("Manual order notifications found:", manualOrderNotifications.rows.length)
    console.log("Manual order notifications:", manualOrderNotifications.rows)

    // Check accepted_requests to see if there are any manual orders that should have notifications
    const acceptedRequests = await dbQuery(`
      SELECT 
        ar.id, ar.order_number, ar.status, ar.accepted_at, ar.sent_by_admin,
        mos.order_id as manual_order_id, mo.order_number as manual_order_number
      FROM accepted_requests ar
      LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
      LEFT JOIN manual_orders mo ON mos.order_id = mo.id
      WHERE ar.sent_by_admin = false AND ar.status = 'accepted'
      ORDER BY ar.accepted_at DESC 
      LIMIT 10
    `)
    
    console.log("Accepted requests (should have notifications):", acceptedRequests.rows.length)
    console.log("Accepted requests:", acceptedRequests.rows)

    return NextResponse.json({
      success: true,
      message: "Notifications debug completed",
      results: {
        totalNotifications: allNotifications.rows.length,
        manualOrderNotifications: manualOrderNotifications.rows.length,
        acceptedRequests: acceptedRequests.rows.length,
        allNotifications: allNotifications.rows,
        manualOrderNotifications: manualOrderNotifications.rows,
        acceptedRequests: acceptedRequests.rows
      }
    })

  } catch (error) {
    console.error("Error debugging notifications:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
