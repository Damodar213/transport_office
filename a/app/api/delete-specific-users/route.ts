import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userIds } = body // Array of user IDs to delete
    
    console.log("🗑️ Deleting specific users:", userIds)
    
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available",
        message: "DATABASE_URL might be missing or invalid"
      }, { status: 500 })
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: "No user IDs provided",
        message: "Please provide an array of user IDs to delete"
      }, { status: 400 })
    }

    const results = []

    for (const userId of userIds) {
      console.log(`Deleting user: ${userId}`)
      
      try {
        // Delete in proper order to handle foreign key constraints
        
        // 1. Delete confirmed orders first (references drivers/trucks)
        await dbQuery("DELETE FROM confirmed_orders WHERE supplier_id = $1", [userId])
        
        // 2. Delete order submissions and accepted requests
        await dbQuery("DELETE FROM accepted_requests WHERE buyer_id = $1 OR supplier_id = $1", [userId])
        await dbQuery("DELETE FROM order_submissions WHERE supplier_id = $1", [userId])
        await dbQuery("DELETE FROM manual_order_submissions WHERE supplier_id = $1", [userId])
        
        // 3. Delete supplier vehicle locations (references drivers)
        await dbQuery("DELETE FROM suppliers_vehicle_location WHERE supplier_id = $1", [userId])
        
        // 4. Delete buyer requests
        await dbQuery("DELETE FROM buyer_requests WHERE buyer_id = $1", [userId])
        
        // 5. Delete notifications
        await dbQuery("DELETE FROM supplier_notifications WHERE supplier_id = $1", [userId])
        await dbQuery("DELETE FROM buyer_notifications WHERE buyer_id = $1", [userId])

        // 6. Delete fleet data (drivers and trucks)
        await dbQuery("DELETE FROM drivers WHERE supplier_id = $1", [userId])
        await dbQuery("DELETE FROM trucks WHERE supplier_id = $1", [userId])

        // Delete user profile data
        await dbQuery("DELETE FROM suppliers WHERE user_id = $1", [userId])
        await dbQuery("DELETE FROM buyers WHERE user_id = $1", [userId])

        // Finally delete the user
        const userResult = await dbQuery("DELETE FROM users WHERE user_id = $1 RETURNING *", [userId])
        
        if (userResult.rows.length > 0) {
          results.push({
            userId: userId,
            status: "deleted",
            user: userResult.rows[0]
          })
          console.log(`✅ Successfully deleted user: ${userId}`)
        } else {
          results.push({
            userId: userId,
            status: "not_found",
            message: "User not found in database"
          })
          console.log(`⚠️ User not found: ${userId}`)
        }
        
      } catch (error) {
        console.error(`❌ Error deleting user ${userId}:`, error)
        results.push({
          userId: userId,
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }

    // Get remaining user count
    const remainingUsers = await dbQuery("SELECT COUNT(*) as count FROM users WHERE role != 'admin'")
    
    return NextResponse.json({
      success: true,
      message: `Processed ${userIds.length} users for deletion`,
      results: results,
      remainingUsers: remainingUsers.rows[0].count,
      summary: {
        deleted: results.filter(r => r.status === "deleted").length,
        notFound: results.filter(r => r.status === "not_found").length,
        errors: results.filter(r => r.status === "error").length
      }
    })
    
  } catch (error) {
    console.error("❌ Bulk user deletion failed:", error)
    return NextResponse.json({ 
      error: "Bulk deletion failed",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 })
  }
}
