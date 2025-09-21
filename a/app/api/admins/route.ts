import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getAllAdmins } from "@/lib/admin-storage"

export async function GET() {
  try {
    const admins = await getAllAdmins()
    // Hide password hashes from API response
    const safe = admins.map(({ passwordHash, ...rest }) => rest)
    const response = NextResponse.json({ admins: safe })
    return addCorsHeaders(response)
  } catch (e) {
    const response = NextResponse.json({ error: "Failed to load admins" }, { status: 500 })
    return addCorsHeaders(response)
  }
}










