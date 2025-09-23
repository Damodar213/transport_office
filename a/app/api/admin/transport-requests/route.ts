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

    // Ensure required tables exist
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS buyer_requests (
        id SERIAL PRIMARY KEY,
        buyer_id VARCHAR(50),
        order_number VARCHAR(100),
        load_type VARCHAR(100),
        from_state VARCHAR(100),
        from_district VARCHAR(100),
        from_place VARCHAR(200),
        from_taluk VARCHAR(100),
        to_state VARCHAR(100),
        to_district VARCHAR(100),
        to_place VARCHAR(200),
        to_taluk VARCHAR(100),
        estimated_tons DECIMAL(10,2),
        number_of_goods INTEGER,
        delivery_place VARCHAR(200),
        required_date DATE,
        special_instructions TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        rate DECIMAL(10,2),
        distance_km DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS manual_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100),
        load_type VARCHAR(100),
        from_place VARCHAR(200),
        to_place VARCHAR(200),
        estimated_tons DECIMAL(10,2),
        number_of_goods INTEGER,
        delivery_place VARCHAR(200),
        required_date DATE,
        special_instructions TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_by VARCHAR(100),
        assigned_supplier_id VARCHAR(50),
        assigned_supplier_name VARCHAR(100),
        admin_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    await dbQuery(`
      CREATE TABLE IF NOT EXISTS order_submissions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        supplier_id VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Fetch buyer transport requests and manual orders
    const result = await dbQuery(`
      -- Buyer requests (only valid ones with proper buyer data)
      SELECT 
        br.id,
        br.buyer_id as "buyerId",
        br.order_number,
        br.load_type,
        br.from_state,
        br.from_district,
        br.from_place,
        br.from_taluk,
        br.to_state,
        br.to_district,
        br.to_place,
        br.to_taluk,
        br.estimated_tons,
        br.number_of_goods,
        br.delivery_place,
        br.required_date,
        br.special_instructions,
        br.status,
        br.rate,
        br.distance_km,
        br.created_at as "createdAt",
        br.updated_at as "updatedAt",
        u.name as "buyerName",
        u.email as "buyerEmail",
        b.company_name as "buyerCompany",
        'buyer_request' as "orderType",
        NULL as "assignedSupplierId",
        NULL as "assignedSupplierName"
      FROM buyer_requests br
      INNER JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      WHERE br.status = 'pending' 
        AND br.buyer_id IS NOT NULL 
        AND u.name IS NOT NULL 
        AND br.load_type IS NOT NULL
      
      UNION ALL
      
      -- Manual orders
      SELECT 
        mo.id,
        NULL as "buyerId",
        mo.order_number,
        mo.load_type,
        NULL as "from_state",
        NULL as "from_district",
        mo.from_place,
        NULL as "from_taluk",
        NULL as "to_state",
        NULL as "to_district",
        mo.to_place,
        NULL as "to_taluk",
        mo.estimated_tons,
        mo.number_of_goods,
        mo.delivery_place,
        mo.required_date,
        mo.special_instructions,
        mo.status,
        NULL as "rate",
        NULL as "distance_km",
        mo.created_at as "createdAt",
        mo.updated_at as "updatedAt",
        mo.created_by as "buyerName",
        'admin@transport.com' as "buyerEmail",
        'Manual Order' as "buyerCompany",
        'manual_order' as "orderType",
        mo.assigned_supplier_id as "assignedSupplierId",
        mo.assigned_supplier_name as "assignedSupplierName"
      FROM manual_orders mo
      WHERE mo.status IN ('pending', 'assigned') 
        AND mo.load_type IS NOT NULL 
        AND mo.estimated_tons IS NOT NULL 
        AND mo.delivery_place IS NOT NULL
      
      ORDER BY "createdAt" DESC
    `)

    // Transform the data to match the frontend interface and filter out invalid records
    const requests = result.rows
      .filter(row => {
        // Filter out records with missing essential data
        if (row.orderType === 'buyer_request') {
          // For buyer requests, ensure we have valid buyer information
          return row.buyerId && row.buyerName && row.buyerName !== 'Unknown' && row.load_type;
        } else if (row.orderType === 'manual_order') {
          // For manual orders, ensure we have valid order data
          return row.load_type && row.estimated_tons;
        }
        return false;
      })
      .map(row => ({
        id: row.id,
        buyerId: row.buyerId || 'Unknown',
        buyerName: row.buyerName || 'Unknown',
        buyerCompany: row.buyerCompany || 'Unknown Company',
        loadType: row.load_type || 'General Cargo',
        fromLocation: row.orderType === 'manual_order' 
          ? row.from_place || 'Admin Specified Location'
          : `${row.from_place || 'Unknown'}, ${row.from_district || 'Unknown'}, ${row.from_state || 'Unknown'}`,
        toLocation: row.orderType === 'manual_order'
          ? row.to_place || 'Unknown'
          : `${row.to_place || 'Unknown'}, ${row.to_district || 'Unknown'}, ${row.to_state || 'Unknown'}`,
        fromState: row.from_state || undefined,
        fromDistrict: row.from_district || undefined,
        fromPlace: row.from_place || undefined,
        fromTaluk: row.from_taluk || undefined,
        toState: row.to_state || undefined,
        toDistrict: row.to_district || undefined,
        toPlace: row.to_place || undefined,
        toTaluk: row.to_taluk || undefined,
        numberOfGoods: row.number_of_goods || undefined,
        estimatedTons: row.estimated_tons || 0,
        requiredDate: row.required_date ? new Date(row.required_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        specialInstructions: row.special_instructions || '',
        status: row.status || 'pending',
        submittedAt: row.createdAt ? new Date(row.createdAt).toISOString().replace('T', ' ').substring(0, 16) : new Date().toISOString().replace('T', ' ').substring(0, 16),
        assignedSupplierId: row.assignedSupplierId || undefined,
        assignedSupplierName: row.assignedSupplierName || undefined,
        adminNotes: undefined,
        orderType: row.orderType || 'buyer_request',
        route: {
          from: row.orderType === 'manual_order' 
            ? row.from_place || 'Admin Specified Location'
            : `${row.from_place || 'Unknown'}, ${row.from_district || 'Unknown'}, ${row.from_state || 'Unknown'}`,
          to: row.orderType === 'manual_order'
            ? row.to_place || 'Unknown'
            : `${row.to_place || 'Unknown'}, ${row.to_district || 'Unknown'}, ${row.to_state || 'Unknown'}`,
          taluk: row.from_taluk
        }
      }))

    return NextResponse.json({
      requests,
      total: requests.length,
      message: "Transport requests fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching transport requests:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack")
    return NextResponse.json({ 
      error: "Failed to fetch transport requests",
      requests: [],
      message: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : "No details"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, requestId, supplierId, notes, status, orderType } = body

    if (action === 'assign') {
      if (orderType === 'manual_order') {
        // Assign manual order to supplier
        await dbQuery(`
          UPDATE manual_orders 
          SET 
            status = 'assigned',
            assigned_supplier_id = $1,
            assigned_supplier_name = $2,
            admin_notes = $3,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [supplierId, notes, notes, requestId])

        return NextResponse.json({ 
          message: "Manual order assigned successfully",
          status: "assigned"
        })
      } else {
        // Create order submission for the buyer request
        await dbQuery(`
          INSERT INTO order_submissions (order_id, supplier_id, status, notes, created_at, updated_at)
          VALUES ($1, $2, 'assigned', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [requestId, supplierId, notes])

        // Update buyer request status to assigned
        await dbQuery(`
          UPDATE buyer_requests 
          SET status = 'assigned', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [requestId])

        return NextResponse.json({ 
          message: "Buyer request assigned successfully",
          status: "assigned"
        })
      }
    }

    if (action === 'reject') {
      if (orderType === 'manual_order') {
        // Update manual order status to rejected
        await dbQuery(`
          UPDATE manual_orders 
          SET status = 'cancelled', admin_notes = $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `, [notes, requestId])

        return NextResponse.json({ 
          message: "Manual order rejected successfully",
          status: "cancelled"
        })
      } else {
        // Update buyer request status to rejected
        await dbQuery(`
          UPDATE buyer_requests 
          SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [requestId])

        return NextResponse.json({ 
          message: "Buyer request rejected successfully",
          status: "rejected"
        })
      }
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('id')
    const orderType = searchParams.get('orderType')

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 })
    }

    console.log("Deleting transport request:", requestId, "type:", orderType)

    if (orderType === 'manual_order') {
      // Delete manual order
      const deleteResult = await dbQuery(`
        DELETE FROM manual_orders 
        WHERE id = $1
      `, [requestId])

      if (deleteResult.rowCount === 0) {
        return NextResponse.json({ error: "Manual order not found" }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true,
        message: "Manual order deleted successfully"
      })
    } else {
      // Delete buyer request
      const deleteResult = await dbQuery(`
        DELETE FROM buyer_requests 
        WHERE id = $1
      `, [requestId])

      if (deleteResult.rowCount === 0) {
        return NextResponse.json({ error: "Buyer request not found" }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true,
        message: "Buyer request deleted successfully"
      })
    }

  } catch (error) {
    console.error("Error deleting transport request:", error)
    return NextResponse.json({ 
      error: "Failed to delete transport request",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
