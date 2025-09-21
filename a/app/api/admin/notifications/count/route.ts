import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("GET /api/admin/notifications/count - fetching notification count...")
    
    // Check database connection
    let pool = getPool()
    if (!pool) {
      console.log("Database not available")
      const response = NextResponse.json({ count: 0 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Test database connection first
    try {
      await pool.query('SELECT 1')
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      const response = NextResponse.json({ count: 0 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Check if notification tables exist
    let supplierTableExists, transportRequestTableExists
    try {
      const tableCheckResult = await dbQuery(`
        SELECT 
          EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'supplier_vehicle_location_notifications') as supplier_exists,
          EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transport_request_notifications') as transport_request_exists
      `)
      
      supplierTableExists = tableCheckResult.rows[0].supplier_exists
      transportRequestTableExists = tableCheckResult.rows[0].transport_request_exists
    } catch (tableCheckError) {
      console.error("Error checking table existence:", tableCheckError)
      const response = NextResponse.json({ count: 0 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    // Count unread notifications from both tables
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

    // Count transport request notifications (buyer orders)
    if (transportRequestTableExists) {
      try {
        const transportResult = await dbQuery(`
          SELECT COUNT(*) as count 
          FROM transport_request_notifications 
          WHERE is_read = FALSE
        `)
        totalCount += parseInt(transportResult.rows[0].count) || 0
        console.log(`Found ${transportResult.rows[0].count} unread transport request notifications`)
      } catch (countError) {
        console.error("Error counting transport request notifications:", countError)
      }
    }

    console.log(`Total unread notifications: ${totalCount}`)

    const response = NextResponse.json({ count: totalCount })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error fetching notification count:", error)
    const response = NextResponse.json({ count: 0 })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}
