import { NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    // Check if database is available
    const pool = await import("@/lib/db").then(m => m.getPool())
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available",
        requests: [],
        message: "Using fallback data"
      }, { status: 503 })
    }

    // Fetch transport requests with buyer and supplier information
    const result = await dbQuery(`
      SELECT 
        tr.id,
        tr.supplier_id as "supplierId",
        tr.state,
        tr.district,
        tr.place,
        tr.taluk,
        tr.vehicle_number as "vehicleNumber",
        tr.body_type as "bodyType",
        tr.status,
        tr.admin_notes as "adminNotes",
        tr.created_at as "createdAt",
        tr.submitted_at as "submittedAt",
        tr.updated_at as "updatedAt",
        u.user_id as "buyerId",
        u.name as "buyerName",
        u.email as "buyerEmail"
      FROM transport_orders tr
      LEFT JOIN users u ON tr.supplier_id = u.user_id
      ORDER BY tr.created_at DESC
    `)

    // Transform the data to match the frontend interface
    const requests = result.rows.map(row => ({
      id: row.id,
      buyerId: row.buyerId || 'Unknown',
      buyerName: row.buyerName || 'Unknown',
      buyerCompany: 'Transport Company', // Default value since we're not joining with suppliers table
      loadType: row.bodyType || 'General Cargo',
      fromLocation: `${row.district || 'Unknown'}, ${row.state || 'Unknown'}`,
      toLocation: row.place || 'Unknown',
      estimatedTons: 25.0, // Default value, can be enhanced later
      requiredDate: row.submittedAt ? new Date(row.submittedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      specialInstructions: row.adminNotes || '',
      status: row.status || 'pending',
      submittedAt: row.createdAt ? new Date(row.createdAt).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
      assignedSupplierId: row.supplierId || undefined,
      assignedSupplierName: row.buyerName || undefined, // Use buyer name as supplier name for now
      adminNotes: row.adminNotes || undefined,
      route: {
        from: `${row.district || 'Unknown'}, ${row.state || 'Unknown'}`,
        to: row.place || 'Unknown',
        taluk: row.taluk
      }
    }))

    return NextResponse.json({
      requests,
      total: requests.length,
      message: "Transport requests fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching transport requests:", error)
    return NextResponse.json({ 
      error: "Failed to fetch transport requests",
      requests: [],
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, requestId, supplierId, notes, status } = body

    if (action === 'assign') {
      // Update transport order status to assigned
      await dbQuery(`
        UPDATE transport_orders 
        SET status = 'confirmed', admin_notes = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [notes, requestId])

      // Create confirmed order record
      await dbQuery(`
        INSERT INTO confirmed_orders (transport_order_id, supplier_id, status, notes, created_at, updated_at)
        VALUES ($1, $2, 'assigned', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [requestId, supplierId, notes])

      return NextResponse.json({ 
        message: "Order assigned successfully",
        status: "confirmed"
      })
    }

    if (action === 'reject') {
      // Update transport order status to rejected
      await dbQuery(`
        UPDATE transport_orders 
        SET status = 'rejected', admin_notes = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [notes, requestId])

      return NextResponse.json({ 
        message: "Order rejected successfully",
        status: "rejected"
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error) {
    console.error("Error updating transport request:", error)
    return NextResponse.json({ 
      error: "Failed to update transport request",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
