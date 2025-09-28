import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Manual order creation API called")
    
    const pool = getPool()
    console.log("Database pool:", pool ? "Available" : "Not available")
    
    if (!pool) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    
    const { 
      loadType, 
      estimatedTons, 
      numberOfGoods,
      deliveryPlace,
      fromState,
      fromDistrict,
      fromPlace,
      fromTaluk,
      toState,
      toDistrict,
      toPlace,
      toTaluk,
      requiredDate,
      specialInstructions
    } = body
    
    console.log("Manual order data:", { 
      loadType, 
      estimatedTons, 
      numberOfGoods,
      deliveryPlace,
      fromState,
      fromDistrict,
      fromPlace,
      fromTaluk,
      toState,
      toDistrict,
      toPlace,
      toTaluk,
      requiredDate,
      specialInstructions
    })


    if (!loadType || (!estimatedTons && !numberOfGoods) || !deliveryPlace) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: loadType, (estimatedTons or numberOfGoods), deliveryPlace" },
        { status: 400 }
      )
    }

    // Create a general manual order without specific supplier assignment
    console.log("Creating manual order without supplier assignment")

    // Generate unique order number for manual orders
    console.log("Generating manual order number...")
    const orderNumberResult = await dbQuery(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0) + 1 as next_number
      FROM manual_orders
      WHERE order_number ~ '^MO-[0-9]+$'
    `)
    console.log("Manual order number query result:", orderNumberResult.rows[0])
    
    const nextNumber = orderNumberResult.rows[0].next_number
    const orderNumber = `MO-${nextNumber}`
    console.log("Generated manual order number:", orderNumber)

    // Ensure manual_orders table exists with correct structure
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS manual_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100),
        load_type VARCHAR(100),
        from_place VARCHAR(200),
        to_place VARCHAR(200),
        estimated_tons DECIMAL(10,2),
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

    // Add missing columns if they don't exist
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS number_of_goods INTEGER
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS from_place VARCHAR(200)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS to_place VARCHAR(200)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS from_state VARCHAR(100)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS from_district VARCHAR(100)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS to_state VARCHAR(100)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS to_district VARCHAR(100)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS from_taluk VARCHAR(100)
    `)
    
    await dbQuery(`
      ALTER TABLE manual_orders 
      ADD COLUMN IF NOT EXISTS to_taluk VARCHAR(100)
    `)

    // Create manual order in manual_orders table
    console.log("Creating manual order in manual_orders table...")
    const orderResult = await dbQuery(`
      INSERT INTO manual_orders (
        order_number, load_type, estimated_tons, number_of_goods, delivery_place, 
        from_place, to_place, from_state, from_district, to_state, to_district,
        from_taluk, to_taluk, status, created_by, special_instructions, required_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
      ) RETURNING *
    `, [
      orderNumber, 
      loadType, 
      estimatedTons ? parseFloat(estimatedTons) : null,
      numberOfGoods ? parseInt(numberOfGoods) : null,
      deliveryPlace,
      fromPlace || 'Admin Specified Location',
      toPlace || deliveryPlace,
      fromState || null,
      fromDistrict || null,
      toState || null,
      toDistrict || null,
      fromTaluk || null,
      toTaluk || null,
      'pending', 
      'ADMIN', 
      specialInstructions || 'Manual order created by admin',
      requiredDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ])

    const newOrder = orderResult.rows[0]
    console.log("Created manual order:", newOrder.id)

    // Create general notification for admin
    // Notification creation disabled for manual orders
    console.log("Manual order created - notification creation disabled")
    let notificationResult = null

    // Create WhatsApp message
    const whatsappMessage = createWhatsAppMessage({
      orderNumber,
      loadType,
      estimatedTons,
      numberOfGoods,
      deliveryPlace,
      fromLocation: fromPlace || "Admin Specified Location",
      fromState,
      fromDistrict,
      fromPlace,
      fromTaluk,
      toState,
      toDistrict,
      toPlace,
      toTaluk,
      requiredDate,
      specialInstructions
    })

    // Manual order created without specific supplier assignment
    console.log("Manual order created successfully without supplier assignment")

    console.log("Manual order creation completed successfully!")
    
    return NextResponse.json({
      success: true,
      message: "Manual order created successfully",
      order: {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        loadType: newOrder.load_type,
        estimatedTons: newOrder.estimated_tons,
        numberOfGoods: newOrder.number_of_goods,
        deliveryPlace: newOrder.delivery_place,
        fromPlace: newOrder.from_place,
        toPlace: newOrder.to_place,
        requiredDate: newOrder.required_date,
        specialInstructions: newOrder.special_instructions,
        status: newOrder.status,
        createdBy: newOrder.created_by,
        createdAt: newOrder.created_at
      },
      notification: notificationResult ? {
        id: notificationResult.rows[0].id,
        message: notificationResult.rows[0].message
      } : null,
      whatsapp: {
        message: whatsappMessage
      }
    })

  } catch (error) {
    console.error("Manual order creation error:", error)
    return NextResponse.json({ 
      error: "Failed to create manual order",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function createWhatsAppMessage(orderDetails: any) {
  const { 
    orderNumber, 
    loadType, 
    estimatedTons, 
    numberOfGoods,
    deliveryPlace, 
    fromLocation,
    fromState,
    fromDistrict,
    fromPlace,
    fromTaluk,
    toState,
    toDistrict,
    toPlace,
    toTaluk,
    requiredDate,
    specialInstructions
  } = orderDetails
  
  const weightInfo = estimatedTons ? `${estimatedTons} tons` : ''
  const quantityInfo = numberOfGoods ? `${numberOfGoods} units` : ''
  const loadInfo = [weightInfo, quantityInfo].filter(Boolean).join(' / ')
  
  // Build comprehensive from location string
  let fromLocationStr = 'Admin Specified Location'
  if (fromPlace && fromDistrict && fromState) {
    const fromParts = [fromPlace]
    if (fromTaluk && fromTaluk !== fromPlace) fromParts.push(fromTaluk)
    fromParts.push(fromDistrict, fromState)
    fromLocationStr = fromParts.join(', ')
  } else if (fromLocation) {
    fromLocationStr = fromLocation
  }
    
  // Build comprehensive to location string
  let toLocationStr = deliveryPlace
  if (toPlace && toDistrict && toState) {
    const toParts = [toPlace]
    if (toTaluk && toTaluk !== toPlace) toParts.push(toTaluk)
    toParts.push(toDistrict, toState)
    toLocationStr = toParts.join(', ')
  } else if (deliveryPlace) {
    toLocationStr = deliveryPlace
  }
  
  return `🚛 *NEW TRANSPORT ORDER AVAILABLE*

📋 *Order Details:*
• Load Type: ${loadType}
• Weight: ${loadInfo}
• From: ${fromLocationStr}
• To: ${toLocationStr}
${requiredDate ? `• Required Date: ${requiredDate}` : ''}

📝 *Special Instructions:*
${specialInstructions || 'Manual order created by admin'}

Please review and respond if you can handle this transport order.

*Contact for more details:*
*MAHALAXMI TRANSPORT*
📞 8217563933
📞 80736 27241`
}
