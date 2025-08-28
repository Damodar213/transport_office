import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all buyer requests (with optional filtering)
export async function GET(request: Request) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyer_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `
      SELECT 
        br.*,
        b.company_name as buyer_company,
        u.name as buyer_name,
        u.email as buyer_email,
        u.mobile as buyer_mobile,
        s.company_name as supplier_company,
        d.driver_name,
        t.vehicle_number,
        t.body_type
      FROM buyer_requests br
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN suppliers s ON br.supplier_id = s.user_id
      LEFT JOIN drivers d ON br.driver_id = d.id
      LEFT JOIN trucks t ON br.vehicle_id = t.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramCount = 0

    if (buyerId) {
      paramCount++
      query += ` AND br.buyer_id = $${paramCount}`
      params.push(buyerId)
    }

    if (status && status !== 'all') {
      paramCount++
      query += ` AND br.status = $${paramCount}`
      params.push(status)
    }

    query += ` ORDER BY br.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`
    params.push(limit, offset)

    const result = await dbQuery(query, params)
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      total: result.rows.length,
      limit,
      offset
    })

  } catch (error) {
    console.error("Error fetching buyer requests:", error)
    return NextResponse.json({ 
      error: "Failed to fetch buyer requests",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create a new buyer request
export async function POST(request: Request) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const {
      buyer_id,
      load_type,
      from_state,
      from_district,
      from_place,
      from_taluk,
      to_state,
      to_district,
      to_place,
      to_taluk,
      estimated_tons,
      number_of_goods,
      delivery_place,
      required_date,
      special_instructions
    } = body

    // Validate required fields
    if (!buyer_id || !load_type || !from_state || !from_district || !from_place || 
        !to_state || !to_district || !to_place || !delivery_place) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Generate unique order number in simple format (ORD-1, ORD-2, ORD-3, etc.)
    const orderNumberResult = await dbQuery(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1 as next_number
      FROM buyer_requests
      WHERE order_number ~ '^ORD-[0-9]+$'
    `)
    
    const nextNumber = orderNumberResult.rows[0].next_number
    const orderNumber = `ORD-${nextNumber}`

    // Insert the new request
    const result = await dbQuery(`
      INSERT INTO buyer_requests (
        buyer_id, order_number, load_type, from_state, from_district, from_place, from_taluk,
        to_state, to_district, to_place, to_taluk, estimated_tons, number_of_goods,
        delivery_place, required_date, special_instructions, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'draft'
      ) RETURNING *
    `, [
      buyer_id, orderNumber, load_type, from_state, from_district, from_place, from_taluk,
      to_state, to_district, to_place, to_taluk, estimated_tons, number_of_goods,
      delivery_place, required_date, special_instructions
    ])

    const newRequest = result.rows[0]

    return NextResponse.json({
      success: true,
      message: "Buyer request created successfully",
      data: newRequest
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating buyer request:", error)
    return NextResponse.json({ 
      error: "Failed to create buyer request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
