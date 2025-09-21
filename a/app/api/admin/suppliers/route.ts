import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    console.log("Fetching suppliers from database...", userId ? `for userId: ${userId}` : "all suppliers")
    
    const pool = getPool()
    if (!pool) {
      const response = NextResponse.json({ 
        error: "Database not available",
        suppliers: []
    }

    let sql = `
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
    `
    
    let params: string[] = []
    
    if (userId) {
      sql += ` WHERE s.user_id = $1`
      params = [userId]
    } else {
      sql += ` ORDER BY s.company_name`
    }

    const result = await dbQuery(sql, params)

    const suppliers = result.rows
    console.log(`Found ${suppliers.length} suppliers`)

    // If userId was provided, return the single supplier or null
    if (userId) {
      const supplier = suppliers.length > 0 ? suppliers[0] : null
      const response = NextResponse.json({
        success: true,
        data: supplier,
        message: supplier ? "Supplier found" : "Supplier not found"
    }

    // Return all suppliers
    const response = NextResponse.json({
      success: true,
      suppliers: suppliers,
      total: suppliers.length,
      message: "Real suppliers fetched successfully"
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch suppliers",
      suppliers: [],
      message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}
