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
    }
    
    console.log("Admin password updated successfully")
    
    const response = NextResponse.json({
      message: "Admin password reset successfully",
      newPassword: newPassword,
      userId: "admin",
      role: "admin"
  } catch (error) {
    console.error("Reset admin password error:", error)
  }
}






