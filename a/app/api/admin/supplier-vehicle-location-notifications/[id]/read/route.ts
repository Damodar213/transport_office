import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark a supplier vehicle location notification as read
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ [key: string]: string }> }
) {
  try {
    if (!getPool()) {
      return NextResponse.json({ success: true, message: "Notification marked as read (mock)" })
    }

    const { id } = await params
    const numericId = parseInt(id as string, 10)
    if (!Number.isFinite(numericId)) {
      return NextResponse.json({ success: true, message: "Invalid id, treated as read" })
    }

    // Update the notification to mark as read
    // Ensure table exists gracefully
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS supplier_vehicle_location_notifications (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(50),
        title TEXT,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const result = await dbQuery(`
      UPDATE supplier_vehicle_location_notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `, [numericId])

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
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

