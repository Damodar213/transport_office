import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

// Format timestamp function with proper IST handling
function formatTimestamp(timestamp: string | Date): string {
  try {
    // Parse the timestamp
    let created: Date
    
    if (typeof timestamp === 'string') {
      created = new Date(timestamp)
} else {
      created = timestamp
    }

    // Check if timestamp is valid
    if (isNaN(created.getTime())) {
      console.error("Invalid timestamp:", timestamp)
      return "Invalid time"
    }

    // Get current time
    const now = new Date()
    
    // Format the date in IST
    const formattedDate = created.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'


})
    })
    
    // Calculate relative time using UTC timestamps (more reliable)
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
      })
    } catch (fallbackError) {
      return "Invalid time"
  }
export async function GET(request: NextRequest) {
  try {
    console.log("Buyer notifications API called")
    
    if (!getPool()) {
      console.log("Database not available")
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Verify the user is authenticated and is a buyer
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'buyer') {
      const response = NextResponse.json({ error: "Access denied - buyer role required" }, { status: 403 })
    }

    const buyerId = session.userIdString
    console.log("Buyer ID:", buyerId)

    // Get notifications for this buyer from buyer_notifications table
    const notifications = await dbQuery(`
      SELECT 
        id,
        buyer_id,
        type,
        title,
        message,
        category,
        priority,
        is_read,
        order_id,
        created_at,
        updated_at
      FROM buyer_notifications
      WHERE buyer_id = $1
      ORDER BY created_at DESC
      LIMIT 50)
    `, [buyerId])

    console.log("Found buyer notifications:", notifications.rows.length)

    // Format the notifications with timestamp
    const formattedNotifications = notifications.rows.map(notification => ({)
      id: notification.id.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: formatTimestamp(notification.created_at),
      isRead: notification.is_read,
      category: notification.category,
      priority: notification.priority,
      orderId: notification.order_id


}
    }))

    const response = NextResponse.json({
      success: true,
      notifications: formattedNotifications


})
    })

  } catch (error) {
    console.error("Error fetching buyer notifications:", error)
    const response = NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
)
    )
  }
