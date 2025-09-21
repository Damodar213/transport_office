import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { findUserByCredentialsAsync } from "@/lib/user-storage"

export async function GET() {
  try {
    console.log("Testing authentication fix...")

    // Test with the problematic user
    const user = await findUserByCredentialsAsync("12233", "supplier")
    
    const response = NextResponse.json({
      success: true,
      userFound: user ? true : false,
      message: user ? "SECURITY ISSUE: User still found!" : "SECURITY FIXED: User not found",
      user: user ? { id: user.id, userId: user.userId, role: user.role } : null
    })

  } catch (error) {
    console.error("Auth fix test error:", error)
    const response = NextResponse.json({ 
      error: "Auth fix test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


