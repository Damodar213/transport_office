import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// Mock notifications data for suppliers
const mockSupplierNotifications = [
  {
    id: "1",
    type: "success",
    title: "Order Confirmed",
    message: "Transport order #123 has been confirmed by admin. Please prepare for pickup.",
    timestamp: "2 minutes ago",
    isRead: false,
    category: "order",
    priority: "high",
    orderId: "123"
  },
  {
    id: "2",
    type: "warning",
    title: "Driver License Expiring",
    message: "Driver John Doe's license expires in 15 days. Please renew soon.",
    timestamp: "1 hour ago",
    isRead: false,
    category: "driver",
    priority: "medium",
    driverId: "driver_001"
  },
  {
    id: "3",
    type: "info",
    title: "Vehicle Maintenance Due",
    message: "Truck KA-01-AB-1234 is due for maintenance in 3 days.",
    timestamp: "3 hours ago",
    isRead: true,
    category: "vehicle",
    priority: "low",
    vehicleId: "truck_001"
  },
  {
    id: "4",
    type: "success",
    title: "Payment Received",
    message: "Payment of ₹2,500 received for order #120. Thank you!",
    timestamp: "1 day ago",
    isRead: true,
    category: "payment",
    priority: "medium",
    orderId: "120"
  },
  {
    id: "5",
    type: "error",
    title: "Order Rejected",
    message: "Transport order #125 was rejected due to incomplete documentation.",
    timestamp: "2 days ago",
    isRead: false,
    category: "order",
    priority: "high",
    orderId: "125"
  }
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")
    
    console.log("GET /api/supplier/notifications - fetching notifications for supplier:", supplierId)
    
    if (!supplierId) {
      return NextResponse.json({ 
        error: "Supplier ID is required" 
      }, { status: 400 })
    }
    
    // In a real application, you would fetch notifications from the database
    // For now, we'll return mock data
    let notifications = [...mockSupplierNotifications]
    
    // If database is available, try to fetch real notifications
    if (getPool()) {
      try {
        // Check if supplier_notifications table exists
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'supplier_notifications'
          )
        `)
        
        if (tableExists.rows[0].exists) {
          const result = await dbQuery(`
            SELECT 
              id::text,
              type,
              title,
              message,
              created_at,
              is_read,
              category,
              priority,
              order_id,
              driver_id,
              vehicle_id
            FROM supplier_notifications 
            WHERE supplier_id = $1
            ORDER BY created_at DESC 
            LIMIT 50
          `, [supplierId])
          
          if (result.rows.length > 0) {
            notifications = result.rows.map(row => {
              return {
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                timestamp: formatTimestamp(row.created_at),
                isRead: row.is_read,
                category: row.category,
                priority: row.priority,
                orderId: row.order_id,
                driverId: row.driver_id,
                vehicleId: row.vehicle_id
              }
            })
          }
        } else {
          console.log("Supplier notifications table doesn't exist, using mock data")
        }
      } catch (error) {
        console.error("Error fetching notifications from database:", error)
        console.log("Falling back to mock notifications")
      }
    }
    
    console.log(`Returning ${notifications.length} notifications for supplier ${supplierId}`)
    return NextResponse.json({ notifications })
    
  } catch (error) {
    console.error("Error in supplier notifications API:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, message, category, priority, supplierId, orderId, driverId, vehicleId } = body
    
    if (!type || !title || !message || !category || !priority || !supplierId) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, message, category, priority, supplierId" 
      }, { status: 400 })
    }
    
    console.log("POST /api/supplier/notifications - creating notification:", { type, title, category, priority, supplierId })
    
    // In a real application, you would save to the database
    if (getPool()) {
      try {
        // Check if supplier_notifications table exists, create if not
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'supplier_notifications'
          )
        `)
        
        if (!tableExists.rows[0].exists) {
          await dbQuery(`
            CREATE TABLE supplier_notifications (
              id SERIAL PRIMARY KEY,
              supplier_id VARCHAR(50) NOT NULL,
              type VARCHAR(20) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              category VARCHAR(50) NOT NULL,
              priority VARCHAR(20) NOT NULL,
              is_read BOOLEAN DEFAULT FALSE,
              order_id VARCHAR(50),
              driver_id VARCHAR(50),
              vehicle_id VARCHAR(50),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata',
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata'
            )
          `)
          console.log("Created supplier_notifications table")
        }
        
        // Insert new notification
        const result = await dbQuery(`
          INSERT INTO supplier_notifications (supplier_id, type, title, message, category, priority, order_id, driver_id, vehicle_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
          RETURNING id, created_at
        `, [supplierId, type, title, message, category, priority, orderId, driverId, vehicleId])
        
        // For new notifications, always show current Indian time
        const now = new Date()
        const currentIndianTime = now.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
        
        const newNotification = {
          id: result.rows[0].id.toString(),
          type,
          title,
          message,
          timestamp: currentIndianTime,
          isRead: false,
          category,
          priority,
          orderId,
          driverId,
          vehicleId
        }
        
        console.log("Supplier notification created successfully:", newNotification.id)
        return NextResponse.json({ 
          message: "Notification created successfully",
          notification: newNotification
        })
        
      } catch (error) {
        console.error("Error creating notification in database:", error)
        return NextResponse.json({ 
          error: "Failed to create notification in database",
          details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
      }
    }
    
    // Fallback response if database is not available
    const currentIndianTime = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    
    return NextResponse.json({ 
      message: "Notification created successfully (mock mode)",
      notification: {
        id: Date.now().toString(),
        type,
        title,
        message,
        timestamp: currentIndianTime,
        isRead: false,
        category,
        priority,
        orderId,
        driverId,
        vehicleId
      }
    })
    
  } catch (error) {
    console.error("Error creating supplier notification:", error)
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





