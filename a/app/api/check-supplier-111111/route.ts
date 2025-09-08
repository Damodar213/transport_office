import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    console.log("Checking supplier 111111...")

    // Check if user 111111 exists in users table
    const userResult = await dbQuery(`
      SELECT user_id, role, name, email, mobile, created_at 
      FROM users 
      WHERE user_id = '111111'
    `)

    // Check if supplier 111111 exists in suppliers table
    const supplierResult = await dbQuery(`
      SELECT user_id, company_name, gst_number, number_of_vehicles, created_at
      FROM suppliers 
      WHERE user_id = '111111'
    `)

    console.log(`User 111111 exists: ${userResult.rows.length > 0}`)
    console.log(`Supplier 111111 exists: ${supplierResult.rows.length > 0}`)

    return NextResponse.json({
      success: true,
      userExists: userResult.rows.length > 0,
      supplierExists: supplierResult.rows.length > 0,
      userData: userResult.rows[0] || null,
      supplierData: supplierResult.rows[0] || null
    })

  } catch (error) {
    console.error("Error checking supplier 111111:", error)
    return NextResponse.json({ 
      error: "Failed to check supplier 111111",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


