import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Check if pool is available
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database pool not available",
        message: "DATABASE_URL might be missing or invalid"
      }, { status: 500 })
    }
    
    // Test basic connection
    const result = await dbQuery("SELECT 1 as test")
    console.log("Basic connection test result:", result.rows[0])
    
    // Test users table access
    const usersResult = await dbQuery("SELECT COUNT(*) as count FROM users")
    console.log("Users table access result:", usersResult.rows[0])
    
    // Test specific user query (like your app does)
    const userQuery = await dbQuery(`
      SELECT u.id, u.user_id as "userId", u.role, u.email, u.name, u.mobile
      FROM users u
      WHERE u.role = $1
      LIMIT 5
    `, ['supplier'])
    
    console.log("User query result:", userQuery.rows.length, "rows returned")
    
    return NextResponse.json({
      success: true,
      message: "Database connection is working",
      results: {
        basicTest: result.rows[0],
        usersCount: usersResult.rows[0],
        sampleUsers: userQuery.rows
      }
    })
    
  } catch (error) {
    console.error("Database test failed:", error)
    return NextResponse.json({ 
      error: "Database test failed",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 })
  }
}