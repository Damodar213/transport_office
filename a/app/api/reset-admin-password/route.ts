import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    console.log("Resetting admin password...")
    
    // Check if database is available
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
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
      return NextResponse.json({ error: "Admin user not found in database" }, { status: 404 })
    }
    
    console.log("Admin password updated successfully")
    
    return NextResponse.json({
      message: "Admin password reset successfully",
      newPassword: newPassword,
      userId: "admin",
      role: "admin"
    })
    
  } catch (error) {
    console.error("Reset admin password error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}






