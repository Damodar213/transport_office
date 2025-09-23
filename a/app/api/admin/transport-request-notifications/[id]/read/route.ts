import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark a transport request notification as read
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!getPool()) {
      return NextResponse.json({ success: true, message: "Notification marked as read (mock)" })
    }

    const id = params.id
    const numericId = parseInt(id as string, 10)
    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ success: true, message: "Invalid id, treated as read" })
    }
    console.log(`PUT /api/admin/transport-request-notifications/${id}/read - marking as read`)

    // Ensure table exists then update
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS transport_request_notifications (
        id SERIAL PRIMARY KEY,
        buyer_id VARCHAR(50),
        title TEXT,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Update the notification to mark it as read
    const result = await dbQuery(`
      UPDATE transport_request_notifications 
      SET is_read = true
      WHERE id = $1 
      RETURNING id, is_read
    `, [numericId])

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


