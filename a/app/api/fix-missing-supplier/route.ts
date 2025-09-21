import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
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
    console.log("Fixing missing supplier record for user 111111...")

    // First, get user details from users table
    const userResult = await dbQuery(`
      SELECT user_id, role, name, email, mobile, created_at 
      FROM users 
      WHERE user_id = '111111'
    `)

    if (userResult.rows.length === 0) {
    }

    const user = userResult.rows[0]
    console.log("Found user:", user)

    // Check if supplier record already exists
    const existingSupplier = await dbQuery(`
      SELECT user_id FROM suppliers WHERE user_id = '111111'
    `)

    if (existingSupplier.rows.length > 0) {
      const response = NextResponse.json({ 
        message: "Supplier record already exists for user 111111",
        supplier: existingSupplier.rows[0]
    }

    // Create supplier record
    const supplierResult = await dbQuery(`
      INSERT INTO suppliers (
        user_id, 
        company_name, 
        contact_person,
        email,
        mobile,
        number_of_vehicles,
        is_verified,
        is_active,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      user.user_id,
      user.name || 'Default Company', // Use name as company name
      user.name, // Use name as contact person
      user.email,
      user.mobile,
      0, // Default number of vehicles
      false, // Not verified by default
      true, // Active by default
      user.created_at,
      new Date().toISOString()
    ])

    console.log("Created supplier record:", supplierResult.rows[0])

    const response = NextResponse.json({
      success: true,
      message: "Supplier record created successfully for user 111111",
      supplier: supplierResult.rows[0],
      user: user})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error creating supplier record:", error)
    const response = NextResponse.json({ 
      error: "Failed to create supplier record",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }