import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getAllUsers, getAllUsersAsync } from "@/lib/user-storage"
import { getPool, dbQuery } from "@/lib/db"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const users = getPool() ? await getAllUsersAsync() : getAllUsers()
    // Hide password hashes from API response
    const safe = users.map(({ passwordHash, ...rest }) => rest)
    const response = NextResponse.json({ users: safe })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  } catch (e) {
    const response = NextResponse.json({ error: "Failed to load users" }, { status: 500 })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

// PUT - Update user status (admin only)
export async function PUT(request: Request) {
  try {
    // Check if user is authenticated and is admin
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    if (session.role !== 'admin') {
      const response = NextResponse.json({ error: "Access denied - admin role required" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const { userId, isActive, isVerified } = body

    if (!userId) {
      const response = NextResponse.json({ error: "User ID is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const pool = getPool()
    if (!pool) {
      const response = NextResponse.json({ error: "Database not available" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Update user status in the appropriate table based on role
    const userCheck = await dbQuery("SELECT role FROM users WHERE user_id = $1", [userId])
    
    if (userCheck.rows.length === 0) {
      const response = NextResponse.json({ error: "User not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const userRole = userCheck.rows[0].role
    let updateResult

    if (userRole === 'supplier') {
      // Update supplier table
      const updateFields = []
      const updateValues = []
      let paramCount = 1

      if (isActive !== undefined) {
        updateFields.push(`is_active = $${paramCount}`)
        updateValues.push(isActive)
        paramCount++
      }

      if (isVerified !== undefined) {
        updateFields.push(`is_verified = $${paramCount}`)
        updateValues.push(isVerified)
        paramCount++
      }

      if (updateFields.length === 0) {
        const response = NextResponse.json({ error: "No fields to update" }, { status: 400 })
      return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
      }

      updateValues.push(userId)
      const updateQuery = `
        UPDATE suppliers 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramCount}
        RETURNING *
      `
      updateResult = await dbQuery(updateQuery, updateValues)
    } else if (userRole === 'buyer') {
      // Update buyer table
      const updateFields = []
      const updateValues = []
      let paramCount = 1

      if (isActive !== undefined) {
        updateFields.push(`is_active = $${paramCount}`)
        updateValues.push(isActive)
        paramCount++
      }

      if (isVerified !== undefined) {
        updateFields.push(`is_verified = $${paramCount}`)
        updateValues.push(isVerified)
        paramCount++
      }

      if (updateFields.length === 0) {
        const response = NextResponse.json({ error: "No fields to update" }, { status: 400 })
      return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
      }

      updateValues.push(userId)
      const updateQuery = `
        UPDATE buyers 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $${paramCount}
        RETURNING *
      `
      updateResult = await dbQuery(updateQuery, updateValues)
    } else {
      const response = NextResponse.json({ error: "Cannot update admin user status" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    if (updateResult.rows.length === 0) {
      const response = NextResponse.json({ error: "User not found in role table" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({
      success: true,
      message: "User status updated successfully",
      user: updateResult.rows[0]
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error updating user status:", error)
    const response = NextResponse.json({ 
      error: "Failed to update user status",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}


