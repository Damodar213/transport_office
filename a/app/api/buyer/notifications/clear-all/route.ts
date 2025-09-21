import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    
    if (!buyerId) {
    }
    
    console.log(`DELETE /api/buyer/notifications/clear-all - clearing all notifications for buyer ${buyerId}`)
    
    if (!getPool()) {
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
        message: "All notifications cleared (mock mode)"
      })
      return addCorsHeaders(response)
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
      deletedCount: deletedCount})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error clearing all buyer notifications:", error)
    const response = NextResponse.json({
      error: "Failed to clear all buyer notifications",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }