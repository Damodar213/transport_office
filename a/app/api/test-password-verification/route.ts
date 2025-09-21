import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findUserByCredentialsAsync } from "@/lib/user-storage"

export async function POST() {
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
      
      return NextResponse.json({
        success: true,
        userFound: true,
        userId: user.userId,
        role: user.role,
        passwordHash: user.passwordHash,
        passwordValid: isValidPassword,
        message: "Password verification test completed"
      })
    } else {
      return NextResponse.json({
        success: true,
        userFound: false,
        message: "User not found"
      })
    }

  } catch (error) {
    console.error("Password verification test error:", error)
    return NextResponse.json({ 
      error: "Password verification test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


