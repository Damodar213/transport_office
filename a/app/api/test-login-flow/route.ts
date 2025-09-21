import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import bcrypt from "bcryptjs"
import { findUserByCredentialsAsync } from "@/lib/user-storage"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const userId = "12233"
    const password = "12345"
    const role = "supplier"

    console.log("=== LOGIN FLOW TEST ===")
    console.log("Testing login for:", { userId, role, password: "***" })

    // Step 1: Find user
    console.log("Step 1: Finding user...")
    const user = await findUserByCredentialsAsync(userId, role)
    console.log("User found:", user ? "Yes" : "No")
    
    if (!user) {
      const response = NextResponse.json({
        success: false,
        step: "user_lookup",
        message: "User not found"
    }

    console.log("User details:", {
      id: user.id,
      userId: user.userId,
      role: user.role,
      name: user.name,
      passwordHash: user.passwordHash.substring(0, 20) + "..."
    })

    // Step 2: Verify password
    console.log("Step 2: Verifying password...")
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    console.log("Password valid:", isValidPassword)

    if (!isValidPassword) {
      const response = NextResponse.json({
        success: false,
        step: "password_verification",
        message: "Invalid password",
        userFound: true,
        passwordValid: false
    }

    // Step 3: Create session
    console.log("Step 3: Creating session...")
    const sessionData = {
      userId: user.id,
      userIdString: user.userId,
      role: user.role,
      email: user.email,
      name: user.name,
      companyName: user.companyName,
    }

    console.log("Session data:", sessionData)
    console.log("=== LOGIN FLOW COMPLETE ===")

    const response = NextResponse.json({
      success: true,
      step: "complete",
      message: "Login flow completed successfully",
      userFound: true,
      passwordValid: true,
      sessionData
  } catch (error) {
    console.error("Login flow test error:", error)
    const response = NextResponse.json({ 
      success: false,
      step: "error",
      error: "Login flow test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}


