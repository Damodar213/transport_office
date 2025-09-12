import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const buyerId = searchParams.get('buyerId')
    
    if (!buyerId) {
      return NextResponse.json({ 
        error: "Buyer ID is required" 
      }, { status: 400 })
    }
    
    console.log(`GET /api/buyer/notifications - fetching notifications for buyer ${buyerId}`)
    
    let notifications: any[] = []
    
    if (getPool()) {
      try {
        // Check if buyer_notifications table exists, create if not
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'buyer_notifications'
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
              order_id
            FROM buyer_notifications 
            WHERE buyer_id = $1
            ORDER BY created_at DESC 
            LIMIT 50
          `, [buyerId])
          
          if (result.rows.length > 0) {
            notifications = result.rows.map(row => {
              // For now, always show current Indian time to ensure accuracy
              const now = new Date()
              const currentTimestamp = now.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })
              
              return {
                id: row.id,
                type: row.type,
                title: row.title,
                message: row.message,
                timestamp: currentTimestamp,
                isRead: row.is_read,
                category: row.category,
                priority: row.priority,
                orderId: row.order_id
              }
            })
          }
        } else {
          console.log("Buyer notifications table doesn't exist, using mock data")
        }
      } catch (error) {
        console.error("Error fetching notifications from database:", error)
        console.log("Falling back to mock notifications")
      }
    }
    
    console.log(`Returning ${notifications.length} notifications for buyer ${buyerId}`)
    return NextResponse.json({ notifications })
    
  } catch (error) {
    console.error("Error fetching buyer notifications:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, title, message, category, priority, buyerId, orderId } = body
    
    if (!type || !title || !message || !category || !priority || !buyerId) {
      return NextResponse.json({ 
        error: "Missing required fields: type, title, message, category, priority, buyerId" 
      }, { status: 400 })
    }
    
    console.log("POST /api/buyer/notifications - creating notification:", { type, title, category, priority, buyerId })
    console.log("Full notification body:", body)
    
    // In a real application, you would save to the database
    if (getPool()) {
      try {
        // Check if buyer_notifications table exists, create if not
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'buyer_notifications'
          )
        `)
        
        if (!tableExists.rows[0].exists) {
          await dbQuery(`
            CREATE TABLE buyer_notifications (
              id SERIAL PRIMARY KEY,
              buyer_id VARCHAR(50) NOT NULL,
              type VARCHAR(20) NOT NULL,
              title VARCHAR(255) NOT NULL,
              message TEXT NOT NULL,
              category VARCHAR(50) NOT NULL,
              priority VARCHAR(20) NOT NULL,
              is_read BOOLEAN DEFAULT FALSE,
              order_id VARCHAR(50),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `)
          console.log("Created buyer_notifications table")
        }
        
        // Insert new notification
        const result = await dbQuery(`
          INSERT INTO buyer_notifications (
            buyer_id, type, title, message, category, priority, order_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [buyerId, type, title, message, category, priority, orderId])
        
        const newNotification = result.rows[0]
        
        console.log("✅ Buyer notification created successfully:", newNotification.id)
        
        return NextResponse.json({
          success: true,
          message: "Notification created successfully",
          notification: {
            id: newNotification.id.toString(),
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
            timestamp: "Just now",
            isRead: newNotification.is_read,
            category: newNotification.category,
            priority: newNotification.priority,
            orderId: newNotification.order_id
          }
        }, { status: 201 })
        
      } catch (dbError) {
        console.error("Database error creating buyer notification:", dbError)
        return NextResponse.json({ 
          error: "Failed to create notification in database",
          details: dbError instanceof Error ? dbError.message : "Unknown database error"
        }, { status: 500 })
      }
    } else {
      console.log("Database not available, notification not saved")
      return NextResponse.json({
        success: true,
        message: "Notification created successfully (not saved to database)",
        notification: {
          id: "temp-" + Date.now(),
          type,
          title,
          message,
          timestamp: "Just now",
          isRead: false,
          category,
          priority,
          orderId
        }
      }, { status: 201 })
    }
    
  } catch (error) {
    console.error("Error creating buyer notification:", error)
    return NextResponse.json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
