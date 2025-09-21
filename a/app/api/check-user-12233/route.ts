import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {})
    return addCorsHeaders(response)
  }
    console.log("Checking if user 12233 exists...")

    // Check if user 12233 exists
    const userResult = await dbQuery(`
      SELECT user_id, role, name, email, mobile, created_at 
      FROM users 
      WHERE user_id = '12233'
    `)

    // Check if supplier 12233 exists
    const supplierResult = await dbQuery(`
      SELECT user_id, company_name, gst_number 
      FROM suppliers 
      WHERE user_id = '12233'
    `)

    console.log(`User 12233 exists: ${userResult.rows.length > 0}`)
    console.log(`Supplier 12233 exists: ${supplierResult.rows.length > 0}`)

    const response = NextResponse.json({
      success: true,
      userExists: userResult.rows.length > 0,
      supplierExists: supplierResult.rows.length > 0,
      userData: userResult.rows[0] || null,
      supplierData: supplierResult.rows[0] || null})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error checking user 12233:", error)
    const response = NextResponse.json({ 
      error: "Failed to check user 12233",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }