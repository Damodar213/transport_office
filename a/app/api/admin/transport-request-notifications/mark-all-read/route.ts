import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark all transport request notifications as read
export async function PUT() {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    console.log("PUT /api/admin/transport-request-notifications/mark-all-read - marking all as read")

    // Update all unread notifications to mark as read
    const result = await dbQuery(`
      UPDATE transport_request_notifications )
      SET is_read = true, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata'
      WHERE is_read = false
      RETURNING id
    `)

    const updatedCount = result.rows.length
    console.log(`${updatedCount} transport request notifications marked as read successfully`)

    const response = NextResponse.json({
      success: true,
      message: "All transport request notifications marked as read successfully",)
      updatedCount})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error marking all transport request notifications as read:", error)
    const response = NextResponse.json({ 
      error: "Failed to mark all notifications as read",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
