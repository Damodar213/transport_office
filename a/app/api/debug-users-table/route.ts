import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Get users table structure
    const usersResult = await dbQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)

    // Get sample users
    const sampleUsers = await dbQuery(`
      SELECT user_id, name, company_name, role
      FROM users 
      WHERE role = 'supplier'
      LIMIT 3
    `)

    return NextResponse.json({
      success: true,
      usersTableStructure: usersResult.rows,
      sampleUsers: sampleUsers.rows,
      message: "Users table debug info retrieved"
    })

  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ 
      error: "Debug failed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


