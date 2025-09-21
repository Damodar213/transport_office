import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// DELETE - Delete a transport request notification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const { id } = await params

    // Delete the notification
    const result = await dbQuery(`
      DELETE FROM transport_request_notifications 
      WHERE id = $1 
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Notification not found" 
      }, { status: 404 })
    }

    const response = NextResponse.json({
      success: true,
      message: "Notification deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting notification:", error)
    const response = NextResponse.json({ 
      error: "Failed to delete notification",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


