import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    console.log("Debug admin session API called")
    
    const session = await getSession()
    console.log("Session:", session)
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: "No active session", 
        user: null,
        role: null
      }, { status: 200 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Active session found", 
      user: session,
      role: session.role,
      userId: session.userIdString,
      isAdmin: session.role === 'admin',
      isBuyer: session.role === 'buyer',
      isSupplier: session.role === 'supplier'
    }, { status: 200 })
    
  } catch (error) {
    console.error("Error in debug-admin-session:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error checking admin session", 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
