import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function PUT(request: NextRequest) {
  try {
    console.log("Mark all buyer notifications as read API called")
    
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
    console.log("Marking all notifications as read for buyer:", buyerId)

    // Update all unread notifications for this buyer to read
    const result = await dbQuery(`UPDATE buyer_notifications 
)
       SET is_read = true, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata'
       WHERE buyer_id = $1 AND is_read = false`,
      [buyerId]
    )

    console.log("Marked notifications as read:", result.rows.length)

    const response = NextResponse.json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.rows.length


})
    })

  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    const response = NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
)
  }

