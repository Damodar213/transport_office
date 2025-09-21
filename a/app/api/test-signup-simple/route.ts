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
    console.log("=== SIMPLE SIGNUP TEST ===")
    
    const formData = await request.formData()
    console.log("FormData parsed successfully")

    const role = formData.get("role") as string
    const userId = formData.get("userId") as string
    const password = formData.get("password") as string

    console.log("Form fields extracted:", { role, userId, password: password ? "***" : "missing" })

    if (!userId || !password || !role) {
      console.log("Missing required fields")
      const response = NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    return addCorsHeaders(response)
    }

    // Test Cloudflare import
    try {
      const { uploadToR2, generateFileKey } = await import("@/lib/cloudflare-r2")
      console.log("Cloudflare imports successful")
    } catch (importError) {
      console.error("Cloudflare import error:", importError)
      const response = NextResponse.json({ 
        error: "Cloudflare import failed",
        details: importError instanceof Error ? importError.message : "Unknown error"
      }, { status: 500 })
    return addCorsHeaders(response)
    }

    // Test user storage import
    try {
      const { createUserAsync } = await import("@/lib/user-storage")
      console.log("User storage imports successful")
    } catch (importError) {
      console.error("User storage import error:", importError)
      const response = NextResponse.json({ 
        error: "User storage import failed",
        details: importError instanceof Error ? importError.message : "Unknown error"
      }, { status: 500 })
    return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      success: true,
      message: "Simple signup test completed successfully",
      formData: {
        role,
        userId,
        hasPassword: !!password
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Simple signup test error:", error)
    const response = NextResponse.json({ 
      error: "Simple signup test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}


