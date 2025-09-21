import { type NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPassword, newPassword, userId = "admin" } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    console.log("Changing password for user:", userId)

    // Check if database is available
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify current password
    const userResult = await dbQuery(
      "SELECT password_hash FROM users WHERE user_id = $1 AND role = 'admin'",
      [userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Admin user not found" }, { status: 404 })
    }

    const currentPasswordHash = userResult.rows[0].password_hash
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash)

    if (!isCurrentPasswordValid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const updateResult = await dbQuery(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2 AND role = 'admin' RETURNING id",
      [newPasswordHash, userId]
    )

    if (updateResult.rows.length === 0) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    console.log("Password updated successfully for user:", userId)

    return NextResponse.json({
      message: "Password updated successfully",
      userId: userId
    })

  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
