import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("=== MINIMAL SIGNUP TEST ===")
    
    return NextResponse.json({
      success: true,
      message: "Minimal signup test completed successfully"
    })

  } catch (error) {
    console.error("Minimal signup test error:", error)
    return NextResponse.json({ 
      error: "Minimal signup test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


