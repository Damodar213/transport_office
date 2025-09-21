import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import bcrypt from "bcryptjs"
import { findUserByCredentialsAsync } from "@/lib/user-storage"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
  }
export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const userId = "12233"
    const password = "12345"
    const role = "supplier"

    console.log("Testing password verification for user:", userId)

    // Get user from storage
    const user = await findUserByCredentialsAsync(userId, role)
    console.log("User found:", user ? "Yes" : "No")
    
    if (user) {
      console.log("User password hash:", user.passwordHash)
      console.log("Testing password:", password)
      
      // Test password verification
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)
      console.log("Password valid:", isValidPassword)
      
      const response = NextResponse.json({
        success: true,
        userFound: true,
        userId: user.userId,
        role: user.role,
        passwordHash: user.passwordHash,
        passwordValid: isValidPassword,
        message: "Password verification test completed"
    } else {
      const response = NextResponse.json({
        success: true,
        userFound: false,
        message: "User not found"
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Password verification test error:", error)
    const response = NextResponse.json({ 
      error: "Password verification test failed",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }