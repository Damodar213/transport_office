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
    console.log("=== TESTING SIGNUP IMPORTS ===")
    
    // Test each import one by one
    try {
      const bcrypt = await import("bcryptjs")
      console.log("bcryptjs import successful")
    } catch (error) {
      console.error("bcryptjs import error:", error)
      const response = NextResponse.json({ error: "bcryptjs import failed" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    try {
      const userStorage = await import("@/lib/user-storage")
      console.log("user-storage import successful")
    } catch (error) {
      console.error("user-storage import error:", error)
      const response = NextResponse.json({ error: "user-storage import failed" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    try {
      const documentStorage = await import("@/lib/document-storage")
      console.log("document-storage import successful")
    } catch (error) {
      console.error("document-storage import error:", error)
      const response = NextResponse.json({ error: "document-storage import failed" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    try {
      const adminStorage = await import("@/lib/admin-storage")
      console.log("admin-storage import successful")
    } catch (error) {
      console.error("admin-storage import error:", error)
      const response = NextResponse.json({ error: "admin-storage import failed" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    try {
      const db = await import("@/lib/db")
      console.log("db import successful")
    } catch (error) {
      console.error("db import error:", error)
      const response = NextResponse.json({ error: "db import failed" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    try {
      const cloudflare = await import("@/lib/cloudflare-r2")
      console.log("cloudflare-r2 import successful")
    } catch (error) {
      console.error("cloudflare-r2 import error:", error)
      const response = NextResponse.json({ error: "cloudflare-r2 import failed" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      success: true,
      message: "All imports successful"
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Import test error:", error)
    const response = NextResponse.json({ 
      error: "Import test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}


