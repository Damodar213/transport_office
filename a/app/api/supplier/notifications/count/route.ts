import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")
    
    if (!supplierId) {
      const response = NextResponse.json({ 
        error: "Supplier ID is required" 
      }, { status: 400 })
    }
    
    if (!getPool()) {
      const response = NextResponse.json({ 
        unreadCount: 0,
        totalCount: 0
      })
    }
    
    try {
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
          unreadCount: 0,
          totalCount: 0
        })
      }
      
      // Get unread count
      const unreadResult = await dbQuery(`
        SELECT COUNT(*) as unread_count
        FROM supplier_notifications 
        WHERE supplier_id = $1 AND is_read = false
      `, [supplierId])
      
      // Get total count
      const totalResult = await dbQuery(`
        SELECT COUNT(*) as total_count
        FROM supplier_notifications 
        WHERE supplier_id = $1
      `, [supplierId])
      
      const unreadCount = parseInt(unreadResult.rows[0].unread_count)
      const totalCount = parseInt(totalResult.rows[0].total_count)
      
      const response = NextResponse.json({
        unreadCount,
        totalCount
      })
      
    } catch (error) {
      console.error("Error fetching notification count:", error)
      const response = NextResponse.json({ 
        unreadCount: 0,
        totalCount: 0
      })
    }
    
  } catch (error) {
    console.error("Error in notification count API:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch notification count",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}





