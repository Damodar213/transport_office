import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Admin buyers API called")
    
    if (!getPool()) {
      console.log("Database not available")
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
    }

    // Get all buyers
    const buyersResult = await dbQuery(`
      SELECT 
        u.user_id,
        u.name,
        u.email,
        u.mobile,
        u.created_at,
        b.company_name
      FROM users u
      LEFT JOIN buyers b ON u.user_id = b.user_id
      WHERE u.role = 'buyer'
      ORDER BY u.user_id ASC
    `)

    // Process the buyers to handle null values
    const buyers = buyersResult.rows.map(buyer => ({
      user_id: buyer.user_id,
      name: buyer.name || buyer.user_id,
      email: buyer.email || 'No email',
      phone: buyer.mobile || 'No phone',
      company_name: buyer.company_name || buyer.name || buyer.user_id,
      created_at: buyer.created_at
    }))

    console.log("Found buyers:", buyers.length)

    const response = NextResponse.json({
      success: true,
      buyers: buyers
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error fetching buyers:", error)
    const response = NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" },
      { status: 500 }
    )
    return addCorsHeaders(response)
  }
}
