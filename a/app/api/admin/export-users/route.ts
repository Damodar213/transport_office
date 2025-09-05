import { NextResponse } from "next/server"
import { getAllUsersAsync } from "@/lib/user-storage"
import { getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    
    if (!getPool()) {
      console.log("Database not available, returning empty user export")
      return NextResponse.json({
        users: [],
        exportedAt: new Date().toISOString(),
        totalUsers: 0,
        message: "No users available (database not configured)"
      })
    }

    const users = await getAllUsersAsync()
    
    // Remove password hashes from export data
    const exportData = users.map(({ passwordHash, ...rest }) => rest)

    if (format === 'json') {
      return NextResponse.json({ 
        users: exportData,
        exportedAt: new Date().toISOString(),
        totalUsers: exportData.length
      })
    }

    // For other formats, return the data that can be processed on the client side
    return NextResponse.json({ 
      users: exportData,
      format,
      exportedAt: new Date().toISOString(),
      totalUsers: exportData.length
    })

  } catch (error) {
    console.error("Error exporting users:", error)
    return NextResponse.json({ 
      error: "Failed to export users",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

