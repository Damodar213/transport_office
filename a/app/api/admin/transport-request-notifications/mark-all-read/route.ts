import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark all transport request notifications as read
export async function PUT() {
  try {
    console.log("PUT /api/admin/transport-request-notifications/mark-all-read - marking all as read...")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Test database connection first
    try {
      await getPool()!.query('SELECT 1')
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Check if transport_request_notifications table exists
    let tableExists
    try {
      tableExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'transport_request_notifications'
        )
      `)
    } catch (tableCheckError) {
      console.error("Error checking table existence:", tableCheckError)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }
    
    if (!tableExists.rows[0].exists) {
      return NextResponse.json({ 
        success: true,
        message: "No notifications table found"
      })
    }

    // Mark all unread notifications as read
    const result = await dbQuery(`
      UPDATE transport_request_notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE is_read = FALSE
      RETURNING COUNT(*) as updated_count
    `)

    const updatedCount = parseInt(result.rows[0].updated_count) || 0
    console.log(`Marked ${updatedCount} notifications as read`)

    return NextResponse.json({
      success: true,
      message: `Marked ${updatedCount} notifications as read`,
      updatedCount
    })

  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json({ 
      error: "Failed to mark notifications as read",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
