import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Manual order creation API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { loadType, estimatedTons, deliveryPlace, supplierId } = await request.json()
    console.log("Manual order data:", { loadType, estimatedTons, deliveryPlace, supplierId })

    if (!loadType || !estimatedTons || !deliveryPlace || !supplierId) {
      return NextResponse.json(
        { error: "Missing required fields: loadType, estimatedTons, deliveryPlace, supplierId" },
        { status: 400 }
      )
    }

    // Verify supplier exists
    const supplierResult = await dbQuery(
      "SELECT user_id, company_name, gst_number, number_of_vehicles FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplier = supplierResult.rows[0]
    console.log("Found supplier:", supplier)

    // Generate unique order number
    const orderNumberResult = await dbQuery(`
      SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 5) AS INTEGER)), 0) + 1 as next_number
      FROM buyer_requests
      WHERE order_number ~ '^ORD-[0-9]+$'
    `)
    
    const nextNumber = orderNumberResult.rows[0].next_number
    const orderNumber = `ORD-${nextNumber}`

    // Create manual order in buyer_requests table
    const orderResult = await dbQuery(`
      INSERT INTO buyer_requests (
        buyer_id, order_number, load_type, from_state, from_district, from_place, from_taluk,
        to_state, to_district, to_place, to_taluk, estimated_tons, number_of_goods,
        delivery_place, required_date, special_instructions, status
      ) VALUES (
        'ADMIN', $1, $2, 'Admin State', 'Admin District', 'Admin Place', 'Admin Taluk',
        'Delivery State', 'Delivery District', $3, 'Delivery Taluk', $4, 1,
        $3, NOW() + INTERVAL '1 day', 'Manual order created by admin', 'submitted'
      ) RETURNING *
    `, [orderNumber, loadType, deliveryPlace, parseFloat(estimatedTons)])

    const newOrder = orderResult.rows[0]
    console.log("Created manual order:", newOrder.id)

    // Create order submission for the supplier
    const submissionResult = await dbQuery(`
      INSERT INTO order_submissions (
        order_id, supplier_id, status, submitted_at, created_at
      ) VALUES ($1, $2, 'pending', NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
      RETURNING *
    `, [newOrder.id, supplierId])

    const orderSubmission = submissionResult.rows[0]
    console.log("Created order submission:", orderSubmission.id)

    // Create notification for the supplier
    const notificationResult = await dbQuery(`
      INSERT INTO notifications (
        user_id, type, title, message, order_id, order_submission_id, created_at
      ) VALUES ($1, 'new_order', 'New Order Assignment', 
        'You have been assigned a new manual order: ${orderNumber} - ${loadType} (${estimatedTons} tons) to ${deliveryPlace}', 
        $2, $3, NOW() AT TIME ZONE 'Asia/Kolkata')
      RETURNING *
    `, [supplierId, newOrder.id, orderSubmission.id])

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
    const supplierContact = await dbQuery(`
      SELECT mobile, whatsapp FROM suppliers WHERE user_id = $1
    `, [supplierId])

    const contactInfo = supplierContact.rows[0] || { mobile: "+91-9876543210", whatsapp: "+91-9876543210" }

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
