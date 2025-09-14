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
    
    const { loadType, estimatedTons, deliveryPlace, supplierId } = body
    console.log("Manual order data:", { loadType, estimatedTons, deliveryPlace, supplierId })

    if (!loadType || !estimatedTons || !deliveryPlace || !supplierId) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields: loadType, estimatedTons, deliveryPlace, supplierId" },
        { status: 400 }
      )
    }

    // Verify supplier exists
    console.log("Checking supplier:", supplierId)
    const supplierResult = await dbQuery(
      "SELECT user_id, company_name, gst_number, number_of_vehicles FROM suppliers WHERE user_id = $1",
      [supplierId]
    )
    console.log("Supplier query result:", supplierResult.rows.length, "rows")

    if (supplierResult.rows.length === 0) {
      console.log("Supplier not found:", supplierId)
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplier = supplierResult.rows[0]
    console.log("Found supplier:", supplier)

    // Generate unique order number
    console.log("Generating order number...")
    const orderNumberResult = await dbQuery(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1 as next_number
      FROM buyer_requests
      WHERE order_number ~ '^ORD-[0-9]+$'
    `)
    console.log("Order number query result:", orderNumberResult.rows[0])
    
    const nextNumber = orderNumberResult.rows[0].next_number
    const orderNumber = `ORD-${nextNumber}`
    console.log("Generated order number:", orderNumber)

    // Create manual order in buyer_requests table
    console.log("Creating manual order in buyer_requests table...")
    const orderResult = await dbQuery(`
      INSERT INTO buyer_requests (
        buyer_id, order_number, load_type, from_state, from_district, from_place, from_taluk,
        to_state, to_district, to_place, to_taluk, estimated_tons, number_of_goods,
        delivery_place, required_date, special_instructions, status
      ) VALUES (
        'ADMIN', $1, $2, 'Admin State', 'Admin District', 'Admin Place', 'Admin Taluk',
        'Delivery State', 'Delivery District', $3, 'Delivery Taluk', $4, 1,
        $3, NOW() + INTERVAL '1 day', 'Manual order created by admin', 'draft'
      ) RETURNING *
    `, [orderNumber, loadType, deliveryPlace, parseFloat(estimatedTons)])

    const newOrder = orderResult.rows[0]
    console.log("Created manual order:", newOrder.id)

    // Create order submission for the supplier
    console.log("Creating order submission...")
    const submissionResult = await dbQuery(`
      INSERT INTO order_submissions (
        order_id, supplier_id, submitted_by, submitted_at, whatsapp_sent, notification_sent, status, created_at, updated_at
      ) VALUES ($1, $2, $3, NOW() AT TIME ZONE 'Asia/Kolkata', false, false, 'submitted', NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
      RETURNING *
    `, [newOrder.id, supplierId, 'ADMIN'])

    const orderSubmission = submissionResult.rows[0]
    console.log("Created order submission:", orderSubmission.id)

    // Create notification for the supplier
    console.log("Creating notification...")
    const notificationResult = await dbQuery(`
      INSERT INTO notifications (
        type, title, message, category, priority, is_read
      ) VALUES ($1, $2, $3, $4, $5, false)
      RETURNING *
    `, [
      'new_order', 
      'New Order Assignment', 
      `You have been assigned a new manual order: ${orderNumber} - ${loadType} (${estimatedTons} tons) to ${deliveryPlace}`,
      'order_assignment',
      'high'
    ])

    console.log("Created notification:", notificationResult.rows[0].id)

    // Create WhatsApp message
    const whatsappMessage = createWhatsAppMessage({
      orderNumber,
      loadType,
      estimatedTons,
      deliveryPlace,
      fromLocation: "Admin Specified Location"
    })

    // Get supplier contact details (you may need to add these to your suppliers table)
    console.log("Getting supplier contact details...")
    const supplierContact = await dbQuery(`
      SELECT mobile, whatsapp FROM suppliers WHERE user_id = $1
    `, [supplierId])
    console.log("Supplier contact query result:", supplierContact.rows.length, "rows")

    const contactInfo = supplierContact.rows[0] || { mobile: "+91-9876543210", whatsapp: "+91-9876543210" }
    console.log("Contact info:", contactInfo)

    console.log("Manual order creation completed successfully!")
    
    return NextResponse.json({
      success: true,
      message: "Manual order created successfully",
      order: {
        id: newOrder.id,
        orderNumber: newOrder.order_number,
        loadType: newOrder.load_type,
        estimatedTons: newOrder.estimated_tons,
        deliveryPlace: newOrder.delivery_place,
        status: newOrder.status,
        supplierId: supplierId,
        supplierName: supplier.company_name,
        orderSubmissionId: orderSubmission.id
      },
      notification: {
        id: notificationResult.rows[0].id,
        message: notificationResult.rows[0].message
      },
      whatsapp: {
        message: whatsappMessage,
        contact: contactInfo.whatsapp || contactInfo.mobile
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
  const { orderNumber, loadType, estimatedTons, deliveryPlace, fromLocation } = orderDetails
  
  return `🚛 *New Transport Order Assignment*

📋 *Order Details:*
• Order Number: ${orderNumber}
• Load Type: ${loadType}
• Weight: ${estimatedTons} tons
• From: ${fromLocation}
• To: ${deliveryPlace}

📅 *Status:* Pending Confirmation

Please log in to your supplier dashboard to view full details and confirm this order.

Thank you for your service! 🚚`
}
