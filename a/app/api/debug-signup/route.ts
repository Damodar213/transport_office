import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== DEBUG SIGNUP START ===")
    
    // Test basic functionality
    const formData = await request.formData()
    console.log("FormData received")
    
    const role = formData.get("role") as string
    const userId = formData.get("userId") as string
    const password = formData.get("password") as string
    
    console.log("Basic fields extracted:", { role, userId, hasPassword: !!password })
    
    // Test imports one by one
    console.log("Testing imports...")
    
    try {
      const bcrypt = await import("bcryptjs")
      console.log("✓ bcryptjs imported")
    } catch (e) {
      console.error("✗ bcryptjs import failed:", e)
      return NextResponse.json({ error: "bcryptjs import failed" }, { status: 500 })
    }
    
    try {
      const userStorage = await import("@/lib/user-storage")
      console.log("✓ user-storage imported")
    } catch (e) {
      console.error("✗ user-storage import failed:", e)
      return NextResponse.json({ error: "user-storage import failed" }, { status: 500 })
    }
    
    try {
      const cloudflare = await import("@/lib/cloudflare-r2")
      console.log("✓ cloudflare-r2 imported")
    } catch (e) {
      console.error("✗ cloudflare-r2 import failed:", e)
      return NextResponse.json({ error: "cloudflare-r2 import failed" }, { status: 500 })
    }
    
    console.log("=== DEBUG SIGNUP SUCCESS ===")
    
    return NextResponse.json({
      success: true,
      message: "Debug signup completed successfully",
      formData: {
        role,
        userId,
        hasPassword: !!password
      }
    })
    
  } catch (error) {
    console.error("=== DEBUG SIGNUP ERROR ===", error)
    return NextResponse.json({ 
      error: "Debug signup failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}


