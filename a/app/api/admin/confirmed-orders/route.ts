import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    // First, check if confirmed_orders table has any data
    const countResult = await dbQuery("SELECT COUNT(*) as count FROM confirmed_orders")
    console.log("Confirmed orders count:", countResult.rows[0].count)
    
    // Simple query to get basic confirmed orders data
    const sql = `
      SELECT 
        co.id,
        co.transport_order_id,
        co.supplier_id,
        co.status,
        co.notes,
        co.created_at,
        co.updated_at
      FROM confirmed_orders co
      ORDER BY co.created_at DESC
    `

    const result = await dbQuery(sql)
    console.log("Admin confirmed orders query result rows:", result.rows.length)
    
    // Transform the result to match the expected interface
    const confirmedOrders = result.rows.map(row => ({
      id: row.id,
      transport_order_id: row.transport_order_id,
      supplier_id: row.supplier_id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // For now, use placeholder data
      transport_order_details: {
        state: "Loading...",
        district: "Loading...",
        place: "Loading...",
        taluk: null,
        vehicle_number: "Loading...",
        body_type: "Loading..."
      },
      supplier_company: "Loading..."
    }))
    
    const response = NextResponse.json({ 
      confirmedOrders,
      totalCount: countResult.rows[0].count
  }
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Get admin confirmed orders error:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch confirmed orders",
      details: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
    return addCorsHeaders(response)
  }
