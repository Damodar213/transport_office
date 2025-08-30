import { type NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export interface SupplierVehicleLocation {
  id: number
  supplier_id: number
  supplier_name: string
  supplier_company: string
  state: string
  district: string
  place: string
  taluk?: string
  vehicle_number: string
  body_type: string
  driver_id?: number
  driver_name?: string
  status: "pending" | "confirmed" | "rejected"
  created_at: string
  submitted_at: string
  admin_notes?: string
  admin_action_date?: string
}

// GET - Fetch supplier transport orders with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    console.log("GET /api/supplier-orders - supplierId:", supplierId)

    let sql: string
    let params: any[] = []

    if (supplierId) {
      // Fetch orders for a specific supplier
      sql = `
        SELECT 
          t.id,
          t.supplier_id,
          t.state,
          t.district,
          t.place,
          t.taluk,
          t.vehicle_number,
          t.body_type,
          t.driver_id,
          d.driver_name,
          t.status,
          t.created_at,
          t.submitted_at,
          t.admin_notes,
          t.admin_action_date
        FROM suppliers_vehicle_location t
        LEFT JOIN drivers d ON t.driver_id = d.id
        WHERE t.supplier_id = $1
        ORDER BY t.created_at DESC
      `
      params = [supplierId]
    } else {
      // Fetch all orders for admin view
      sql = `
        SELECT 
          t.id,
          t.supplier_id,
          t.state,
          t.district,
          t.place,
          t.taluk,
          t.vehicle_number,
          t.body_type,
          t.driver_id,
          d.driver_name,
          t.status,
          t.created_at,
          t.submitted_at,
          t.admin_notes,
          t.admin_action_date
        FROM suppliers_vehicle_location t
        LEFT JOIN drivers d ON t.driver_id = d.id
        ORDER BY t.created_at DESC
      `
      params = []
    }

    console.log("SQL Query:", sql)
    console.log("SQL Params:", params)

    const result = await dbQuery(sql, params)
    console.log("Query result rows:", result.rows.length)
    
    // Transform the result to match the interface
    let orders
    if (supplierId) {
      // For supplier view, use hardcoded names
      orders = result.rows.map(row => ({
        ...row,
        supplier_name: "John Transport Co.",
        supplier_company: "aaa"
      }))
    } else {
      // For admin view, get supplier details
      orders = []
      for (const row of result.rows) {
        try {
          const supplierResult = await dbQuery(
            "SELECT company_name FROM suppliers WHERE user_id = $1",
            [row.supplier_id]
          )
          const companyName = supplierResult.rows[0]?.company_name || "Unknown Company"
          
          orders.push({
            ...row,
            supplier_name: companyName,
            supplier_company: companyName
          })
        } catch (error) {
          console.error(`Error fetching supplier details for ${row.supplier_id}:`, error)
          orders.push({
            ...row,
            supplier_name: "Unknown Supplier",
            supplier_company: "Unknown Company"
          })
        }
      }
    }
    
    return NextResponse.json({ orders })

  } catch (error) {
    console.error("Get supplier orders error:", error)
    return NextResponse.json({ error: "Failed to fetch supplier orders", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// POST - Create new supplier transport order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // First, get the supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplierId = supplierResult.rows[0].user_id

    // Get driver name if driverId is provided
    let driverName = null
    if (body.driverId) {
      const driverResult = await dbQuery(
        "SELECT driver_name FROM drivers WHERE id = $1",
        [body.driverId]
      )
      if (driverResult.rows.length > 0) {
        driverName = driverResult.rows[0].driver_name
      }
    }

    const sql = `
      INSERT INTO suppliers_vehicle_location (
        supplier_id, state, district, place, taluk, 
        vehicle_number, body_type, driver_id, driver_name, status, created_at, submitted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `

    const params = [
      supplierId,
      body.state,
      body.district,
      body.place,
      body.taluk || null,
      body.vehicleNumber,
      body.bodyType,
      body.driverId || null,
      driverName,
      "pending",
      new Date().toISOString(),
      new Date().toISOString()
    ]

    const result = await dbQuery(sql, params)
    const newOrder = result.rows[0]

    // Get supplier details for the response
    const supplierDetails = await dbQuery(
      "SELECT company_name FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    const orderWithSupplier = {
      ...newOrder,
      supplier_name: "John Transport Co.", // Use the company name from your existing data
      supplier_company: supplierDetails.rows[0].company_name
    }

    return NextResponse.json({ 
      message: "Supplier order created successfully", 
      order: orderWithSupplier 
    }, { status: 201 })

  } catch (error) {
    console.error("Create supplier order error:", error)
    return NextResponse.json({ error: "Failed to create supplier order" }, { status: 500 })
  }
}

// PUT - Update supplier transport order (for admin actions)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const sql = `
      UPDATE suppliers_vehicle_location 
      SET 
        status = $1,
        admin_notes = $2,
        admin_action_date = $3,
        updated_at = $4
      WHERE id = $5
      RETURNING *
    `

    const params = [
      updateData.status,
      updateData.adminNotes || null,
      updateData.adminActionDate || new Date().toISOString(),
      new Date().toISOString(),
      id
    ]

    const result = await dbQuery(sql, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const updatedOrder = result.rows[0]

    // If order is confirmed, create a record in confirmed_orders table
    if (updateData.status === "confirmed") {
      try {
        const confirmedOrderSql = `
          INSERT INTO confirmed_orders (
            vehicle_location_id, supplier_id, status, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `
        
        const confirmedOrderParams = [
          updatedOrder.id,
          updatedOrder.supplier_id,
          "assigned", // Initial status for confirmed orders
          updateData.adminNotes || null,
          new Date().toISOString(),
          new Date().toISOString()
        ]

        await dbQuery(confirmedOrderSql, confirmedOrderParams)
        console.log("Created confirmed order record for vehicle location:", updatedOrder.id)
      } catch (error) {
        console.error("Error creating confirmed order record:", error)
        // Don't fail the main update if confirmed order creation fails
      }
    }

    // Get supplier details for the response
    const supplierDetails = await dbQuery(
      "SELECT s.company_name FROM suppliers s WHERE s.user_id = $1",
      [updatedOrder.supplier_id]
    )

    const orderWithSupplier = {
      ...updatedOrder,
      supplier_name: supplierDetails.rows[0].company_name,
      supplier_company: supplierDetails.rows[0].company_name
    }

    return NextResponse.json({ 
      message: "Order updated successfully", 
      order: orderWithSupplier 
    })

  } catch (error) {
    console.error("Update supplier order error:", error)
    return NextResponse.json({ error: "Failed to update supplier order" }, { status: 500 })
  }
}
