import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Creating user 111111 and supplier record...")

    // Check if user already exists
    const existingUser = await dbQuery(`
      SELECT user_id FROM users WHERE user_id = '111111'
    `)

    if (existingUser.rows.length > 0) {
      console.log("User 111111 already exists in users table")
    } else {
      // Create user record
      const passwordHash = await bcrypt.hash("12345", 10)
      const now = new Date().toISOString()
      
      await dbQuery(`
        INSERT INTO users (
          user_id, 
          password_hash, 
          role, 
          email, 
          name, 
          mobile, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        '111111',
        passwordHash,
        'supplier',
        'contact@abcd.com',
        'Contact Person',
        '+919876543210',
        now,
        now
      ])
      
      console.log("Created user 111111 in users table")
    }

    // Check if supplier already exists
    const existingSupplier = await dbQuery(`
      SELECT user_id FROM suppliers WHERE user_id = '111111'
    `)

    if (existingSupplier.rows.length > 0) {
      console.log("Supplier 111111 already exists in suppliers table")
    } else {
      // Create supplier record
      const now = new Date().toISOString()
      
      await dbQuery(`
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
      `, [
        '111111',
        'abcd',
        'Contact Person',
        'contact@abcd.com',
        '+919876543210',
        0,
        false,
        true,
        now,
        now
      ])
      
      console.log("Created supplier 111111 in suppliers table")
    }

    // Verify both records exist
    const userResult = await dbQuery(`
      SELECT user_id, role, name, email, mobile FROM users WHERE user_id = '111111'
    `)

    const supplierResult = await dbQuery(`
      SELECT user_id, company_name, contact_person, number_of_vehicles FROM suppliers WHERE user_id = '111111'
    `)

    const response = NextResponse.json({
      success: true,
      message: "User 111111 and supplier record created successfully",
      user: userResult.rows[0],
      supplier: supplierResult.rows[0]})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error creating user and supplier:", error)
    const response = NextResponse.json({ 
      error: "Failed to create user and supplier",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }
