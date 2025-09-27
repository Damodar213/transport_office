import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ [key: string]: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }
    
    console.log(`PUT /api/buyer/notifications/${id}/read - marking as read`)
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
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
      return NextResponse.json({
        error: "Buyer notifications table not found",
        message: "Notification marked as read (mock mode)"
      })
    }
    
    // Update the notification to mark as read
    const result = await dbQuery(`
      UPDATE buyer_notifications
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }
    
    const updatedNotification = result.rows[0]
    console.log(`Notification ${id} marked as read successfully`)
    
    return NextResponse.json({
      success: true,
      message: "Notification marked as read successfully",
      notification: {
        id: updatedNotification.id.toString(),
        isRead: updatedNotification.is_read
      }
    })
    
  } catch (error) {
    console.error("Error marking buyer notification as read:", error)
    return NextResponse.json({
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

