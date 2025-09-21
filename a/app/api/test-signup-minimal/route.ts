import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
  }
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("=== MINIMAL SIGNUP TEST ===")
    
    const response = NextResponse.json({
      success: true,
      message: "Minimal signup test completed successfully"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Minimal signup test error:", error)
    const response = NextResponse.json({ 
      error: "Minimal signup test failed",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }