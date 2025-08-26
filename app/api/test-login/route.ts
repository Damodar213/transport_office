import { NextResponse } from "next/server"
import { findUserByCredentials, findUserByCredentialsAsync } from "@/lib/user-storage"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    // Test file-based user storage
    const adminUser = findUserByCredentials("admin", "admin")
    console.log("File-based admin user:", adminUser)
    
    // Test async user storage
    const adminUserAsync = await findUserByCredentialsAsync("admin", "admin")
    console.log("Async admin user:", adminUserAsync)
    
    // Test password verification
    let passwordValid = false
    if (adminUser) {
      passwordValid = await bcrypt.compare("admin123", adminUser.passwordHash)
      console.log("Password valid:", passwordValid)
    }
    
    return NextResponse.json({
      fileBasedUser: adminUser ? { id: adminUser.id, userId: adminUser.userId, role: adminUser.role } : null,
      asyncUser: adminUserAsync ? { id: adminUserAsync.id, userId: adminUserAsync.userId, role: adminUserAsync.role } : null,
      passwordValid,
      message: "Test completed"
    })
  } catch (error) {
    console.error("Test error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




