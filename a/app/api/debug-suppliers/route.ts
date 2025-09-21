import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    console.log("Checking suppliers in database...")

    // Get all suppliers
    const suppliersResult = await dbQuery(`
      SELECT s.user_id, s.company_name, s.gst_number, s.number_of_vehicles, s.created_at,
             u.name, u.email, u.mobile
      FROM suppliers s
      LEFT JOIN users u ON s.user_id = u.user_id
      ORDER BY s.created_at DESC
    `)

    // Get all users with supplier role
    const usersResult = await dbQuery(`
      SELECT user_id, name, email, mobile, created_at
      FROM users 
      WHERE role = 'supplier'
      ORDER BY created_at DESC
    `)

    console.log(`Found ${suppliersResult.rows.length} suppliers and ${usersResult.rows.length} supplier users`)

    return NextResponse.json({
      success: true,
      suppliers: suppliersResult.rows,
      supplierUsers: usersResult.rows,
      totalSuppliers: suppliersResult.rows.length,
      totalSupplierUsers: usersResult.rows.length
    })

  } catch (error) {
    console.error("Error checking suppliers:", error)
    return NextResponse.json({ 
      error: "Failed to check suppliers",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


