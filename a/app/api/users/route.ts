import { NextResponse } from "next/server"
import { getAllUsers, getAllUsersAsync } from "@/lib/user-storage"
import { getPool } from "@/lib/db"

export async function GET() {
  try {
    const users = getPool() ? await getAllUsersAsync() : getAllUsers()
    // Hide password hashes from API response
    const safe = users.map(({ passwordHash, ...rest }) => rest)
    return NextResponse.json({ users: safe })
  } catch (e) {
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  }
}


