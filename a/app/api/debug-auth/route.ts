import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug auth API called")
    
    // Get the current session
    const session = await getSession()
    
    console.log("Current session:", session)
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No session found",
        session: null
      })
    }
    
    return NextResponse.json({
      success: true,
      session: {
        userId: session.userId,
        userIdString: session.userIdString,
        role: session.role,
        email: session.email,
        name: session.name,
        companyName: session.companyName
      },
      message: `Current user: ${session.userIdString} with role: ${session.role}`
    })

  } catch (error) {
    console.error("Error debugging auth:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

