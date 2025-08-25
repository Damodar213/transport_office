import { NextResponse } from "next/server"
import { getAllAdmins } from "@/lib/admin-storage"

export async function GET() {
  try {
    const admins = await getAllAdmins()
    // Hide password hashes from API response
    const safe = admins.map(({ passwordHash, ...rest }) => rest)
    return NextResponse.json({ admins: safe })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load admins" }, { status: 500 })
  }
}






