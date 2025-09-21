import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getAllAdmins } from "@/lib/admin-storage"

export async function GET() {
  try {
    const admins = await getAllAdmins()
    // Hide password hashes from API response
    const safe = admins.map(({ passwordHash, ...rest }) => rest)
  } catch (e) {
  }
