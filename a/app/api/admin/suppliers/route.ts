import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export interface Supplier {
  id: string
  user_id: string
  company_name: string
  contact_person?: string
  email?: string
  mobile?: string
  whatsapp?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  gst_number: string
  pan_number?: string
  number_of_vehicles?: number
  is_verified?: boolean
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export async function GET() {
  try {
    console.log("Fetching real suppliers from database...")
    
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available",
        suppliers: []
      }, { status: 500 })
    }

    // Fetch all suppliers with basic information
    const result = await dbQuery(`
      SELECT 
        s.user_id as id,
        s.user_id,
        s.company_name,
        u.name as contact_person,
        u.mobile,
        u.mobile as whatsapp,
        s.gst_number,
        s.number_of_vehicles
      FROM suppliers s
      LEFT JOIN users u ON u.user_id = s.user_id
      ORDER BY s.company_name
    `)

    const suppliers = result.rows
    console.log(`Found ${suppliers.length} real suppliers`)

    return NextResponse.json({
      success: true,
      suppliers: suppliers,
      total: suppliers.length,
      message: "Real suppliers fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return NextResponse.json({ 
      error: "Failed to fetch suppliers",
      suppliers: [],
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
