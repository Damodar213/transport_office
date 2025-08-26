import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")
    
    console.log("GET /api/supplier/notifications/count - getting count for supplier:", supplierId)
    
    if (!supplierId) {
      return NextResponse.json({ 
        error: "Supplier ID is required" 
      }, { status: 400 })
    }
    
    // If database is available, try to fetch real count
    if (getPool()) {
      try {
        // Check if supplier_notifications table exists
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'supplier_notifications'
          )
        `)
        
        if (tableExists.rows[0].exists) {
          // Get total count and unread count
          const totalResult = await dbQuery(`
            SELECT COUNT(*) as total_count FROM supplier_notifications WHERE supplier_id = $1
          `, [supplierId])
          
          const unreadResult = await dbQuery(`
            SELECT COUNT(*) as unread_count FROM supplier_notifications WHERE supplier_id = $1 AND is_read = FALSE
          `, [supplierId])
          
          const totalCount = parseInt(totalResult.rows[0].total_count)
          const unreadCount = parseInt(unreadResult.rows[0].unread_count)
          
          console.log(`Supplier ${supplierId}: ${totalCount} total, ${unreadCount} unread`)
          return NextResponse.json({ 
            totalCount,
            unreadCount
          })
        }
      } catch (error) {
        console.error("Error fetching notification count from database:", error)
      }
    }
    
    // Fallback to mock data count
    const mockUnreadCount = 3 // This matches the original mock data
    console.log(`Using mock data: ${mockUnreadCount} unread notifications`)
    return NextResponse.json({ 
      totalCount: 5,
      unreadCount: mockUnreadCount
    })
    
  } catch (error) {
    console.error("Error in supplier notification count API:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notification count",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}



