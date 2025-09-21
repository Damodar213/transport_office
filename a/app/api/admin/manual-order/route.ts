import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Manual order creation API called")
    
    const pool = getPool()
    console.log("Database pool:", pool ? "Available" : "Not available")
    
    if (!pool) {
      console.log("Database not available")
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
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
      const response = NextResponse.json(
        { error: "Missing required fields: loadType, (estimatedTons or numberOfGoods), deliveryPlace" },
        { status: 400 }
      )
      return addCorsHeaders(response)
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

    // Create manual order in manual_orders table
    console.log("Creating manual order in manual_orders table...")
    const orderResult = await dbQuery(`
      INSERT INTO manual_orders (
        order_number, load_type, estimated_tons, number_of_goods, delivery_place, 
        from_location, from_state, from_district, from_place, from_taluk,
        to_state, to_district, to_place, to_taluk,
        status, created_by, special_instructions, required_date
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `, [
      orderNumber, 
      loadType, 
      estimatedTons ? parseFloat(estimatedTons) : null,
      numberOfGoods ? parseInt(numberOfGoods) : null,
      deliveryPlace,
      fromPlace || 'Admin Specified Location',
      fromState !== undefined ? fromState : 'Admin Specified',
      fromDistrict !== undefined ? fromDistrict : 'Location',
      fromPlace || 'Admin Specified Location',
      fromTaluk || null,
      toState !== undefined ? toState : 'Not Specified',
      toDistrict !== undefined ? toDistrict : 'Not Specified',
      toPlace || deliveryPlace,
      toTaluk || null,
      'pending', 
      'ADMIN', 
      specialInstructions || 'Manual order created by admin',
      requiredDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    ])

    const newOrder = orderResult.rows[0]
    console.log("Created manual order:", newOrder.id)

    // Create general notification for admin
    console.log("Creating admin notification...")
    let notificationResult = null
    try {
      notificationResult = await dbQuery(`
        INSERT INTO notifications (
          type, title, message, category, priority, is_read
        ) VALUES ($1, $2, $3, $4, $5, false)
        RETURNING *
      `, [
        'new_order', 
        'Manual Order Created', 
        `Manual order created: ${orderNumber} - ${loadType} (${estimatedTons} tons) to ${deliveryPlace}`,
        'order_management',
        'medium'
      ])
      console.log("Created notification:", notificationResult.rows[0].id)
    } catch (notificationError) {
      console.error("Failed to create notification:", notificationError)
      // Don't fail the main operation if notification creation fails
    }

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
    
    const response = NextResponse.json({
      success: true,
      message: "Manual order created successfully",
      order: {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        loadType: newOrder.load_type,
        estimatedTons: newOrder.estimated_tons,
        numberOfGoods: newOrder.number_of_goods,
        deliveryPlace: newOrder.delivery_place,
        fromLocation: newOrder.from_location,
        fromState: newOrder.from_state,
        fromDistrict: newOrder.from_district,
        fromPlace: newOrder.from_place,
        fromTaluk: newOrder.from_taluk,
        toState: newOrder.to_state,
        toDistrict: newOrder.to_district,
        toPlace: newOrder.to_place,
        toTaluk: newOrder.to_taluk,
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
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Manual order creation error:", error)
    const response = NextResponse.json({ 
      error: "Failed to create manual order",
      message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
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
