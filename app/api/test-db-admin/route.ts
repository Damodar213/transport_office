import { NextResponse } from "next/server"
import { findUserByCredentialsAsync } from "@/lib/user-storage"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("Testing database admin user...")
    
    // Find the database admin user
    const dbAdmin = await findUserByCredentialsAsync("admin", "admin")
    console.log("Database admin found:", dbAdmin ? { id: dbAdmin.id, userId: dbAdmin.userId, role: dbAdmin.role, email: dbAdmin.email } : null)
    
    if (!dbAdmin) {
      return NextResponse.json({ error: "Database admin not found" }, { status: 404 })
    }
    
    // Test common passwords
    const testPasswords = ["admin123", "admin", "password", "123456", "admin@123", "Admin123"]
    const passwordResults = {}
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, dbAdmin.passwordHash)
      passwordResults[testPassword] = isValid
      console.log(`Password "${testPassword}": ${isValid}`)
    }
    
    return NextResponse.json({
      adminUser: {
        id: dbAdmin.id,
        userId: dbAdmin.userId,
        role: dbAdmin.role,
        email: dbAdmin.email
      },
      passwordResults,
      message: "Database admin test completed"
    })
  } catch (error) {
    console.error("Test database admin error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




