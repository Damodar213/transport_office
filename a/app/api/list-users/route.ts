import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getAllUsers, getAllUsersAsync } from "@/lib/user-storage"

export async function GET() {
  try {
    console.log("Listing all users...")
    
    // Get users from file storage
    const fileUsers = getAllUsers()
    console.log("File users:", fileUsers.map(u => ({ id: u.id, userId: u.userId, role: u.role })))
    
    // Get users from database
    const dbUsers = await getAllUsersAsync()
    console.log("Database users:", dbUsers.map(u => ({ id: u.id, userId: u.userId, role: u.role })))
    
    const response = NextResponse.json({
      fileUsers: fileUsers.map(u => ({ id: u.id, userId: u.userId, role: u.role, email: u.email })
    return addCorsHeaders(response)),
      dbUsers: dbUsers.map(u => ({ id: u.id, userId: u.userId, role: u.role, email: u.email })),
      message: "Users listed successfully"
    })
  } catch (error) {
    console.error("List users error:", error)
    const response = NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
    return addCorsHeaders(response)
  }
}






