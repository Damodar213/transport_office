import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getPool, dbQuery } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check recent users in database
    const recentUsers = await dbQuery(`
      SELECT u.user_id, u.role, u.name, u.created_at, s.company_name, s.gst_number
      FROM users u
      LEFT JOIN suppliers s ON s.user_id = u.user_id
      ORDER BY u.created_at DESC 
      LIMIT 10)
    `)

    // Check if there are any users in the file system
    const fs = require('fs')
    const path = require('path')
    const usersFile = path.join(process.cwd(), "data", "users.json")
    let fileUsers = []
    
    if (fs.existsSync(usersFile)) {
      const fileContent = fs.readFileSync(usersFile, 'utf8')
      const parsedUsers = JSON.parse(fileContent)
      fileUsers = parsedUsers.map((u: any) => ({
        userId: u.userId,
        role: u.role,
        name: u.name,
        createdAt: u.createdAt


}
      }))
    }

    const response = NextResponse.json({
      success: true,
      databaseUsers: recentUsers.rows,
      fileUsers: fileUsers,)
      message: "Registration test completed"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Registration test error:", error)
    const response = NextResponse.json({ 
      error: "Registration test failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
