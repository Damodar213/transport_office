import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    if (!id) {
      const response = NextResponse.json({ error: "Notification ID is required" }, { status: 400 })
    return addCorsHeaders(response)
    }
    
    console.log(`DELETE /api/buyer/notifications/${id} - deleting notification`)
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
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
        message: "Notification deleted (mock mode)
      })
    }
    
    // Delete the notification
    const result = await dbQuery(`
      DELETE FROM buyer_notifications
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      const response = NextResponse.json({ error: "Notification not found" }, { status: 404 })
    return addCorsHeaders(response)
    }
    
    console.log(`Notification ${id} deleted successfully`)
    
    const response = NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error deleting buyer notification:", error)
    const response = NextResponse.json({
      error: "Failed to delete notification",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}






























