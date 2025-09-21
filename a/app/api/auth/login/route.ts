import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByCredentials, findUserByCredentialsAsync } from "@/lib/user-storage"
import { logResourceUsage } from "@/lib/resource-monitor"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    logResourceUsage("Login request start")
    
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
    console.log(`[AUTH] Calling findUserByCredentialsAsync for: ${normalizedUserId}, ${normalizedRole}`)
    const user = await findUserByCredentialsAsync(normalizedUserId, normalizedRole)

    if (!user) {
      console.log(`[AUTH] User not found: ${normalizedUserId} with role: ${normalizedRole}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log(`[AUTH] User found, verifying password for: ${user.userId}`)
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)

    if (!isValidPassword) {
      console.log(`[AUTH] Invalid password for user: ${normalizedUserId}`)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log(`[AUTH] Successful login for user: ${normalizedUserId}`)
    logResourceUsage("Login successful")

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

    // Add CORS headers
    return addCorsHeaders(response)
  } catch (error) {
    console.error("Login error:", error)
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    return addCorsHeaders(errorResponse)
  }
}
