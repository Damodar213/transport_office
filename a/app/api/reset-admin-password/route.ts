import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Resetting admin password...")
    
    // Check if database is available
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
    }
    
    // Generate new password hash for "admin123"
    const newPassword = "admin123"
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    
    console.log("Updating admin password in database...")
    
    // Update the admin user's password
    const result = await dbQuery(
      `UPDATE users SET password_hash = $1 WHERE user_id = 'admin' AND role = 'admin' RETURNING id`,
      [newPasswordHash]
    )
    
    if (result.rows.length === 0) {
      const response = NextResponse.json({ error: "Admin user not found in database" }, { status: 404 })
    return addCorsHeaders(response)
    }
    
    console.log("Admin password updated successfully")
    
    const response = NextResponse.json({
      message: "Admin password reset successfully",
      newPassword: newPassword,
      userId: "admin",
      role: "admin"
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Reset admin password error:", error)
    const response = NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
    return addCorsHeaders(response)
  }
}






