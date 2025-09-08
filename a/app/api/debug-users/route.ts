import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    console.log("Checking users in database...")

    // Get all users
    const usersResult = await dbQuery(`
      SELECT user_id, role, name, email, mobile, created_at 
      FROM users 
      ORDER BY created_at DESC
    `)

    // Get all suppliers
    const suppliersResult = await dbQuery(`
      SELECT user_id, company_name, gst_number, number_of_vehicles 
      FROM suppliers 
      ORDER BY created_at DESC
    `)

    console.log(`Found ${usersResult.rows.length} users and ${suppliersResult.rows.length} suppliers`)

    return NextResponse.json({
      success: true,
      users: usersResult.rows,
      suppliers: suppliersResult.rows,
      totalUsers: usersResult.rows.length,
      totalSuppliers: suppliersResult.rows.length
    })

  } catch (error) {
    console.error("Error checking users:", error)
    return NextResponse.json({ 
      error: "Failed to check users",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


