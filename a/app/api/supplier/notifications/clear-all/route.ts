import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")
    
    console.log("DELETE /api/supplier/notifications/clear-all - clearing all notifications for supplier:", supplierId)
    
    if (!supplierId) {
    }

    if (!getPool()) {
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
        error: "Supplier notifications table not found",
        message: "All notifications cleared (mock mode)"
      })
    }

    // Get count before deletion
    const countResult = await dbQuery(`
      SELECT COUNT(*) as total_count FROM supplier_notifications WHERE supplier_id = $1
    `, [supplierId])
    const totalCount = countResult.rows[0].total_count
    
    // Delete all notifications for this supplier
    await dbQuery(`
      DELETE FROM supplier_notifications WHERE supplier_id = $1
    `, [supplierId])
    
    console.log(`${totalCount} supplier notifications cleared successfully`)
    const response = NextResponse.json({ 
      message: "All notifications cleared successfully",
      clearedCount: parseInt(totalCount)})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error clearing all supplier notifications:", error)
    const response = NextResponse.json({ 
      error: "Failed to clear all notifications",
      details: error instanceof Error ? error.message : "Unknown error"
  }
  })
    return addCorsHeaders(response)
  }
