import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT() {
  try {
    console.log("PUT /api/admin/notifications/mark-all-read - marking all as read")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check if notifications table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications')
    `)
    
    if (!tableExists.rows[0].exists) {
      const response = NextResponse.json({ error: "Notifications table not found" })
        message: "All notifications marked as read (mock mode)"
})
      return addCorsHeaders(response)
    }

    // Update all unread notifications to mark as read
    const result = await dbQuery(`
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE is_read = FALSE)
      RETURNING COUNT(*) as updated_count
    `)
    
    const updatedCount = result.rows[0].updated_count
    
    console.log(`${updatedCount} notifications marked as read successfully`)
    const response = NextResponse.json({ message: "All notifications marked as read successfully" })
      updatedCount: parseInt(updatedCount)
})
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    const response = NextResponse.json({ 
      error: "Failed to mark all notifications as read",
      details: error instanceof Error ? error.message : "Unknown error"


})
    }, { status: 500 })
    return addCorsHeaders(response)
  }
