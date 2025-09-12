import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark a transport request notification as read
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const id = params.id
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
      return NextResponse.json({ 
        error: "Notification not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notification: {
        id: result.rows[0].id,
        isRead: result.rows[0].is_read
      }
    })

  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json({ 
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}


