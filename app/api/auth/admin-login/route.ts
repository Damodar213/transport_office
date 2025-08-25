import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { findAdminByCredentials } from "@/lib/admin-storage"

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json({ error: "Missing userId or password" }, { status: 400 })
    }

    // Find admin by userId
    const admin = await findAdminByCredentials(userId)
    if (!admin) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 })
    }

    // Return admin info (without password)
    const { passwordHash, ...adminInfo } = admin
    return NextResponse.json({
      message: "Admin login successful",
      admin: adminInfo
    })

  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}






