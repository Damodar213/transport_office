import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== BUYER AUTHENTICATION TEST ===")
    
    // Test 1: Check if user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({
        success: false,
        test: "authentication",
        message: "No active session - user needs to log in",
        recommendation: "Log in with valid buyer credentials first"
      })
    }

    console.log("User session:", {
      userId: session.userId,
      userIdString: session.userIdString,
      role: session.role
    })

    // Test 2: Check if user is a buyer
    if (session.role !== 'buyer') {
      return NextResponse.json({
        success: false,
        test: "role_check",
        message: "User is not a buyer",
        userRole: session.role,
        recommendation: "Log in as a buyer to test buyer functionality"
      })
    }

    // Test 3: Check buyer data in database
    const buyerData = await dbQuery(
      "SELECT user_id, company_name, gst_number FROM buyers WHERE user_id = $1",
      [session.userIdString]
    )

    console.log(`Buyer data found: ${buyerData.rows.length > 0 ? 'Yes' : 'No'}`)

    // Test 4: Check buyer requests
    const buyerRequests = await dbQuery(
      "SELECT id, status, created_at FROM buyer_requests WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT 5",
      [session.userIdString]
    )

    console.log(`Found ${buyerRequests.rows.length} buyer requests`)

    // Test 5: Check user data in users table
    const userData = await dbQuery(
      "SELECT user_id, role, email, name FROM users WHERE user_id = $1",
      [session.userIdString]
    )

    console.log("User data:", userData.rows[0] || "Not found")

    return NextResponse.json({
      success: true,
      test: "buyer_authentication",
      message: "Buyer authentication test completed",
      currentUser: {
        userId: session.userId,
        userIdString: session.userIdString,
        role: session.role,
        email: session.email,
        name: session.name
      },
      buyerData: {
        exists: buyerData.rows.length > 0,
        data: buyerData.rows[0] || null
      },
      buyerRequests: {
        count: buyerRequests.rows.length,
        recentRequests: buyerRequests.rows
      },
      userData: userData.rows[0] || null,
      authStatus: "Buyer authentication is working correctly"
    })

  } catch (error) {
    console.error("Buyer authentication test error:", error)
    return NextResponse.json({
      success: false,
      test: "error",
      message: "Test failed with error",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

