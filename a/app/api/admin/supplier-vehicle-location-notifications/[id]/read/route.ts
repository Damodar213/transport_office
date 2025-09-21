import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// PUT - Mark a supplier vehicle location notification as read
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

    // Update the notification to mark as read
    const result = await dbQuery(`
      UPDATE supplier_vehicle_location_notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Notification not found" 
      }, { status: 404 })
    return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      success: true,
      message: "Notification marked as read"
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error marking supplier notification as read:", error)
    const response = NextResponse.json({ 
      error: "Failed to mark notification as read",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

