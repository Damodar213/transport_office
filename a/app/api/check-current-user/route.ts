import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    console.log("Check current user API called")
    
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: "No session found",
        message: "User is not logged in"
      })
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: session.userIdString,
        role: session.role,
        email: session.email,
        name: session.name,
        companyName: session.companyName
      },
      message: `Current user: ${session.userIdString} with role: ${session.role}`,
      shouldAccessSupplierDashboard: session.role === 'supplier',
      shouldAccessAdminDashboard: session.role === 'admin',
      shouldAccessBuyerDashboard: session.role === 'buyer'
    })

  } catch (error) {
    console.error("Error checking current user:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
