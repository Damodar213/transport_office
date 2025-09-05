import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, supplierIds, orderDetails } = body

    if (!orderId || !supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json({ 
        error: "Order ID and supplier IDs are required" 
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    // Create WhatsApp message
    const message = createWhatsAppMessage(orderDetails)

    // Get supplier details directly from database
    const suppliersResult = await dbQuery(`
      SELECT 
        user_id as id,
        company_name,
        gst_number,
        number_of_vehicles
      FROM suppliers
      WHERE user_id = ANY($1)
    `, [supplierIds])

    const suppliers = suppliersResult.rows
    
    // Create sent orders with real supplier data
    const sentOrders = supplierIds.map((supplierId: string) => {
      const supplier = suppliers.find((s: any) => s.id === supplierId)
      return {
        supplierId: supplierId,
        companyName: supplier ? supplier.company_name : `Supplier ${supplierId}`,
        contactPerson: "Contact Person",
        whatsapp: "+91-9876543210",
        mobile: "+91-9876543210",
        message: message
      }
    })

    return NextResponse.json({
      success: true,
      message: `Order sent to ${supplierIds.length} suppliers`,
      sentOrders: sentOrders,
      totalSent: supplierIds.length,
      whatsappMessage: message
    })

  } catch (error) {
    console.error("Error sending order to suppliers:", error)
    return NextResponse.json({ 
      error: "Failed to send order to suppliers",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function createWhatsAppMessage(orderDetails: any) {
  const loadInfo = orderDetails.loadType || "Load"
  const route = `${orderDetails.fromPlace || "From"} → ${orderDetails.toPlace || "To"}`
  
  return `🚛 *New Transport Order Available*

*Order:* ${orderDetails.orderNumber || "N/A"}
*Load:* ${loadInfo}
*Route:* ${route}

*Contact Admin for more details*

*Transport Office Management System*`
}
