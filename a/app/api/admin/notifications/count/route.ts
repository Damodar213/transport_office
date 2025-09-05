import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("GET /api/admin/notifications/count - fetching notification count...")
    
    // Check database connection
    let pool = getPool()
    if (!pool) {
      console.log("Database not available")
      return NextResponse.json({ count: 0 })
    }

    // Test database connection first
    try {
      await pool.query('SELECT 1')
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json({ count: 0 })
    }

    // Check if transport_request_notifications table exists
    let tableExists
    try {
      tableExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'transport_request_notifications'
        )
      `)
    } catch (tableCheckError) {
      console.error("Error checking table existence:", tableCheckError)
      return NextResponse.json({ count: 0 })
    }
    
    // If table doesn't exist, return 0
    if (!tableExists.rows[0].exists) {
      return NextResponse.json({ count: 0 })
    }

    // Count unread notifications
    let result
    try {
      result = await dbQuery(`
        SELECT COUNT(*) as count 
        FROM transport_request_notifications 
        WHERE is_read = FALSE
      `)
    } catch (countError) {
      console.error("Error counting notifications:", countError)
      return NextResponse.json({ count: 0 })
    }

    const count = parseInt(result.rows[0].count) || 0
    console.log(`Found ${count} unread notifications`)

    return NextResponse.json({ count })

  } catch (error) {
    console.error("Error fetching notification count:", error)
    return NextResponse.json({ count: 0 })
  }
}
