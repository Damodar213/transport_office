import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


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
    }

    try {
      const userStorage = await import("@/lib/user-storage")
      console.log("✓ user-storage imported")
    } catch (e) {
      console.error("✗ user-storage import failed:", e)
    }

    try {
      const cloudflare = await import("@/lib/cloudflare-r2")
      console.log("✓ cloudflare-r2 imported")
    } catch (e) {
      console.error("✗ cloudflare-r2 import failed:", e)
    }

    console.log("=== DEBUG SIGNUP SUCCESS ===")
    
    const response = NextResponse.json({
      success: true,
      message: "Debug signup completed successfully",
      formData: {


}
        role,
        userId,
        hasPassword: !!password


})
      })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("=== DEBUG SIGNUP ERROR ===", error)
    const response = NextResponse.json({ 
      error: "Debug signup failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined


})
  })
    return addCorsHeaders(response)
  }
