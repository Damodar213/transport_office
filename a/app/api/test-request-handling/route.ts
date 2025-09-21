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
    console.log("=== TESTING REQUEST HANDLING ===")
    
    console.log("Request method:", request.method)
    console.log("Request URL:", request.url)
    console.log("Request headers:", Object.fromEntries(request.headers.entries())
    // Try to get the request body as text first
    console.log("Attempting to get request body as text...")
    const textBody = await request.text()
    console.log("Request body as text:", textBody)
    
    // Try to get the request body as JSON
    console.log("Attempting to parse as JSON...")
    try {
      const jsonBody = JSON.parse(textBody)
      console.log("Request body as JSON:", jsonBody)
    } catch (e) {
      console.log("Failed to parse as JSON:", e)
    }

    const response = NextResponse.json({
      success: true,
      message: "Request handling test completed successfully",
      requestInfo: {


}
        method: request.method,
        url: request.url,
        hasBody: !!textBody,
        bodyLength: textBody.length


})
      })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("=== REQUEST HANDLING ERROR ===", error)
    const response = NextResponse.json({ 
      error: "Request handling test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined


})
  })
    return addCorsHeaders(response)
  }
