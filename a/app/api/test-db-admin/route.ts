import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { findUserByCredentialsAsync } from "@/lib/user-storage"
import bcrypt from "bcryptjs"

export async function GET() {
  try {
    console.log("Testing database admin user...")
    
    // Find the database admin user
    const dbAdmin = await findUserByCredentialsAsync("admin", "admin")
    console.log("Database admin found:", dbAdmin ? { id: dbAdmin.id, userId: dbAdmin.userId, role: dbAdmin.role, email: dbAdmin.email } : null)
    
    if (!dbAdmin) {
      const response = NextResponse.json({ error: "Database admin not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    
    // Test common passwords
    const testPasswords = ["admin123", "admin", "password", "123456", "admin@123", "Admin123"]
    const passwordResults: any = {}
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, dbAdmin.passwordHash)
      passwordResults[testPassword] = isValid
      console.log(`Password "${testPassword}": ${isValid}`)
    }
    
    const response = NextResponse.json({
      adminUser: {
        id: dbAdmin.id,
        userId: dbAdmin.userId,
        role: dbAdmin.role,
        email: dbAdmin.email
      },
      passwordResults,
      message: "Database admin test completed"
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  } catch (error) {
    console.error("Test database admin error:", error)
    const response = NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}






