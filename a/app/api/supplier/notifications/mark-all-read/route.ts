import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")
    
    console.log("PUT /api/supplier/notifications/mark-all-read - marking all as read for supplier:", supplierId)
    
    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }
    
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
        message: "All notifications marked as read (mock mode)"
      })
    }
    
    // Update all unread notifications for this supplier to mark as read
    const result = await dbQuery(`
      UPDATE supplier_notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE supplier_id = $1 AND is_read = FALSE
    `, [supplierId])
    
    const updatedCount = result.rowCount || 0
    
    console.log(`${updatedCount} supplier notifications marked as read successfully`)
    return NextResponse.json({ 
      message: "All notifications marked as read successfully",
      updatedCount: parseInt(updatedCount)
    })
    
  } catch (error) {
    console.error("Error marking all supplier notifications as read:", error)
    return NextResponse.json({ 
      error: "Failed to mark all notifications as read",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}





