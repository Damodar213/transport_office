import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`PUT /api/supplier/notifications/${id}/read - marking as read`)
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    
    // Check if supplier_notifications table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_notifications'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      return NextResponse.json({ 
        error: "Supplier notifications table not found",
        message: "Notification marked as read (mock mode)"
      })
    }
    
    // Update notification to mark as read
    const result = await dbQuery(`
      UPDATE supplier_notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }
    
    console.log(`Supplier notification ${id} marked as read successfully`)
    return NextResponse.json({ 
      message: "Notification marked as read successfully",
      notificationId: id
    })
    
  } catch (error) {
    console.error("Error marking supplier notification as read:", error)
    return NextResponse.json({ 
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

