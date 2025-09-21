import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(request: Request,
  { params }: { params: Promise<{ id: string }> }
)
) {
  try {
    const { id } = await params
    console.log(`DELETE /api/supplier/notifications/${id} - deleting notification`)
    
    if (!getPool()) {
    }

    // Check if supplier_notifications table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_notifications')
      )
    `)
    
    if (!tableExists.rows[0].exists) {
        error: "Supplier notifications table not found",
        message: "Notification deleted (mock mode)"
})
    }

    // Delete notification
    const result = await dbQuery(`
      DELETE FROM supplier_notifications 
      WHERE id = $1
      RETURNING id)
    `, [id])
    
    if (result.rows.length === 0) {
    }

    console.log(`Supplier notification ${id} deleted successfully`)
    const response = NextResponse.json({ 
      message: "Notification deleted successfully",)
      notificationId: id})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error deleting supplier notification:", error)
    const response = NextResponse.json({ 
      error: "Failed to delete notification",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
