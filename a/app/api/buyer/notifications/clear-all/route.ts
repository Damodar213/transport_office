import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    
    if (!buyerId) {
      const response = NextResponse.json({ error: "Buyer ID is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    console.log(`DELETE /api/buyer/notifications/clear-all - clearing all notifications for buyer ${buyerId}`)
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
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
      return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
        error: "Buyer notifications table not found",
        message: "All notifications cleared (mock mode)
      })
    }
    
    // Delete all notifications for this buyer
    const result = await dbQuery(`
      DELETE FROM buyer_notifications
      WHERE buyer_id = $1
      RETURNING id
    `, [buyerId])
    
    const deletedCount = result.rows.length
    console.log(`${deletedCount} buyer notifications cleared for buyer ${buyerId}`)
    
    const response = NextResponse.json({
      success: true,
      message: "All buyer notifications cleared successfully",
      deletedCount: deletedCount
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error clearing all buyer notifications:", error)
    const response = NextResponse.json({
      error: "Failed to clear all buyer notifications",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}






























