import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log(`PUT /api/supplier/notifications/${id}/read - marking as read`)
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
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
      return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
        error: "Supplier notifications table not found",
        message: "Notification marked as read (mock mode)
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
      const response = NextResponse.json({ error: "Notification not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    console.log(`Supplier notification ${id} marked as read successfully`)
    const response = NextResponse.json({ 
      message: "Notification marked as read successfully",
      notificationId: id
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error marking supplier notification as read:", error)
    const response = NextResponse.json({ 
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}





