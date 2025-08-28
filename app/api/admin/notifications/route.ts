import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// Mock notifications data (in a real app, this would come from a notifications table)
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
    title: "Order Confirmed",
    message: "Transport order #123 has been successfully confirmed by supplier",
    timestamp: "2 minutes ago",
    isRead: false,
    category: "order",
    priority: "high"
  },
  {
    id: "3",
    type: "warning",
    title: "Document Review Required",
    message: "5 supplier documents are pending review and approval",
    timestamp: "15 minutes ago",
    isRead: false,
    category: "document",
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
    return NextResponse.json({ notifications })
    
  } catch (error) {
    console.error("Error in notifications API:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, message, category, priority } = body
    
    if (!type || !title || !message || !category || !priority) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, message, category, priority" 
      }, { status: 400 })
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
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
          console.log("Created notifications table")
        }
        
        // Insert new notification
        const result = await dbQuery(`
          INSERT INTO notifications (type, title, message, category, priority)
          VALUES ($1, $2, $3, $4, $5)
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
    return NextResponse.json({ 
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
    })
    
  } catch (error) {
    console.error("Error creating notification:", error)
    return NextResponse.json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

function formatTimestamp(timestamp: string | Date): string {
  const now = new Date()
  const created = new Date(timestamp)
  const diffMs = now.getTime() - created.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffMins < 60) {
    return `${diffMins} minutes ago`
  } else if (diffHours < 24) {
    return `${diffHours} hours ago`
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return created.toLocaleDateString()
  }
}





