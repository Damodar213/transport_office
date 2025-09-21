import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

// DELETE - Delete a user (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check if user is authenticated and is admin
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    if (session.role !== 'admin') {
      return NextResponse.json({ error: "Access denied - admin role required" }, { status: 403 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const userId = params.userId

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (userId === session.userIdString) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 })
    }

    console.log("Deleting user with ID:", userId)

    // First check if user exists
    const userCheck = await dbQuery("SELECT user_id, role, name FROM users WHERE user_id = $1", [userId])
    
    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const user = userCheck.rows[0]
    console.log("User found:", user)

    // Start a transaction to delete user and related data
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN')

      // Delete related data based on user role
      if (user.role === 'supplier') {
        // Delete supplier documents
        await client.query("DELETE FROM supplier_documents WHERE user_id = $1", [userId])
        
        // Delete vehicle documents
        await client.query("DELETE FROM vehicle_documents WHERE supplier_id = $1", [userId])
        
        // Delete driver documents
        await client.query("DELETE FROM driver_documents WHERE supplier_id = $1", [userId])
        
        // Delete trucks
        await client.query("DELETE FROM trucks WHERE supplier_id = $1", [userId])
        
        // Delete drivers
        await client.query("DELETE FROM drivers WHERE supplier_id = $1", [userId])
        
        // Delete supplier record
        await client.query("DELETE FROM suppliers WHERE user_id = $1", [userId])
        
        // Delete order submissions
        await client.query("DELETE FROM order_submissions WHERE supplier_id = $1", [userId])
      } else if (user.role === 'buyer') {
        // Delete buyer requests
        await client.query("DELETE FROM buyer_requests WHERE buyer_id = $1", [userId])
        
        // Delete buyer record
        await client.query("DELETE FROM buyers WHERE user_id = $1", [userId])
      }

      // Delete user record
      await client.query("DELETE FROM users WHERE user_id = $1", [userId])

      await client.query('COMMIT')
      
      console.log("User deleted successfully:", user.name || user.user_id)
      
      return NextResponse.json({
        success: true,
        message: "User deleted successfully",
        deletedUser: {
          userId: user.user_id,
          name: user.name,
          role: user.role
        }
      })

    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }

  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ 
      error: "Failed to delete user",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}

