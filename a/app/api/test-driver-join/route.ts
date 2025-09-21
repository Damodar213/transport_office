import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
    }

    // Test the JOIN step by step
    const driverDocs = await dbQuery(`
      SELECT dd.supplier_id, dd.driver_name
      FROM driver_documents dd
      LIMIT 3
    `)

    const users = await dbQuery(`
      SELECT u.user_id, u.name, u.company_name
      FROM users u
      WHERE u.role = 'supplier'
      LIMIT 3
    `)

    // Test the JOIN
    const joinTest = await dbQuery(`
      SELECT 
        dd.supplier_id,
        dd.driver_name,
        u.name as supplier_name,
        u.company_name
      FROM driver_documents dd
      LEFT JOIN users u ON dd.supplier_id = u.user_id
      LIMIT 3
    `)

    const response = NextResponse.json({
      success: true,
      driverDocs: driverDocs.rows,
      users: users.rows,
      joinTest: joinTest.rows,
      message: "Join test completed"
  } catch (error) {
    console.error("Join test error:", error)
    const response = NextResponse.json({ 
      error: "Join test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}


