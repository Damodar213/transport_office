import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST() {
  try {
    console.log("🔄 Resetting order data...")
    
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available",
        message: "DATABASE_URL might be missing or invalid"
      }, { status: 500 })
    }

    // Clear all order-related data
    await dbQuery("DELETE FROM accepted_requests")
    await dbQuery("DELETE FROM order_submissions")
    await dbQuery("DELETE FROM manual_order_submissions")
    await dbQuery("DELETE FROM buyer_requests")
    await dbQuery("DELETE FROM manual_orders")
    await dbQuery("DELETE FROM buyers_orders")
    await dbQuery("DELETE FROM confirmed_orders")

    // Clear notifications related to orders
    await dbQuery("DELETE FROM supplier_notifications")
    await dbQuery("DELETE FROM buyer_notifications")
    await dbQuery("DELETE FROM notifications")

    // Reset sequences to start from 1
    await dbQuery("ALTER SEQUENCE buyer_requests_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE manual_orders_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE buyers_orders_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE order_submissions_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE manual_order_submissions_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE accepted_requests_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE confirmed_orders_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE notifications_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE supplier_notifications_id_seq RESTART WITH 1")
    await dbQuery("ALTER SEQUENCE buyer_notifications_id_seq RESTART WITH 1")

    // Verify the reset
    const verification = await dbQuery(`
      SELECT 'buyer_requests' as table_name, COUNT(*) as count FROM buyer_requests
      UNION ALL
      SELECT 'manual_orders' as table_name, COUNT(*) as count FROM manual_orders
      UNION ALL
      SELECT 'order_submissions' as table_name, COUNT(*) as count FROM order_submissions
      UNION ALL
      SELECT 'accepted_requests' as table_name, COUNT(*) as count FROM accepted_requests
    `)

    console.log("✅ Order data reset successfully!")
    
    return NextResponse.json({
      success: true,
      message: "Order data reset successfully! Next orders will start from ORD-1",
      verification: verification.rows,
      details: {
        "Buyer requests": "Will start from ORD-1",
        "Manual orders": "Will start from MO-1",
        "Mock orders": "Will start from ORD-1"
      }
    })
    
  } catch (error) {
    console.error("❌ Reset failed:", error)
    return NextResponse.json({ 
      error: "Reset failed",
      message: error instanceof Error ? error.message : "Unknown error",
      details: error
    }, { status: 500 })
  }
}
