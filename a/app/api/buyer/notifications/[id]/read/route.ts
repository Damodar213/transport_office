import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      const response = NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    console.log(`PUT /api/buyer/notifications/${id}/read - marking as read`)
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    // Check if buyer_notifications table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'buyer_notifications'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      const response = NextResponse.json({
        error: "Buyer notifications table not found",
        message: "Notification marked as read (mock mode)"
      })
      return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    // Update the notification to mark as read
    const result = await dbQuery(`
      UPDATE buyer_notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id])
    
    if (result.rows.length === 0) {
      const response = NextResponse.json({ error: "Notification not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    const updatedNotification = result.rows[0]
    console.log(`Notification ${id} marked as read successfully`)
    
    const response = NextResponse.json({
      success: true,
      message: "Notification marked as read successfully",
      notification: {
        id: updatedNotification.id.toString(),
        isRead: updatedNotification.is_read
      }
    })
    return addCorsHeaders(response)
    return addCorsHeaders(response)
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error marking buyer notification as read:", error)
    const response = NextResponse.json({
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

