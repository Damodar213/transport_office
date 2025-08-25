import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByCredentials, findUserByCredentialsAsync } from "@/lib/user-storage"

export async function POST(request: NextRequest) {
  try {
    console.log("Debug login started")
    
    const body = await request.json()
    console.log("Request body:", body)
    
    const { userId, password, role } = body

    const normalizedUserId = String(userId || "").trim()
    const normalizedRole = String(role || "").trim().toLowerCase()

    console.log("Normalized values:", { normalizedUserId, normalizedRole, password: password ? "***" : "missing" })

    if (!normalizedUserId || !password || !normalizedRole) {
      console.log("Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Looking for user with credentials...")
    
    // Use async version that can query database if available
    const user = await findUserByCredentialsAsync(normalizedUserId, normalizedRole)
    console.log("User found:", user ? { id: user.id, userId: user.userId, role: user.role } : null)

    if (!user) {
      console.log("No user found")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Verifying password...")
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    console.log("Password valid:", isValidPassword)

    if (!isValidPassword) {
      console.log("Invalid password")
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Password verified, creating session...")

    // Create session (simplified - use proper JWT or session management in production)
    const sessionData = {
      userId: user.id,
      userIdString: user.userId,
      role: user.role,
      email: user.email,
      name: user.name,
      companyName: user.companyName,
    }

    console.log("Session data:", sessionData)

    const response = NextResponse.json({ message: "Login successful", user: sessionData }, { status: 200 })

    // Set session cookie
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log("Login successful, returning response")
    return response
  } catch (error) {
    console.error("Debug login error:", error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}


