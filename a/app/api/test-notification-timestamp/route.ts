import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST() {
  try {
    console.log("Test notification timestamp API called")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Create a test notification with current timestamp
    const testNotification = await dbQuery(
      `INSERT INTO notifications (
        type,
        title,
        message,
        category,
        priority,
        is_read,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, false, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
      RETURNING *`,
      [
        "info",
        "🧪 Test Notification - Manual Order Confirmed",
        "This is a test notification to verify timestamp functionality. Order MO-TEST has been confirmed by supplier Test Company.\n\n📋 Order Details:\n• Load Type: Manual Order\n• Driver: Test Driver (1234567890)\n• Vehicle: TEST-1234\n• Supplier: Test Company\n\n✅ Order is now ready for admin review and will be handled by admin.",
        "order_management",
        "high"
      ]
    )
    
    console.log("Test notification created:", testNotification.rows[0])

    // Fetch the notification back to check the timestamp
    const fetchedNotification = await dbQuery(
      "SELECT * FROM notifications WHERE id = $1",
      [testNotification.rows[0].id]
    )
    
    console.log("Fetched notification:", fetchedNotification.rows[0])

    // Test timestamp formatting
    const timestamp = fetchedNotification.rows[0].created_at
    console.log("Raw timestamp:", timestamp)
    console.log("Timestamp type:", typeof timestamp)
    
    const formattedDate = new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
    console.log("Formatted timestamp:", formattedDate)

    return NextResponse.json({
      success: true,
      message: "Test notification created successfully",
      notification: testNotification.rows[0],
      fetchedNotification: fetchedNotification.rows[0],
      timestampTest: {
        raw: timestamp,
        type: typeof timestamp,
        formatted: formattedDate
      }
    })

  } catch (error) {
    console.error("Error creating test notification:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
