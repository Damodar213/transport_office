import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("📋 Listing all users...")
    
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available",
        message: "DATABASE_URL might be missing or invalid"
      }, { status: 500 })
    }

    // Get all users with their profile data
    const users = await dbQuery(`
      SELECT 
        u.id,
        u.user_id,
        u.role,
        u.email,
        u.name,
        u.mobile,
        u.created_at,
        COALESCE(s.company_name, b.company_name) as company_name,
        COALESCE(s.gst_number, b.gst_number) as gst_number
      FROM users u
      LEFT JOIN suppliers s ON u.user_id = s.user_id
      LEFT JOIN buyers b ON u.user_id = b.user_id
      ORDER BY u.role, u.created_at
    `)

    return NextResponse.json({
      success: true,
      message: `Found ${users.rows.length} users`,
      users: users.rows,
      summary: {
        total: users.rows.length,
        admins: users.rows.filter(u => u.role === 'admin').length,
        suppliers: users.rows.filter(u => u.role === 'supplier').length,
        buyers: users.rows.filter(u => u.role === 'buyer').length
      }
    })
    
  } catch (error) {
    console.error("❌ Failed to list users:", error)
    return NextResponse.json({ 
      error: "Failed to list users",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 })
  }
}
