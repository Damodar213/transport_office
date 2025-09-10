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

    // Check if supplier notification table exists
    let supplierTableExists
    try {
      const tableCheckResult = await dbQuery(`
        SELECT 
          EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_vehicle_location_notifications') as supplier_exists
      `)
      
      supplierTableExists = tableCheckResult.rows[0].supplier_exists
    } catch (tableCheckError) {
      console.error("Error checking table existence:", tableCheckError)
      return NextResponse.json({ count: 0 })
    }
    
    // Count unread notifications from supplier table only
    let totalCount = 0
    
    // Count supplier vehicle location notifications
    if (supplierTableExists) {
      try {
        const supplierResult = await dbQuery(`
          SELECT COUNT(*) as count 
          FROM supplier_vehicle_location_notifications 
          WHERE is_read = FALSE
        `)
        totalCount += parseInt(supplierResult.rows[0].count) || 0
        console.log(`Found ${supplierResult.rows[0].count} unread supplier vehicle location notifications`)
      } catch (countError) {
        console.error("Error counting supplier notifications:", countError)
      }
    }

    console.log(`Total unread notifications: ${totalCount}`)

    return NextResponse.json({ count: totalCount })

  } catch (error) {
    console.error("Error fetching notification count:", error)
    return NextResponse.json({ count: 0 })
  }
}
