import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all manual orders
export async function GET(request: Request) {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    console.log("Fetching manual orders...")

    // Get all manual orders with optional filtering
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = searchParams.get("limit")
    const offset = searchParams.get("offset")

    let sql = `
      SELECT 
        id,
        order_number,
        load_type,
        estimated_tons,
        delivery_place,
        from_location,
        status,
        created_by,
        assigned_supplier_id,
        assigned_supplier_name,
        admin_notes,
        special_instructions,
        required_date,
        created_at,
        updated_at
      FROM manual_orders
    `
    
    const params: any[] = []
    let paramCount = 0

    // Add status filter if provided
    if (status && status !== "all") {
      paramCount++
      sql += ` WHERE status = $${paramCount}`
      params.push(status)
    }

    // Add ordering
    sql += ` ORDER BY created_at DESC`

    // Add pagination if provided
    if (limit) {
      paramCount++
      sql += ` LIMIT $${paramCount}`
      params.push(parseInt(limit))
    }

    if (offset) {
      paramCount++
      sql += ` OFFSET $${paramCount}`
      params.push(parseInt(offset))
    }

    console.log("Manual orders SQL:", sql)
    console.log("Manual orders params:", params)

    const result = await dbQuery(sql, params)
    console.log(`Found ${result.rows.length} manual orders`)

    return NextResponse.json({
      success: true,
      orders: result.rows,
      total: result.rows.length,
      message: "Manual orders fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching manual orders:", error)
    return NextResponse.json({ 
      error: "Failed to fetch manual orders",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Update manual order status or assign to supplier
export async function POST(request: Request) {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const body = await request.json()
    const { orderId, action, supplierId, supplierName, adminNotes, status } = body

    console.log("Manual order update request:", { orderId, action, supplierId, supplierName, adminNotes, status })

    if (!orderId || !action) {
      return NextResponse.json({ 
        error: "Order ID and action are required" 
      }, { status: 400 })
    }

    if (action === "assign") {
      // Assign order to supplier
      if (!supplierId || !supplierName) {
        return NextResponse.json({ 
          error: "Supplier ID and name are required for assignment" 
        }, { status: 400 })
      }

      const result = await dbQuery(`
        UPDATE manual_orders 
        SET 
          status = 'assigned',
          assigned_supplier_id = $1,
          assigned_supplier_name = $2,
          admin_notes = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [supplierId, supplierName, adminNotes || '', orderId])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Manual order not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: "Manual order assigned successfully",
        order: result.rows[0]
      })
    }

    if (action === "update_status") {
      // Update order status
      if (!status) {
        return NextResponse.json({ 
          error: "Status is required for status update" 
        }, { status: 400 })
      }

      const result = await dbQuery(`
        UPDATE manual_orders 
        SET 
          status = $1,
          admin_notes = $2,
          updated_at = NOW()
        WHERE id = $3
        RETURNING *
      `, [status, adminNotes || '', orderId])

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Manual order not found" }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        message: "Manual order status updated successfully",
        order: result.rows[0]
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error updating manual order:", error)
    return NextResponse.json({ 
      error: "Failed to update manual order",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}

