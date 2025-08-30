import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("GET /api/admin/settings/test-db - testing database connection...")
    
    if (!getPool()) {
      return NextResponse.json({ 
        error: "Database not available",
        status: "disconnected"
      }, { status: 500 })
    }
    
    try {
      // Test basic connection
      const connectionTest = await dbQuery("SELECT 1 as test")
      if (connectionTest.rows[0].test !== 1) {
        throw new Error("Connection test failed")
      }
      
      // Test table access
      const tableTest = await dbQuery(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        LIMIT 5
      `)
      
      // Test performance with a simple query
      const startTime = Date.now()
      await dbQuery("SELECT COUNT(*) FROM users")
      const queryTime = Date.now() - startTime
      
      // Get database info
      const versionResult = await dbQuery("SELECT version()")
      const version = versionResult.rows[0].version
      
      console.log("Database connection test successful")
      return NextResponse.json({
        status: "connected",
        message: "Database connection test successful",
        details: {
          connection: "OK",
          tables: tableTest.rows.length,
          queryTime: `${queryTime}ms`,
          version: version.split(' ')[0] + ' ' + version.split(' ')[1] // PostgreSQL 15.4
        }
      })
      
    } catch (error) {
      console.error("Database connection test failed:", error)
      return NextResponse.json({
        status: "error",
        error: "Database connection test failed",
        details: error instanceof Error ? error.message : "Unknown error"
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error("Error in database test API:", error)
    return NextResponse.json({ 
      error: "Failed to test database connection",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}





