import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

function formatTimestamp(timestamp: string | Date): string {
  try {
    // Parse the timestamp and ensure it's treated as IST
    let created: Date
    
    if (typeof timestamp === 'string') {
      // If it's a string, parse it and assume it's in IST
      created = new Date(timestamp)
    } else {
      created = timestamp
    }
    
    // Check if timestamp is valid
    if (isNaN(created.getTime())) {
      console.error("Invalid timestamp:", timestamp)
      return "Invalid time"
    }
    
    // Format the date in IST (don't double-convert)
    const formattedDate = created.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
    
    // Calculate relative time using current IST time
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    
    // If it's very recent (within 1 minute), show "Just now"
    if (Math.abs(diffMs) < 60000) {
      return "Just now"
    }
    
    // If it's within 24 hours (past or future), show relative time + actual time
    if (Math.abs(diffMs) < 24 * 60 * 60 * 1000) {
      const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60))
      const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
      
      if (diffMins < 60) {
        const timeText = diffMs > 0 ? `${diffMins} minute${diffMins === 1 ? '' : 's'} ago` : `in ${diffMins} minute${diffMins === 1 ? '' : 's'}`
        return `${timeText} (${formattedDate})`
      } else {
        const timeText = diffMs > 0 ? `${diffHours} hour${diffHours === 1 ? '' : 's'} ago` : `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`
        return `${timeText} (${formattedDate})`
      }
    }
    
    // For older notifications, show the full date and time
    return formattedDate
    
  } catch (error) {
    console.error("Error formatting timestamp:", error)
    // Fallback: show the raw timestamp in IST
    try {
      const fallbackDate = new Date(timestamp)
      return fallbackDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    } catch {
      return "Time unavailable"
    }
  }
}

// GET - Fetch all transport request notifications (buyer orders)
export async function GET() {
  try {
    if (!getPool()) {
    }

    console.log("Fetching transport request notifications...")

    // Check if table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transport_request_notifications'
      )
    `)

    if (!tableExists.rows[0].exists) {
      console.log("transport_request_notifications table does not exist")
    }

    // Fetch notifications from the database
    const result = await dbQuery(`
      SELECT 
        id,
        order_number,
        load_type,
        buyer_name,
        buyer_id,
        from_location,
        to_location,
        estimated_tons,
        is_read,
        created_at
      FROM transport_request_notifications
      ORDER BY id DESC
    `)

    console.log(`Found ${result.rows.length} transport request notifications`)

    const notifications = result.rows.map(row => ({
      id: row.id.toString(),
      type: "info",
      title: "New Buyer Order Submitted",
      message: `New transport order ${row.order_number} submitted by ${row.buyer_name} (${row.buyer_id}). Load: ${row.load_type}, From: ${row.from_location} → ${row.to_location}${row.estimated_tons ? `, ${row.estimated_tons} tons` : ''}`,
      timestamp: formatTimestamp(row.created_at),
      isRead: row.is_read || false,
      category: "order",
      priority: "high",
      orderId: row.id,
      buyerId: row.buyer_id,
      status: "pending"
    }))

  } catch (error) {
    console.error("Error fetching transport request notifications:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}

// POST - Create a new transport request notification
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    if (!getPool()) {
    }

    const body = await request.json()
    const {
      type,
      title,
      message,
      category,
      priority,
      orderId,
      buyerId,
      status
    } = body

    // Validate required fields
    if (!type || !title || !message || !category || !priority) {
      const response = NextResponse.json({ 
        error: "Missing required fields: type, title, message, category, priority" 
    }

    console.log("Creating transport request notification:", { type, title, category, priority })

    // Check if table exists, create if not
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'transport_request_notifications'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      await dbQuery(`
        CREATE TABLE transport_request_notifications (
          id SERIAL PRIMARY KEY,
          order_number VARCHAR(50) NOT NULL,
          load_type VARCHAR(100) NOT NULL,
          buyer_name VARCHAR(100) NOT NULL,
          buyer_id VARCHAR(50) NOT NULL,
          from_location VARCHAR(255) NOT NULL,
          to_location VARCHAR(255) NOT NULL,
          estimated_tons DECIMAL(10,2),
          number_of_goods INTEGER,
          delivery_place VARCHAR(255),
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() AT TIME ZONE 'Asia/Kolkata')
        )
      `)
      console.log("Created transport_request_notifications table")
    } else {
      // Check if the table has the required columns and add them if missing
      try {
        await dbQuery(`
          ALTER TABLE transport_request_notifications 
          ADD COLUMN IF NOT EXISTS to_location VARCHAR(255) DEFAULT 'Unknown'
        `)
        await dbQuery(`
          ALTER TABLE transport_request_notifications 
          ADD COLUMN IF NOT EXISTS estimated_tons DECIMAL(10,2)
        `)
        await dbQuery(`
          ALTER TABLE transport_request_notifications 
          ADD COLUMN IF NOT EXISTS number_of_goods INTEGER
        `)
        await dbQuery(`
          ALTER TABLE transport_request_notifications 
          ADD COLUMN IF NOT EXISTS delivery_place VARCHAR(255)
        `)
        await dbQuery(`
          ALTER TABLE transport_request_notifications 
          ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE
        `)
        console.log("Updated transport_request_notifications table with missing columns")
      } catch (alterError) {
        console.log("Table already has required columns or alter failed:", alterError)
      }
    }

    // Extract order number from the message (it's already in the correct format)
    let orderNumber = "Unknown"
    if (message.includes("transport order")) {
      const orderMatch = message.match(/transport order\s+([A-Z0-9-]+)/)
      orderNumber = orderMatch ? orderMatch[1].trim() : "Unknown"
    }
    
    // Parse load type from message
    let loadType = "Unknown"
    if (message.includes("Load:")) {
      const loadMatch = message.match(/Load:\s*([^,]+)/)
      loadType = loadMatch ? loadMatch[1].trim() : "Unknown"
    }
    
    // Parse buyer name from message
    let buyerName = "Unknown"
    if (message.includes("submitted by")) {
      const buyerMatch = message.match(/submitted by\s*([^(]+)/)
      buyerName = buyerMatch ? buyerMatch[1].trim() : "Unknown"
    }
    
    // Parse from location from message
    let fromLocation = "Unknown"
    if (message.includes("Route:")) {
      const routeMatch = message.match(/Route:\s*([^→]+)/)
      fromLocation = routeMatch ? routeMatch[1].trim() : "Unknown"
    }

    // Parse to location from message
    let toLocation = "Unknown"
    if (message.includes("→")) {
      const toMatch = message.match(/→\s*([^,]+)/)
      toLocation = toMatch ? toMatch[1].trim() : "Unknown"
    }
    
    // Parse estimated tons from message
    let estimatedTons = null
    if (message.includes("tons")) {
      const tonsMatch = message.match(/(\d+\.?\d*)\s*tons/)
      estimatedTons = tonsMatch ? parseFloat(tonsMatch[1]) : null
    }
    
    // Parse number of goods from message (if available)
    let numberOfGoods = null
    if (message.includes("goods")) {
      const goodsMatch = message.match(/(\d+)\s*goods/)
      numberOfGoods = goodsMatch ? parseInt(goodsMatch[1]) : null
    }
    
    // Parse delivery place from message (if available)
    let deliveryPlace = "Unknown"
    if (message.includes("Delivery:")) {
      const deliveryMatch = message.match(/Delivery:\s*([^,]+)/)
      deliveryPlace = deliveryMatch ? deliveryMatch[1].trim() : "Unknown"
    }

    // Insert the notification into the database with current IST time
    console.log("✅ Buyer order notification received:", {
      orderNumber, loadType, buyerName, buyerId, fromLocation, toLocation, estimatedTons, numberOfGoods, deliveryPlace
    })

    const insertResult = await dbQuery(`
      INSERT INTO transport_request_notifications (
        order_number, load_type, buyer_name, buyer_id, from_location, to_location, estimated_tons, number_of_goods, delivery_place, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() AT TIME ZONE 'Asia/Kolkata')
      RETURNING *
    `, [orderNumber, loadType, buyerName, buyerId, fromLocation, toLocation, estimatedTons, numberOfGoods, deliveryPlace, false])

    const newNotification = insertResult.rows[0]

    console.log("✅ Transport request notification created successfully:", newNotification.id)

    const response = NextResponse.json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification
  } catch (error) {
    console.error("Error creating transport request notification:", error)
    const response = NextResponse.json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}

