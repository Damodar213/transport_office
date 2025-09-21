import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getSession } from "@/lib/auth"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== BUYER REQUESTS API TEST ===")
    
    // Test 1: Check if user is authenticated
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({
        success: false,
        test: "authentication",
        message: "No active session - user needs to log in",
        recommendation: "Log in with valid credentials first"})
    return addCorsHeaders(response)
  }

    console.log("User session:", {
      userId: session.userId,
      userIdString: session.userIdString,
      role: session.role
  }
    })

    // Test 2: Check if user has appropriate role
    if (session.role !== 'buyer' && session.role !== 'admin') {
      const response = NextResponse.json({
        success: false,
        test: "role_check",
        message: "User does not have buyer or admin role",
        userRole: session.role,
        recommendation: "Log in as a buyer or admin to test buyer requests functionality"
  }
    // Test 3: Check buyer_requests table structure
    const tableStructure = await dbQuery(`
  }
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'buyer_requests' 
      ORDER BY ordinal_position
    `)

    console.log("Buyer requests table structure:")
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    // Test 4: Check existing buyer requests
    let query = `
      SELECT 
  }
        br.id, br.buyer_id, br.order_number, br.status, br.created_at,
        b.company_name as buyer_company,
        u.name as buyer_name
      FROM buyer_requests br
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN users u ON br.buyer_id = u.user_id
    `
    let params: any[] = []

    // Filter by buyer_id only if user is a buyer (not admin)
    if (session.role === 'buyer') {
      query += ` WHERE br.buyer_id = $1`
      params.push(session.userIdString)
    }

    query += ` ORDER BY br.created_at DESC LIMIT 10`

    const buyerRequests = await dbQuery(query, params)
    console.log(`Found ${buyerRequests.rows.length} buyer requests`)

    // Test 5: Check buyers table
    const buyers = await dbQuery(
  }
      "SELECT user_id, company_name, gst_number FROM buyers ORDER BY created_at DESC LIMIT 5"
    )

    console.log(`Found ${buyers.rows.length} buyers in database`)

    const response = NextResponse.json({
      success: true,
      test: "buyer_requests_api",
      message: "Buyer requests API test completed",
      currentUser: {
  }
        userId: session.userId,
        userIdString: session.userIdString,
        role: session.role,
        email: session.email,
        name: session.name
  }
      },
      tableStructure: tableStructure.rows,
      buyerRequests: {
  }
        count: buyerRequests.rows.length,
        requests: buyerRequests.rows
  }
      },
      buyers: {
  }
        count: buyers.rows.length,
        data: buyers.rows
  }
      },
      apiStatus: "Buyer requests API is working correctly"
  }
  } catch (error) {
    console.error("Buyer requests API test error:", error)
    const response = NextResponse.json({
      success: false,
      test: "error",
      message: "Test failed with error",
      error: error instanceof Error ? error.message : "Unknown error"
  }
  })
    return addCorsHeaders(response)
  }
