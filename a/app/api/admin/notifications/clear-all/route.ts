import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE() {
  try {
    console.log("DELETE /api/admin/notifications/clear-all - clearing all notifications")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check if notifications table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      const response = NextResponse.json({ 
        error: "Notifications table not found",
        message: "All notifications cleared (mock mode)"
      })
      return addCorsHeaders(response)
    }

    // Get count before deletion
    const countResult = await dbQuery(`
      SELECT COUNT(*) as total_count FROM notifications
    `)
    const totalCount = countResult.rows[0].total_count
    
    // Delete all notifications
    await dbQuery(`
      DELETE FROM notifications
    `)
    
    console.log(`${totalCount} notifications cleared successfully`)
    const response = NextResponse.json({ 
      message: "All notifications cleared successfully",
      clearedCount: parseInt(totalCount)
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error clearing all notifications:", error)
    const response = NextResponse.json({ 
      error: "Failed to clear all notifications",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

    }, { status: 500 })
    return addCorsHeaders(response)
  }

}
