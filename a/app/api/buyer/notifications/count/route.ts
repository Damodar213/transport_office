import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    
    if (!buyerId) {
      return NextResponse.json({ 
        error: "Buyer ID is required" 
      }, { status: 400 })
    }
    
    console.log(`GET /api/buyer/notifications/count - fetching count for buyer ${buyerId}`)
    console.log("Database pool available:", !!getPool())
    
    let unreadCount = 0
    
    if (getPool()) {
      try {
        // Check if buyer_notifications table exists
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'buyer_notifications'
          )
        `)
        
        if (tableExists.rows[0].exists) {
          const result = await dbQuery(`
            SELECT COUNT(*) as count
            FROM buyer_notifications 
            WHERE buyer_id = $1 AND is_read = FALSE
          `, [buyerId])
          
          unreadCount = parseInt(result.rows[0].count) || 0
        }
      } catch (error) {
        console.error("Error fetching notification count from database:", error)
      }
    }
    
    console.log(`Returning unread count ${unreadCount} for buyer ${buyerId}`)
    return NextResponse.json({ unreadCount })
    
  } catch (error) {
    console.error("Error fetching buyer notification count:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notification count",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
