import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByCredentials, findUserByCredentialsAsync } from "@/lib/user-storage"

export async function POST(request: NextRequest) {
  try {
    const { userId, password, role } = await request.json()

    const normalizedUserId = String(userId || "").trim()
    const normalizedRole = String(role || "").trim().toLowerCase()

    // Security logging
    console.log(`[AUTH] Login attempt for user: ${normalizedUserId}, role: ${normalizedRole}`)

    if (!normalizedUserId || !password || !normalizedRole) {
      console.log(`[AUTH] Missing required fields for user: ${normalizedUserId}`)
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use async version that can query database if available
    const user = await findUserByCredentialsAsync(normalizedUserId, normalizedRole)

    if (!user) {
      console.log(`[AUTH] User not found: ${normalizedUserId}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      console.log(`[AUTH] Invalid password for user: ${normalizedUserId}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log(`[AUTH] Successful login for user: ${normalizedUserId}`)

    // Create session (simplified - use proper JWT or session management in production)
    const sessionData = {
      userId: user.id,
      userIdString: user.userId,
      role: user.role,
      email: user.email,
      name: user.name,
      companyName: user.companyName,
    }

    const response = NextResponse.json({ message: "Login successful", user: sessionData }, { status: 200 })

    // Set session cookie
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
