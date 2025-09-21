import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark a supplier vehicle location notification as read
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const id = params.id

    // Update the notification to mark as read
    const result = await dbQuery(`
      UPDATE supplier_vehicle_location_notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Notification not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read"
    })

  } catch (error) {
    console.error("Error marking supplier notification as read:", error)
    return NextResponse.json({ 
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}

