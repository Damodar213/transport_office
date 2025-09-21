import { NextResponse } from "next/server"
import { findUserByCredentialsAsync } from "@/lib/user-storage"

export async function GET() {
  try {
    console.log("Testing authentication fix...")

    // Test with the problematic user
    const user = await findUserByCredentialsAsync("12233", "supplier")
    
    return NextResponse.json({
      success: true,
      userFound: user ? true : false,
      message: user ? "SECURITY ISSUE: User still found!" : "SECURITY FIXED: User not found",
      user: user ? { id: user.id, userId: user.userId, role: user.role } : null
    })

  } catch (error) {
    console.error("Auth fix test error:", error)
    return NextResponse.json({ 
      error: "Auth fix test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


