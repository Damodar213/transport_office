import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check if user 12233 exists in database
    const userResult = await dbQuery("SELECT user_id, role, email, name FROM users WHERE user_id = $1",
      ["12233"])
    )

    // Check if user 12233 exists in suppliers table
    const supplierResult = await dbQuery("SELECT user_id, company_name FROM suppliers WHERE user_id = $1",
      ["12233"])
    )

    const response = NextResponse.json({
      success: true,
      userInDatabase: userResult.rows.length > 0,
      userData: userResult.rows[0] || null,
      supplierInDatabase: supplierResult.rows.length > 0,
      supplierData: supplierResult.rows[0] || null,)
      message: "User 12233 check completed"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("User check error:", error)
    const response = NextResponse.json({ 
      error: "User check failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
