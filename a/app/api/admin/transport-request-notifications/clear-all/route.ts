import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE() {
  try {
    console.log("DELETE /api/admin/transport-request-notifications/clear-all - clearing all transport request notifications")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    
    // Check if table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transport_request_notifications'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      return NextResponse.json({ 
        error: "Transport request notifications table not found",
        message: "All transport request notifications cleared (mock mode)"
      })
    }
    
    // Get count before deletion
    const countResult = await dbQuery(`
      SELECT COUNT(*) as total_count FROM transport_request_notifications
    `)
    const totalCount = countResult.rows[0].total_count
    
    // Delete all transport request notifications
    await dbQuery(`
      DELETE FROM transport_request_notifications
    `)
    
    console.log(`${totalCount} transport request notifications cleared successfully`)
    return NextResponse.json({ 
      message: "All transport request notifications cleared successfully",
      clearedCount: parseInt(totalCount)
    })
    
  } catch (error) {
    console.error("Error clearing all transport request notifications:", error)
    return NextResponse.json({ 
      error: "Failed to clear all transport request notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
