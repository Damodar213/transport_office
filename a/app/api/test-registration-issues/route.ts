import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getPool, dbQuery } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
    }

    // Check Cloudflare environment variables
    const cloudflareConfig = {
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID ? "Set" : "Missing",
      CLOUDFLARE_ACCESS_KEY_ID: process.env.CLOUDFLARE_ACCESS_KEY_ID ? "Set" : "Missing",
      CLOUDFLARE_SECRET_ACCESS_KEY: process.env.CLOUDFLARE_SECRET_ACCESS_KEY ? "Set" : "Missing",
      CLOUDFLARE_R2_BUCKET_NAME: process.env.CLOUDFLARE_R2_BUCKET_NAME ? "Set" : "Missing",
      CLOUDFLARE_R2_PUBLIC_URL: process.env.CLOUDFLARE_R2_PUBLIC_URL ? "Set" : "Missing"
    }

    // Check if users table exists and has the right structure
    const usersTableCheck = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `)

    // Check if suppliers table exists and has the right structure
    const suppliersTableCheck = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'suppliers' 
      ORDER BY ordinal_position
    `)

    // Check recent users in database
    const recentUsers = await dbQuery(`
      SELECT user_id, role, name, created_at
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 5
    `)

    const response = NextResponse.json({
      success: true,
      cloudflareConfig,
      usersTableStructure: usersTableCheck.rows,
      suppliersTableStructure: suppliersTableCheck.rows,
      recentUsers: recentUsers.rows,
      message: "Registration issues diagnostic completed"
  } catch (error) {
    console.error("Registration issues test error:", error)
    const response = NextResponse.json({ 
      error: "Registration issues test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
  }
}


