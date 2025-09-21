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
      console.log("Import successful")
} catch (error) {
      console.error("bcryptjs import error:", error)
    }

    try {
      const userStorage = await import("@/lib/user-storage")
      console.log("Import successful")
    } catch (error) {
      console.error("user-storage import error:", error)
    }

    try {
      const documentStorage = await import("@/lib/document-storage")
      console.log("Import successful")
    } catch (error) {
      console.error("document-storage import error:", error)
    }

    try {
      const adminStorage = await import("@/lib/admin-storage")
      console.log("Import successful")
    } catch (error) {
      console.error("admin-storage import error:", error)
    }

    try {
      const db = await import("@/lib/db")
      console.log("Import successful")
    } catch (error) {
      console.error("db import error:", error)
    }

    try {
      const cloudflare = await import("@/lib/cloudflare-r2")
      console.log("Import successful")
    } catch (error) {
      console.error("cloudflare-r2 import error:", error)
    }

    const response = NextResponse.json({ success: true })
      message: "All imports successful"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Import test error:", error)
    const response = NextResponse.json({ 
      error: "Import test failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
