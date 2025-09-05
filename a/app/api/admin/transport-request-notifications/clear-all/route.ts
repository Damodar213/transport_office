import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// DELETE - Clear all transport request notifications
export async function DELETE() {
  try {
    console.log("DELETE /api/admin/transport-request-notifications/clear-all - clearing all notifications...")
    
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

    // Delete all notifications
    const result = await dbQuery(`
      DELETE FROM transport_request_notifications 
      RETURNING COUNT(*) as deleted_count
    `)

    const deletedCount = parseInt(result.rows[0].deleted_count) || 0
    console.log(`Deleted ${deletedCount} notifications`)

    return NextResponse.json({
      success: true,
      message: `Cleared ${deletedCount} notifications`,
      deletedCount
    })

  } catch (error) {
    console.error("Error clearing all notifications:", error)
    return NextResponse.json({ 
      error: "Failed to clear notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
