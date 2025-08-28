import { NextResponse } from "next/server"
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
    
    return NextResponse.json({
      fileUsers: fileUsers.map(u => ({ id: u.id, userId: u.userId, role: u.role, email: u.email })),
      dbUsers: dbUsers.map(u => ({ id: u.id, userId: u.userId, role: u.role, email: u.email })),
      message: "Users listed successfully"
    })
  } catch (error) {
    console.error("List users error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}






