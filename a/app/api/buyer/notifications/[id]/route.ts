import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    }
    
    console.log(`DELETE /api/buyer/notifications/${id} - deleting notification`)
    
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
        message: "Notification deleted (mock mode)"
      })
    }
    
    // Delete the notification
    const result = await dbQuery(`
      DELETE FROM buyer_notifications
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }
    
    console.log(`Notification ${id} deleted successfully`)
    
    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    })
    
  } catch (error) {
    console.error("Error deleting buyer notification:", error)
    return NextResponse.json({
      error: "Failed to delete notification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


