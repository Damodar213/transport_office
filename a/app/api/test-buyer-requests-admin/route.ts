import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("Test buyer requests admin API called")
    
    // Check session
    const session = await getSession()
    console.log("Session:", session)
    
    if (!session) {
      return NextResponse.json({ 
        success: false, 
        message: "No active session", 
        error: "Authentication required" 
      }, { status: 401 })
    }
    
    console.log("Session role:", session.role)
    console.log("Is admin:", session.role === 'admin')
    console.log("Is buyer:", session.role === 'buyer')
    
    // Check if role is allowed
    if (session.role !== 'buyer' && session.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        message: "Access denied", 
        error: "Access denied - buyer or admin role required",
        currentRole: session.role
      }, { status: 403 })
    }
    
    // Check database
    if (!getPool()) {
      return NextResponse.json({ 
        success: false, 
        message: "Database not available", 
        error: "Database not available" 
      }, { status: 500 })
    }
    
    // Try to fetch buyer requests
    const result = await dbQuery(`
      SELECT 
        br.*,
        b.company_name as buyer_company,
        u.name as buyer_name,
        u.email as buyer_email,
        u.mobile as buyer_mobile
      FROM buyer_requests br
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      WHERE br.status != 'draft'
      ORDER BY br.created_at DESC
      LIMIT 10
    `)
    
    console.log("Buyer requests found:", result.rows.length)
    
    return NextResponse.json({ 
      success: true, 
      message: "Test successful", 
      data: result.rows,
      count: result.rows.length,
      session: {
        role: session.role,
        userId: session.userIdString
      }
    })
    
  } catch (error) {
    console.error("Error in test buyer requests admin:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error in test", 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}
