import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`DELETE /api/supplier/notifications/${id} - deleting notification`)
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
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
      const response = NextResponse.json({ 
        error: "Supplier notifications table not found",
        message: "Notification deleted (mock mode)
    return addCorsHeaders(response)"
      })
    }
    
    // Delete notification
    const result = await dbQuery(`
      DELETE FROM supplier_notifications 
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      const response = NextResponse.json({ error: "Notification not found" }, { status: 404 })
    return addCorsHeaders(response)
    }
    
    console.log(`Supplier notification ${id} deleted successfully`)
    const response = NextResponse.json({ 
      message: "Notification deleted successfully",
      notificationId: id
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error deleting supplier notification:", error)
    const response = NextResponse.json({ 
      error: "Failed to delete notification",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}





