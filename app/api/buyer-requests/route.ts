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

    // Create notification for admin when new transport request is created
    try {
      console.log("Starting notification creation process...")
      
      // Get buyer details for the notification
      const buyerResult = await dbQuery(`
        SELECT u.name as buyer_name
        FROM users u 
        WHERE u.user_id = $1
      `, [buyer_id])
      
      let buyerName = buyerResult.rows.length > 0 && buyerResult.rows[0].buyer_name 
        ? buyerResult.rows[0].buyer_name 
        : buyer_id
      
      // Ensure buyer name is never null or undefined
      if (!buyerName || buyerName === 'null' || buyerName === 'undefined') {
        buyerName = buyer_id
      }
      
      console.log(`Buyer name resolved: ${buyerName}`)
      
      // Create location strings
      const fromLocation = `${from_place}, ${from_district}, ${from_state}`
      const toLocation = `${to_place}, ${to_district}, ${to_state}`
      console.log(`From: ${fromLocation}, To: ${toLocation}`)
      
      // Check if transport_request_notifications table exists, create if not
      const tableExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'transport_request_notifications'
        )
      `)
      
      console.log(`Table exists: ${tableExists.rows[0].exists}`)
      
      if (!tableExists.rows[0].exists) {
        console.log("Creating transport_request_notifications table...")
        await dbQuery(`
          CREATE TABLE transport_request_notifications (
            id SERIAL PRIMARY KEY,
            order_number VARCHAR(50) NOT NULL,
            load_type VARCHAR(100) NOT NULL,
            buyer_name VARCHAR(100) NOT NULL,
            buyer_id VARCHAR(50) NOT NULL,
            from_location TEXT NOT NULL,
            to_location TEXT NOT NULL,
            estimated_tons DECIMAL(10,2),
            number_of_goods INTEGER,
            delivery_place VARCHAR(255) NOT NULL,
            required_date DATE,
            special_instructions TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `)
        console.log("Created transport_request_notifications table")
      }
      
      // Check if notification already exists for this order
      const existingNotification = await dbQuery(`
        SELECT id FROM transport_request_notifications 
        WHERE order_number = $1
      `, [orderNumber])
      
      console.log(`Existing notifications for ${orderNumber}: ${existingNotification.rows.length}`)
      
      if (existingNotification.rows.length === 0) {
        console.log("Inserting new notification...")
        // Insert new notification directly into the database
        const insertResult = await dbQuery(`
          INSERT INTO transport_request_notifications (
            order_number, load_type, buyer_name, buyer_id, from_location, to_location,
            estimated_tons, number_of_goods, delivery_place, required_date, special_instructions
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `, [
          orderNumber, load_type, buyerName, buyer_id, fromLocation, toLocation,
          estimated_tons, number_of_goods, delivery_place, required_date, special_instructions
        ])
        
        console.log(`Notification created successfully with ID: ${insertResult.rows[0].id}`)
      } else {
        console.log(`Notification already exists for order ${orderNumber}`)
      }
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError)
      console.error("Error details:", notificationError instanceof Error ? notificationError.message : "Unknown error")
      // Don't fail the main request if notification creation fails
    }

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
