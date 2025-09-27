import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("Test button click API called")
    
    const body = await request.json()
    console.log("Received data:", body)
    
    return NextResponse.json({
      success: true,
      message: "Button click test successful",
      receivedData: body,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("Error in test button click:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
