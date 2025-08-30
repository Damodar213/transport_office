import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch all transport request notifications
export async function GET() {
  try {
    console.log("GET /api/admin/transport-request-notifications - fetching notifications...")
    
    // Check database connection with retry logic
    let pool = getPool()
    if (!pool) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Test database connection first
    try {
      await pool.query('SELECT 1')
      console.log("Database connection test successful")
    } catch (dbError) {
      console.error("Database connection test failed:", dbError)
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
    }

    // Check if transport_request_notifications table exists, create if not
    let tableExists
    try {
      tableExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'transport_request_notifications'
        )
      `)
    } catch (tableCheckError) {
      console.error("Error checking table existence:", tableCheckError)
      return NextResponse.json({ error: "Database query failed" }, { status: 500 })
    }
    
    if (!tableExists.rows[0].exists) {
      try {
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
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata',
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata'
          )
        `)
        console.log("Created transport_request_notifications table")
      } catch (createTableError) {
        console.error("Error creating table:", createTableError)
        return NextResponse.json({ error: "Failed to create table" }, { status: 500 })
      }
    }

    // Fetch notifications with better error handling
    let result
    try {
      result = await dbQuery(`
        SELECT * FROM transport_request_notifications 
        ORDER BY created_at DESC 
        LIMIT 50
      `)
    } catch (fetchError) {
      console.error("Error fetching notifications from database:", fetchError)
      return NextResponse.json({ error: "Failed to fetch notifications from database" }, { status: 500 })
    }

    console.log(`Found ${result.rows.length} notifications in database`)

    const notifications = result.rows.map(row => {
      try {
        return {
          id: row.id.toString(),
          type: "info",
          title: "New Transport Request",
          message: `New transport request ${row.order_number} for ${row.load_type} has been created by buyer ${row.buyer_name}`,
          timestamp: formatTimestamp(row.created_at),
          isRead: row.is_read,
          category: "order",
          priority: "medium",
          orderNumber: row.order_number,
          loadType: row.load_type,
          buyerName: row.buyer_name,
          fromLocation: row.from_location,
          toLocation: row.to_location,
          estimatedTons: row.estimated_tons,
          numberOfGoods: row.number_of_goods,
          deliveryPlace: row.delivery_place,
          requiredDate: row.required_date,
          specialInstructions: row.special_instructions,
          status: row.status
        }
      } catch (mapError) {
        console.error("Error mapping notification row:", mapError, row)
        return null
      }
    }).filter(Boolean) // Remove any null entries

    console.log(`Returning ${notifications.length} notifications`)
    return NextResponse.json({ notifications })

  } catch (error) {
    console.error("Error fetching transport request notifications:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create a new transport request notification
export async function POST(request: Request) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const {
      order_number,
      load_type,
      buyer_name,
      buyer_id,
      from_location,
      to_location,
      estimated_tons,
      number_of_goods,
      delivery_place,
      required_date,
      special_instructions
    } = body

    // Validate required fields
    if (!order_number || !load_type || !buyer_name || !buyer_id || !from_location || !to_location || !delivery_place) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Check if notification already exists for this order
    const existingNotification = await dbQuery(`
      SELECT id FROM transport_request_notifications 
      WHERE order_number = $1
    `, [order_number])

    if (existingNotification.rows.length > 0) {
      return NextResponse.json({ 
        error: "Notification already exists for this order" 
      }, { status: 409 })
    }

    // Insert new notification with explicit timestamp in IST
    const result = await dbQuery(`
      INSERT INTO transport_request_notifications (
        order_number, load_type, buyer_name, buyer_id, from_location, to_location,
        estimated_tons, number_of_goods, delivery_place, required_date, special_instructions,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
      RETURNING id, created_at
    `, [
      order_number, load_type, buyer_name, buyer_id, from_location, to_location,
      estimated_tons, number_of_goods, delivery_place, required_date, special_instructions
    ])

    const newNotification = {
      id: result.rows[0].id.toString(),
      type: "info",
      title: "New Transport Request",
      message: `New transport request ${order_number} for ${load_type} has been created by buyer ${buyer_name}`,
      timestamp: formatTimestamp(result.rows[0].created_at),
      isRead: false,
      category: "order",
      priority: "medium"
    }

    console.log("Transport request notification created successfully:", newNotification.id)
    return NextResponse.json({ 
      message: "Notification created successfully",
      notification: newNotification
    }, { status: 201 })

  } catch (error) {
    console.error("Error creating transport request notification:", error)
    return NextResponse.json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

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
    
    // Convert to IST timezone for display
    const istTime = new Date(created.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
    
    // Format the date in IST
    const formattedDate = istTime.toLocaleString('en-US', {
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
    const nowIST = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}))
    const diffMs = nowIST.getTime() - istTime.getTime()
    
    // If it's very recent (within 1 minute), show "Just now"
    if (Math.abs(diffMs) < 60000) {
      return "Just now"
    }
    
    // If it's today, show relative time + actual time
    if (diffMs > 0 && diffMs < 24 * 60 * 60 * 1000) {
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      
      if (diffMins < 60) {
        return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago (${formattedDate})`
      } else {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago (${formattedDate})`
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
