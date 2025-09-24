import { type NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

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
  recommended_location?: string
}

// GET - Fetch supplier transport orders with filtering
export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!getPool()) {
      console.log("No database connection available, returning empty orders list")
      return NextResponse.json({ orders: [] })
    }

    // Ensure required tables exist (idempotent)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS suppliers_vehicle_location (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(50) NOT NULL,
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        place VARCHAR(200) NOT NULL,
        taluk VARCHAR(100),
        vehicle_number VARCHAR(20) NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        driver_id INTEGER,
        driver_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        admin_action_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        recommended_location VARCHAR(255)
      )
    `)
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    console.log("GET /api/supplier-orders - supplierId:", supplierId)

    let sql: string
    let params: any[] = []

    if (supplierId) {
      // Fetch all orders for a specific supplier (pending, confirmed, rejected)
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
          t.admin_action_date,
          t.recommended_location
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
          t.admin_action_date,
          t.recommended_location
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
    // Check if database is available
    if (!getPool()) {
      console.log("No database connection available, cannot create order")
      return NextResponse.json({ error: "Database not available. Please try again later." }, { status: 503 })
    }

    // Ensure table exists before insert
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS suppliers_vehicle_location (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(50) NOT NULL,
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        place VARCHAR(200) NOT NULL,
        taluk VARCHAR(100),
        vehicle_number VARCHAR(20) NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        driver_id INTEGER,
        driver_name VARCHAR(100),
        status VARCHAR(20) DEFAULT 'pending',
        admin_notes TEXT,
        admin_action_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        recommended_location VARCHAR(255)
      )
    `)
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
        vehicle_number, body_type, driver_id, driver_name, status, created_at, submitted_at, recommended_location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
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
      new Date().toISOString(),
      body.recommendedLocation || null
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

    // Create notification for admin
    try {
      console.log("Creating notification for new supplier vehicle location order...")
      
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/admin/supplier-vehicle-location-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicle_location_id: newOrder.id,
          supplier_id: supplierId,
          supplier_name: "John Transport Co.", // You might want to get this from user data
          supplier_company: supplierDetails.rows[0].company_name,
          state: body.state,
          district: body.district,
          place: body.place,
          taluk: body.taluk,
          vehicle_number: body.vehicleNumber,
          body_type: body.bodyType,
          driver_name: driverName,
          status: "pending",
          recommended_location: body.recommendedLocation || null
        })
      })

      if (notificationResponse.ok) {
        console.log("✅ Notification created successfully for supplier vehicle location order")
      } else {
        console.error("❌ Failed to create notification:", await notificationResponse.text())
      }
    } catch (notificationError) {
      console.error("Error creating notification for supplier vehicle location order:", notificationError)
      // Don't fail the main operation if notification creation fails
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

    // If order is confirmed, create a record in confirmed_orders table and update order_submissions
    if (updateData.status === "confirmed") {
      try {
        // Create confirmed order record
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

        // Update order_submissions table to mark as confirmed
        const updateOrderSubmissionsSql = `
          UPDATE order_submissions 
          SET submission_status = 'confirmed', updated_at = $1
          WHERE order_id = $2 AND supplier_id = $3
        `
        
        await dbQuery(updateOrderSubmissionsSql, [
          new Date().toISOString(),
          updatedOrder.order_id || updatedOrder.id,
          updatedOrder.supplier_id
        ])
        console.log("Updated order_submissions status to confirmed for order:", updatedOrder.id)
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

// DELETE - Delete supplier transport order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("id")

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
    }

    console.log("DELETE /api/supplier-orders - orderId:", orderId)

    // First, check if the order exists and get supplier details for verification
    const checkSql = `
      SELECT s.user_id, s.company_name 
      FROM suppliers_vehicle_location svl
      JOIN suppliers s ON svl.supplier_id = s.user_id
      WHERE svl.id = $1
    `
    
    const checkResult = await dbQuery(checkSql, [orderId])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = checkResult.rows[0]

    // Delete the order
    const deleteSql = `DELETE FROM suppliers_vehicle_location WHERE id = $1`
    const deleteResult = await dbQuery(deleteSql, [orderId])

    if (deleteResult.rowCount === 0) {
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
    }

    console.log("Successfully deleted order:", orderId)

    return NextResponse.json({ 
      message: "Order deleted successfully",
      deletedOrderId: orderId
    })

  } catch (error) {
    console.error("Delete supplier order error:", error)
    return NextResponse.json({ error: "Failed to delete supplier order" }, { status: 500 })
  }
}
