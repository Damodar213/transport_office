import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    console.log(`DELETE /api/supplier/notifications/${id} - deleting notification`)
    
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
        message: "Notification deleted (mock mode)"
      })
    }
    
    // Delete notification
    const result = await dbQuery(`
      DELETE FROM supplier_notifications 
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }
    
    console.log(`Supplier notification ${id} deleted successfully`)
    return NextResponse.json({ 
      message: "Notification deleted successfully",
      notificationId: id
    })
    
  } catch (error) {
    console.error("Error deleting supplier notification:", error)
    return NextResponse.json({ 
      error: "Failed to delete notification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}



