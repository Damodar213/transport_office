import { type NextRequest, NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }

    // Check if database is available
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // First, let's check if the tables exist and have data
    console.log("Checking if confirmed_orders table has data...")
    const checkConfirmedOrders = await dbQuery("SELECT COUNT(*) as count FROM confirmed_orders")
    console.log("Confirmed orders count in table:", checkConfirmedOrders.rows[0].count)

    console.log("Checking if suppliers_vehicle_location table has data...")
    const checkTransportOrders = await dbQuery("SELECT COUNT(*) as count FROM suppliers_vehicle_location")
    console.log("Transport orders count in table:", checkTransportOrders.rows[0].count)

    // Check if there are any confirmed orders for this supplier
    const checkSupplierConfirmed = await dbQuery(
      "SELECT COUNT(*) as count FROM confirmed_orders WHERE supplier_id = $1",
      [supplierId]
    )
    console.log("Confirmed orders for supplier", supplierId, ":", checkSupplierConfirmed.rows[0].count)

    // If no confirmed orders exist, return empty array
    if (checkSupplierConfirmed.rows[0].count === 0) {
      console.log("No confirmed orders found for supplier, returning empty array")
      return NextResponse.json({ confirmedOrders: [] })
    }

    // Fetch confirmed orders with transport order details
    // Fixed: Changed table alias from 'to' to 't' since 'to' is a reserved keyword
    const sql = `
      SELECT 
        co.id,
        co.transport_order_id,
        co.supplier_id,
        co.status,
        co.notes,
        co.created_at,
        co.updated_at,
        t.state,
        t.district,
        t.place,
        t.taluk,
        t.vehicle_number,
        t.body_type,
        t.admin_notes,
        t.admin_action_date
      FROM confirmed_orders co
      JOIN suppliers_vehicle_location t ON co.transport_order_id = t.id
      WHERE co.supplier_id = $1
      ORDER BY co.created_at DESC
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
    return NextResponse.json({ confirmedOrders })

  } catch (error) {
    console.error("Get supplier confirmed orders error:", error)
    
    // Return empty array as fallback to prevent dashboard crash
    console.log("Returning empty array as fallback due to error")
    return NextResponse.json({ 
      confirmedOrders: [],
      error: "Failed to fetch confirmed orders, using fallback",
      details: error instanceof Error ? error.message : "Unknown error"
    })
  }
}

// POST - Create a new confirmed order (when admin confirms a transport order)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transport_order_id, supplier_id, status, notes } = body

    if (!transport_order_id || !supplier_id) {
      return NextResponse.json({ error: "Transport order ID and supplier ID are required" }, { status: 400 })
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

    return NextResponse.json({ 
      message: "Confirmed order created successfully", 
      confirmedOrder: newConfirmedOrder 
    }, { status: 201 })

  } catch (error) {
    console.error("Create confirmed order error:", error)
    return NextResponse.json({ error: "Failed to create confirmed order" }, { status: 500 })
  }
}

// PUT - Update confirmed order status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, notes } = body

    if (!id) {
      return NextResponse.json({ error: "Confirmed order ID is required" }, { status: 400 })
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
      return NextResponse.json({ error: "Confirmed order not found" }, { status: 404 })
    }

    const updatedOrder = result.rows[0]

    return NextResponse.json({ 
      message: "Confirmed order updated successfully", 
      confirmedOrder: updatedOrder 
    })

  } catch (error) {
    console.error("Update confirmed order error:", error)
    return NextResponse.json({ error: "Failed to update confirmed order" }, { status: 500 })
  }
}
