import { NextResponse, NextRequest } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Send manual order to suppliers API called")
    const body = await request.json()
    console.log("Request body:", body)
    const { orderId, supplierIds, orderDetails } = body

    if (!orderId || !supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      console.log("Validation failed: missing orderId or supplierIds")
      const response = NextResponse.json({ 
        error: "Order ID and supplier IDs are required" 
      }, { status: 400 })
      return addCorsHeaders(response)
    }

    const pool = getPool()
    if (!pool) {
      console.log("Database pool not available")
      const response = NextResponse.json({ 
        error: "Database not available" 
 
 
 
        }

        }

        }

      }, { status: 500 })
      return addCorsHeaders(response)
    }

    console.log("Processing order:", orderId, "for suppliers:", supplierIds)

    // Create WhatsApp message for manual order
    console.log("Creating WhatsApp message...")
    const message = createManualOrderWhatsAppMessage(orderDetails)
    console.log("WhatsApp message created:", message.substring(0, 100) + "...")

    // Get supplier details directly from database
    console.log("Fetching supplier details for:", supplierIds)
    const suppliersResult = await dbQuery(`
      SELECT 
        s.user_id as id,
        s.company_name,
        u.name as contact_person,
        u.mobile as contact_mobile
      FROM suppliers s
      LEFT JOIN users u ON s.user_id = u.user_id
      WHERE s.user_id = ANY($1)
    `, [supplierIds])

    const suppliers = suppliersResult.rows
    console.log("Found suppliers:", suppliers.length)
    
    // Create sent orders with real supplier data
    const sentOrders = supplierIds.map((supplierId: string) => {
      const supplier = suppliers.find((s: any) => s.id === supplierId)
      const phoneNumber = supplier && supplier.contact_mobile ? supplier.contact_mobile : "9876543210"
      return {
        supplierId: supplierId,
        companyName: supplier ? supplier.company_name : `Supplier ${supplierId}`,
        contactPerson: supplier ? supplier.contact_person : "Contact Person",
        whatsapp: phoneNumber,
        mobile: phoneNumber,
        message: message



        }

        }

        }

      }

    })

    // Create order submissions for each supplier
    console.log("Creating order submissions...")
    for (const supplierId of supplierIds) {
      console.log(`Creating submission for supplier: ${supplierId}`)
      try {
        // Try to insert manual order submission
        const submissionResult = await dbQuery(`
          INSERT INTO manual_order_submissions (order_id, supplier_id, submitted_by, status, notes, created_at, updated_at)
          VALUES ($1, $2, 'ADMIN', 'pending', $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          RETURNING id
        `, [orderId, supplierId, `Manual order sent to supplier`])
        console.log(`Successfully created submission for supplier: ${supplierId}, submission ID: ${submissionResult.rows[0].id}`)
      } catch (error) {
        console.error(`Failed to create submission for supplier ${supplierId}:`, error)
        // Don't continue if order submission creation fails - this is critical
        throw new Error(`Failed to create order submission for supplier ${supplierId}: ${error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error'}`)
      }

    }

    // Create notifications for each supplier (separate from order submissions)
    console.log("Creating notifications...")
    for (const supplierId of supplierIds) {
      console.log(`Creating notification for supplier: ${supplierId}`)
      try {
        const supplier = suppliers.find((s: any) => s.id === supplierId)
        const supplierName = supplier ? supplier.contact_person : "Supplier"
        const supplierCompany = supplier ? supplier.company_name : "Unknown Company"

        console.log(`Creating notification for supplier ${supplierId} with order ${orderId}`)
        const notificationResult = await dbQuery(`
          INSERT INTO supplier_notifications (
            supplier_id, type, title, message, category, priority, order_id, is_read, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
          RETURNING id
        `, [
          supplierId,
          "info",
          "New Transport Order Available",
          `New transport order ${orderDetails.orderNumber} is available for your consideration. Load: ${orderDetails.loadType}, Route: ${orderDetails.fromLocation} → ${orderDetails.toLocation}`,
          "order",
          "high",
          orderId.toString()
        ])
        console.log(`Successfully created notification for supplier: ${supplierId}, notification ID: ${notificationResult.rows[0].id}`)
      } catch (notificationError) {
        console.error(`Failed to create notification for supplier ${supplierId}:`, notificationError)
        // Don't fail the whole operation if notification creation fails
      }

    }

    // Store the supplier information for later assignment when status is updated
    // We'll store the first supplier as the primary assigned supplier
    const primarySupplier = suppliers[0]
    if (primarySupplier) {
      await dbQuery(`
        UPDATE manual_orders 
        SET 
          assigned_supplier_id = $1,
          assigned_supplier_name = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
      `, [primarySupplier.id, primarySupplier.company_name, orderId])
      console.log(`Updated manual order ${orderId} with primary supplier: ${primarySupplier.company_name}`)
    }

    // Update status to assigned since order has been sent to suppliers
    await dbQuery(`
      UPDATE manual_orders 
      SET status = 'assigned', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [orderId])
    console.log(`Updated manual order ${orderId} status to assigned`)

    const response = NextResponse.json({
      success: true,
      message: `Manual order sent to ${supplierIds.length} suppliers`,
      sentOrders: sentOrders,
      totalSent: supplierIds.length,
      whatsappMessage: message,
      primarySupplier: primarySupplier ? {



      }

      }

      }

        id: primarySupplier.id,
        name: primarySupplier.company_name



        }

        }

        }

      } : null
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error sending manual order to suppliers:", error)
    const response = NextResponse.json({ 
      error: "Failed to send manual order to suppliers",
      message: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

    }, { status: 500 })
    return addCorsHeaders(response)
  }

}

function createManualOrderWhatsAppMessage(orderDetails: any) {
  const loadInfo = orderDetails.loadType || "Load"
  const weight = orderDetails.estimatedTons || "N/A"
  const numberOfGoods = orderDetails.numberOfGoods
  const requiredDate = orderDetails.requiredDate || "ASAP"
  const specialInstructions = orderDetails.specialInstructions || "None"

  // Build comprehensive weight info
  const weightInfo = weight !== "N/A" ? `${weight} tons` : ''
  const quantityInfo = numberOfGoods ? `${numberOfGoods} units` : ''
  const loadInfoStr = [weightInfo, quantityInfo].filter(Boolean).join(' / ')

  // Build comprehensive from location string
  let fromLocationStr = orderDetails.fromLocation || 'Admin Specified Location'
  if (orderDetails.fromPlace && orderDetails.fromDistrict && orderDetails.fromState) {
    const fromParts = [orderDetails.fromPlace]
    if (orderDetails.fromTaluk && orderDetails.fromTaluk !== orderDetails.fromPlace) {
      fromParts.push(orderDetails.fromTaluk)
    }

    fromParts.push(orderDetails.fromDistrict, orderDetails.fromState)
    fromLocationStr = fromParts.join(', ')
  }

  // Build comprehensive to location string
  let toLocationStr = orderDetails.toLocation || 'Unknown'
  if (orderDetails.toPlace && orderDetails.toDistrict && orderDetails.toState) {
    const toParts = [orderDetails.toPlace]
    if (orderDetails.toTaluk && orderDetails.toTaluk !== orderDetails.toPlace) {
      toParts.push(orderDetails.toTaluk)
    }

    toParts.push(orderDetails.toDistrict, orderDetails.toState)
    toLocationStr = toParts.join(', ')
  }

  return `🚛 *NEW TRANSPORT ORDER AVAILABLE*

📋 *Order Details: *
 }

 }

 }

• Load Type: ${loadInfo}
• Weight: ${loadInfoStr || 'N/A'}
• From: ${fromLocationStr}
• To: ${toLocationStr}
• Required Date: ${requiredDate}

📝 *Special Instructions: *
 }

 }

 }

${specialInstructions}

Please review and respond if you can handle this transport order.

*Contact for more details: *
*MAHALAXMI TRANSPORT*
📞 8217563933
📞 80736 27241`
 }

 }

 }

}
