import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
  }
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const body = await request.json()
    const { currentPassword, newPassword, userId = "admin" } = body

    if (!currentPassword || !newPassword) {
    }

    console.log("Changing password for user:", userId)

    // Check if database is available
    if (!getPool()) {
    }

    // Verify current password
    const userResult = await dbQuery(
      "SELECT password_hash FROM users WHERE user_id = $1 AND role = 'admin'",
      [userId]
    )

    if (userResult.rows.length === 0) {
    }

    const currentPasswordHash = userResult.rows[0].password_hash
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentPasswordHash)

    if (!isCurrentPasswordValid) {
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    // Update password
    const updateResult = await dbQuery(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2 AND role = 'admin' RETURNING id",
      [newPasswordHash, userId]
    )

    if (updateResult.rows.length === 0) {
    }

    console.log("Password updated successfully for user:", userId)

    const response = NextResponse.json({
      message: "Password updated successfully",
      userId: userId})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Change password error:", error)
  }
}
