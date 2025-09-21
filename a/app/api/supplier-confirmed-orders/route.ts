import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export interface SupplierConfirmedOrder {
  id: number
  transport_order_id: number
  supplier_id: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  // Additional fields from transport_orders
  state: string
  district: string
  place: string
  taluk?: string
  vehicle_number: string
  body_type: string
  admin_notes?: string
  admin_action_date?: string
}

// GET - Fetch confirmed orders for a specific supplier
export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/supplier-confirmed-orders - starting...")
    
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    console.log("GET /api/supplier-confirmed-orders - supplierId:", supplierId)

    if (!supplierId) {
    }

    // Check if database is available
    if (!getPool()) {
      console.log("Database not available")
    }

    // First, let's check if the tables exist and have data
    console.log("Checking if confirmed_orders table has data...")
    const checkConfirmedOrders = await dbQuery("SELECT COUNT(*) as count FROM confirmed_orders")
    console.log("Confirmed orders count in table:", checkConfirmedOrders.rows[0].count)

    console.log("Checking if suppliers_vehicle_location table has data...")
    const checkTransportOrders = await dbQuery("SELECT COUNT(*) as count FROM suppliers_vehicle_location")
    console.log("Transport orders count in table:", checkTransportOrders.rows[0].count)

    // Fetch confirmed orders directly from suppliers_vehicle_location table
    const sql = `
      SELECT 
        t.id,
        t.id as transport_order_id,
        t.supplier_id,
        t.status,
        t.admin_notes as notes,
        t.created_at,
        t.updated_at,
        t.state,
        t.district,
        t.place,
        t.taluk,
        t.vehicle_number,
        t.body_type,
        t.admin_notes,
        t.admin_action_date
      FROM suppliers_vehicle_location t
      WHERE t.supplier_id = $1 AND t.status = 'confirmed'
      ORDER BY t.created_at DESC
    `

    const params = [supplierId]
    console.log("SQL Query:", sql)
    console.log("SQL Params:", params)

    const result = await dbQuery(sql, params)
    console.log("Query result rows:", result.rows.length)

    // Transform the result to match the interface
    const confirmedOrders: SupplierConfirmedOrder[] = result.rows.map(row => ({
      id: row.id,
      transport_order_id: row.transport_order_id,
      supplier_id: row.supplier_id,
      status: row.status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      state: row.state,
      district: row.district,
      place: row.place,
      taluk: row.taluk,
      vehicle_number: row.vehicle_number,
      body_type: row.body_type,
      admin_notes: row.admin_notes,
      admin_action_date: row.admin_action_date
    }))

    console.log("Returning confirmed orders:", confirmedOrders.length)
  } catch (error) {
    console.error("Get supplier confirmed orders error:", error)
    
    // Return empty array as fallback to prevent dashboard crash
    console.log("Returning empty array as fallback due to error")
    const response = NextResponse.json({ 
      confirmedOrders: [],
      error: "Failed to fetch confirmed orders, using fallback",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}

// POST - Create a new confirmed order (when admin confirms a transport order)
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const body = await request.json()
    const { transport_order_id, supplier_id, status, notes } = body

    if (!transport_order_id || !supplier_id) {
    }

    const sql = `
      INSERT INTO confirmed_orders (
        transport_order_id, supplier_id, status, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const params = [
      transport_order_id,
      supplier_id,
      status || "assigned",
      notes || null,
      new Date().toISOString(),
      new Date().toISOString()
    ]

    const result = await dbQuery(sql, params)
    const newConfirmedOrder = result.rows[0]

    // Create notification for admin when supplier confirms an order
    try {
      console.log("Creating notification for supplier confirmed order...")
      
      // Get supplier details for the notification
      const supplierResult = await dbQuery(
        "SELECT company_name FROM suppliers WHERE user_id = $1",
        [supplier_id]
      )
      
      const supplierCompany = supplierResult.rows.length > 0 
        ? supplierResult.rows[0].company_name 
        : `Supplier ${supplier_id}`

      // Get transport order details for the notification
      const transportOrderResult = await dbQuery(
        "SELECT order_number, load_type, from_place, to_place FROM transport_requests WHERE id = $1",
        [transport_order_id]
      )
      
      const orderDetails = transportOrderResult.rows.length > 0 
        ? transportOrderResult.rows[0]
        : { order_number: `Order ${transport_order_id}`, load_type: "Unknown", from_place: "Unknown", to_place: "Unknown" }

      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/admin/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "success",
          title: "Supplier Confirmed Order",
          message: `Supplier ${supplierCompany} has confirmed order ${orderDetails.order_number} for ${orderDetails.load_type} transport from ${orderDetails.from_place} to ${orderDetails.to_place}`,
          category: "order",
          priority: "high",
          orderId: transport_order_id,
          supplierId: supplier_id,
          status: status
        })
      })

      if (notificationResponse.ok) {
        console.log("✅ Notification created successfully for supplier confirmed order")
      } else {
        console.error("❌ Failed to create notification:", await notificationResponse.text())
      }
    } catch (notificationError) {
      console.error("Error creating notification for supplier confirmed order:", notificationError)
      // Don't fail the main operation if notification creation fails
    }

    const response = NextResponse.json({ 
      message: "Confirmed order created successfully", 
      confirmedOrder: newConfirmedOrder 
  } catch (error) {
    console.error("Create confirmed order error:", error)
  }
}

// PUT - Update confirmed order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
    }

    const sql = `
      UPDATE confirmed_orders 
      SET 
        status = $1,
        notes = $2,
        updated_at = $3
      WHERE id = $4
      RETURNING *
    `

    const params = [
      status || "assigned",
      notes || null,
      new Date().toISOString(),
      id
    ]

    const result = await dbQuery(sql, params)

    if (result.rows.length === 0) {
    }

    const updatedOrder = result.rows[0]

    const response = NextResponse.json({ 
      message: "Confirmed order updated successfully", 
      confirmedOrder: updatedOrder 
  } catch (error) {
    console.error("Update confirmed order error:", error)
  }
}
