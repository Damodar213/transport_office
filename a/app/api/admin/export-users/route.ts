import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getAllUsersAsync } from "@/lib/user-storage"
import { getPool } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'excel'
    
    if (!getPool()) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
    }

    const users = await getAllUsersAsync()
    
    // Remove password hashes from export data
    const exportData = users.map(({ passwordHash, ...rest }) => rest)

    if (format === 'json') {
      const response = NextResponse.json({ 
        users: exportData,
        exportedAt: new Date().toISOString(),
        totalUsers: exportData.length
      })
      return addCorsHeaders(response)
    }

    // For other formats, return the data that can be processed on the client side
    const response = NextResponse.json({ 
      users: exportData,
      format,
      exportedAt: new Date().toISOString(),
      totalUsers: exportData.length
    })

  } catch (error) {
    console.error("Error exporting users:", error)
    const response = NextResponse.json({ 
      error: "Failed to export users",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

