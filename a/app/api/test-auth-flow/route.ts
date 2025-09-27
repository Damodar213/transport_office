import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Test auth flow API called")
    
    // Get the current session
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No session found",
        message: "User is not authenticated"
      })
    }
    
    const userRole = session.role
    const userId = session.userIdString
    
    // Determine which dashboard the user should access
    let correctDashboard = ""
    let shouldRedirect = false
    
    switch (userRole) {
      case 'admin':
        correctDashboard = "/admin/dashboard"
        break
      case 'supplier':
        correctDashboard = "/supplier/dashboard"
        break
      case 'buyer':
        correctDashboard = "/buyer/dashboard"
        break
      default:
        correctDashboard = "/login"
        shouldRedirect = true
    }
    
    return NextResponse.json({
      success: true,
      session: {
        userId: userId,
        role: userRole,
        email: session.email,
        name: session.name
      },
      correctDashboard: correctDashboard,
      shouldRedirect: shouldRedirect,
      message: `User ${userId} with role ${userRole} should access ${correctDashboard}`
    })

  } catch (error) {
    console.error("Error testing auth flow:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

