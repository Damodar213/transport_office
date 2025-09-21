import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findAdminByCredentials } from "@/lib/admin-storage"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse

  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      const errorResponse = NextResponse.json({ error: "Missing userId or password" }, { status: 400 })
      return addCorsHeaders(errorResponse)
    }

    // Find admin by userId
    const admin = await findAdminByCredentials(userId)
    if (!admin) {
      const errorResponse = NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
      return addCorsHeaders(errorResponse)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash)
    if (!isValidPassword) {
      const errorResponse = NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
      return addCorsHeaders(errorResponse)
    }

    // Return admin info (without password)
    const { passwordHash, ...adminInfo } = admin
    
    // Create session data
    const sessionData = {
      userId: admin.id,
      userIdString: admin.userId,
      role: admin.role,
      email: admin.email,
      name: admin.name,
      companyName: admin.name, // Use name as company name for admin
    }

    const response = NextResponse.json({
      message: "Admin login successful",
      admin: adminInfo
    })

    // Set session cookie
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // Ensure cookie is available for all paths
    })

    // Add CORS headers

  } catch (error) {
    console.error("Admin login error:", error)
    const errorResponse = NextResponse.json({ error: "Internal server error" }, { status: 500 })
    return addCorsHeaders(errorResponse)
  }
}










