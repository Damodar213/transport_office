import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function DELETE() {
  try {
    console.log("DELETE /api/admin/supplier-vehicle-location-notifications/clear-all - clearing all supplier vehicle location notifications")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    
    // Check if table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_vehicle_location_notifications'
      )
    `)
    
    if (!tableExists.rows[0].exists) {
      return NextResponse.json({ 
        error: "Supplier vehicle location notifications table not found",
        message: "All supplier vehicle location notifications cleared (mock mode)"
      })
    }
    
    // Get count before deletion
    const countResult = await dbQuery(`
      SELECT COUNT(*) as total_count FROM supplier_vehicle_location_notifications
    `)
    const totalCount = countResult.rows[0].total_count
    
    // Delete all supplier vehicle location notifications
    await dbQuery(`
      DELETE FROM supplier_vehicle_location_notifications
    `)
    
    console.log(`${totalCount} supplier vehicle location notifications cleared successfully`)
    return NextResponse.json({ 
      message: "All supplier vehicle location notifications cleared successfully",
      clearedCount: parseInt(totalCount)
    })
    
  } catch (error) {
    console.error("Error clearing all supplier vehicle location notifications:", error)
    return NextResponse.json({ 
      error: "Failed to clear all supplier vehicle location notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
