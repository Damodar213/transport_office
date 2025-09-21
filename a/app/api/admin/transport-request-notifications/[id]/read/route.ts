import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark a transport request notification as read
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
    }

    const { id } = await params
    console.log(`PUT /api/admin/transport-request-notifications/${id}/read - marking as read`)

    // Update the notification to mark it as read
    const result = await dbQuery(`
      UPDATE transport_request_notifications 
      SET is_read = true, updated_at = NOW() AT TIME ZONE 'Asia/Kolkata'
      WHERE id = $1 
      RETURNING id, is_read
    `, [id])

    console.log(`Update result:`, result.rows)

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Notification not found" 
      }, { status: 404 })
    return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notification: {
        id: result.rows[0].id,
        isRead: result.rows[0].is_read
      }
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error marking notification as read:", error)
    const response = NextResponse.json({ 
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}


