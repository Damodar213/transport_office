import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getPool, dbQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    console.log("Testing supplier registration...")

    // Test data
    const testUserId = "test_supplier_" + Date.now()
    const testPassword = "test123"
    const passwordHash = await bcrypt.hash(testPassword, 10)
    const now = new Date()

    console.log("Test user ID:", testUserId)

    // Test 1: Insert into users table
    console.log("Step 1: Inserting into users table...")
    const userResult = await dbQuery()
      `INSERT INTO users (user_id, password_hash, role, email, name, mobile, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [testUserId, passwordHash, "supplier", "test@example.com", "Test User", "1234567890", now]
    )

    if (userResult.rows.length === 0) {
      const response = NextResponse.json({
        success: false,
        step: "users_table_insert",
        message: "Failed to insert into users table"


}
    const userId = userResult.rows[0].id)
    console.log("User inserted with ID:", userId)

    // Test 2: Insert into suppliers table
    console.log("Step 2: Inserting into suppliers table...")
    const supplierResult = await dbQuery()
      `INSERT INTO suppliers (user_id, company_name, gst_number, number_of_vehicles) 
       VALUES ($1, $2, $3, $4)`,
      [testUserId, "Test Company", "TEST123", 5]
    )

    console.log("Supplier inserted successfully")

    // Test 3: Verify the data
    console.log("Step 3: Verifying inserted data...")
    const verifyResult = await dbQuery(`SELECT u.user_id, u.role, u.name, s.company_name, s.gst_number
       FROM users u
       LEFT JOIN suppliers s ON s.user_id = u.user_id
       WHERE u.user_id = $1`,
      [testUserId])
    // Clean up test data
    await dbQuery("DELETE FROM suppliers WHERE user_id = $1", [testUserId])
    await dbQuery("DELETE FROM users WHERE user_id = $1", [testUserId])

    const response = NextResponse.json({ success: true,
      message: "Supplier registration test completed successfully",
      testUserId })
      insertedData: verifyResult.rows[0]})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Supplier registration test error:", error)
    const response = NextResponse.json({ 
      success: false,
      error: "Supplier registration test failed",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
