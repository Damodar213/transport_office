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
    console.log("=== TESTING FORMDATA ===")
    
    console.log("Attempting to parse form data...")
    const formData = await request.formData()
    console.log("Form data parsed successfully")
    
    const role = formData.get("role") as string
    const userId = formData.get("userId") as string
    const password = formData.get("password") as string
    
    console.log("Form fields extracted:", { role, userId, hasPassword: !!password })
    
    const response = NextResponse.json({
      success: true,
      message: "Form data test completed successfully",
      formData: {
        role,
        userId,
        hasPassword: !!password
      })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("=== FORMDATA TEST ERROR ===", error)
    const response = NextResponse.json({ 
      error: "Form data test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
  })
    return addCorsHeaders(response)
  }