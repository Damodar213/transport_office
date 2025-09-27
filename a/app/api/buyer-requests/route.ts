import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

// GET - Fetch all buyer requests (with optional filtering)
export async function GET(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Allow buyers and admins to access this endpoint
    if (session.role !== 'buyer' && session.role !== 'admin') {
      return NextResponse.json({ error: "Access denied - buyer or admin role required" }, { status: 403 })
    }

    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Ensure buyer_requests table exists
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS buyer_requests (
        id SERIAL PRIMARY KEY,
        buyer_id VARCHAR(50) NOT NULL,
        supplier_id VARCHAR(50),
        driver_id INTEGER,
        vehicle_id INTEGER,
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
        estimated_tons DECIMAL(8,2),
        number_of_goods INTEGER,
        delivery_place VARCHAR(200),
        required_date DATE,
        special_instructions TEXT,
        rate DECIMAL(10,2),
        distance_km DECIMAL(8,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Get buyer_id from authenticated user (buyers can only see their own requests, admins see all)
    const buyerId = session.userIdString

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

    // Filter by authenticated user's buyer_id only if user is a buyer (not admin)
    if (session.role === 'buyer' && buyerId) {
      paramCount++
      query += ` AND br.buyer_id = $${paramCount}`
      params.push(buyerId)
    }

    // For admin users, exclude draft orders - only show submitted orders
    if (session.role === 'admin') {
      paramCount++
      query += ` AND br.status != $${paramCount}`
      params.push('draft')
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
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Allow buyers and admins to access this endpoint
    if (session.role !== 'buyer' && session.role !== 'admin') {
      return NextResponse.json({ error: "Access denied - buyer or admin role required" }, { status: 403 })
    }

    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const {
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

    // Get buyer_id from authenticated user
    const buyer_id = session.userIdString

    // Validate required fields
    if (!buyer_id || !load_type || !from_state || !from_district || !from_place || 
        !to_state || !to_district || !to_place || !delivery_place) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Check if buyer exists in buyers table, if not create a basic entry
    const buyerCheck = await dbQuery(`
      SELECT user_id FROM buyers WHERE user_id = $1
    `, [buyer_id])
    
    if (buyerCheck.rows.length === 0) {
      // Check if user exists with buyer role
      const userCheck = await dbQuery(`
        SELECT user_id FROM users WHERE user_id = $1 AND role = 'buyer'
      `, [buyer_id])
      
      if (userCheck.rows.length === 0) {
        return NextResponse.json({ 
          error: "Buyer not found. Please register as a buyer first." 
        }, { status: 400 })
      }
      
      // Create basic buyer entry
      await dbQuery(`
        INSERT INTO buyers (user_id, company_name, gst_number)
        VALUES ($1, $2, $3)
      `, [buyer_id, "Unknown Company", "GST000000000"])
      
      console.log(`Created buyer entry for user_id: ${buyer_id}`)
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

    // Note: Notifications are now created only when the order is submitted, not when created as draft

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
