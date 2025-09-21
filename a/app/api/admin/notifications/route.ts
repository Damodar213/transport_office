import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// Format timestamp function (same as supplier notifications)
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

// Mock notifications data (fallback if database is empty)
const mockNotifications = [
  {
    id: "1",
    type: "info",
    title: "New Transport Request",
    message: "New transport request ORD-7 for Cotton has been created by buyer arun",
    timestamp: "5 hours ago",
    isRead: false,
    category: "order",
    priority: "medium"
  },
  {
    id: "2",
    type: "success",
    title: "Order Sent to Buyer",
    message: "Order ORD-6 has been successfully sent to buyer. Driver: arunkkkk (8618699559), Vehicle: KA63k251. The buyer will receive a notification and can track the order in their dashboard.",
    timestamp: "2 minutes ago",
    isRead: false,
    category: "order",
    priority: "medium"
  },
  {
    id: "3",
    type: "success",
    title: "Order Sent to Buyer",
    message: "Order ORD-10 has been successfully sent to buyer. Driver: arunkkkk (8618699559), Vehicle: KA63k251. The buyer will receive a notification and can track the order in their dashboard.",
    timestamp: "5 minutes ago",
    isRead: false,
    category: "order",
    priority: "medium"
  },
  {
    id: "4",
    type: "info",
    title: "New User Registration",
    message: "New supplier 'Kumar Transport Co.' has registered",
    timestamp: "1 hour ago",
    isRead: true,
    category: "user",
    priority: "low"
  },
  {
    id: "5",
    type: "error",
    title: "System Alert",
    message: "Database connection timeout detected, investigating...",
    timestamp: "2 hours ago",
    isRead: false,
    category: "system",
    priority: "high"
  }
]

export async function GET() {
  try {
    console.log("GET /api/admin/notifications - fetching notifications...")
    
    // In a real application, you would fetch notifications from the database
    // For now, we'll return mock data
    let notifications = [...mockNotifications]
    
    // If database is available, try to fetch real notifications
    if (getPool()) {
      try {
        // Check if notifications table exists
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications'
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
              priority
            FROM notifications 
            ORDER BY created_at DESC 
            LIMIT 50
          `)
          
          if (result.rows.length > 0) {
            notifications = result.rows.map(row => ({
              id: row.id,
              type: row.type,
              title: row.title,
              message: row.message,
              timestamp: formatTimestamp(row.created_at),
              isRead: row.is_read,
              category: row.category,
              priority: row.priority
            }))
          }
        } else {
          console.log("Notifications table doesn't exist, using mock data")
        }
      } catch (error) {
        console.error("Error fetching notifications from database:", error)
        console.log("Falling back to mock notifications")
      }
    }
    
    console.log(`Returning ${notifications.length} notifications`)
  } catch (error) {
    console.error("Error in notifications API:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const body = await request.json()
    const { type, title, message, category, priority } = body
    
    if (!type || !title || !message || !category || !priority) {
      const response = NextResponse.json({ 
        error: "Missing required fields: type, title, message, category, priority" 
    }
    
    console.log("POST /api/admin/notifications - creating notification:", { type, title, category, priority })
    
    // In a real application, you would save to the database
    if (getPool()) {
      try {
        // Check if notifications table exists, create if not
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'notifications'
          )
        `)
        
        if (!tableExists.rows[0].exists) {
          await dbQuery(`
            CREATE TABLE notifications (
              id SERIAL PRIMARY KEY,
              type VARCHAR(20) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              category VARCHAR(50) NOT NULL,
              priority VARCHAR(20) NOT NULL,
              is_read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata',
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata'
            )
          `)
          console.log("Created notifications table")
        }
        
        // Insert new notification
        const result = await dbQuery(`
          INSERT INTO notifications (type, title, message, category, priority, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
          RETURNING id, created_at
        `, [type, title, message, category, priority])
        
        const newNotification = {
          id: result.rows[0].id.toString(),
          type,
          title,
          message,
          timestamp: formatTimestamp(result.rows[0].created_at),
          isRead: false,
          category,
          priority
        }
        
        console.log("Notification created successfully:", newNotification.id)
        const response = NextResponse.json({ 
          message: "Notification created successfully",
          notification: newNotification
      } catch (error) {
        console.error("Error creating notification in database:", error)
        const response = NextResponse.json({ 
          error: "Failed to create notification in database",
          details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
      }
    }
    
    // Fallback response if database is not available
    const response = NextResponse.json({ 
      message: "Notification created successfully (mock mode)",
      notification: {
        id: Date.now().toString(),
        type,
        title,
        message,
        timestamp: "Just now",
        isRead: false,
        category,
        priority
      }
  } catch (error) {
    console.error("Error creating notification:", error)
    const response = NextResponse.json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}






