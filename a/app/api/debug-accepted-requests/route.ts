import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug accepted requests API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check if accepted_requests table exists and get its structure
    const tableCheck = await dbQuery(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'accepted_requests' 
      ORDER BY ordinal_position
    `)
    
    console.log("Accepted requests table structure:", tableCheck.rows)

    // Get all records from accepted_requests table
    const allRecords = await dbQuery(`
      SELECT * FROM accepted_requests 
      ORDER BY created_at DESC 
      LIMIT 20
    `)
    
    console.log("All accepted requests records:", allRecords.rows.length)
    console.log("Sample records:", allRecords.rows)

    // Get records where sent_by_admin = false
    const supplierConfirmed = await dbQuery(`
      SELECT * FROM accepted_requests 
      WHERE sent_by_admin = false 
      ORDER BY accepted_at DESC 
      LIMIT 20
    `)
    
    console.log("Supplier confirmed records:", supplierConfirmed.rows.length)
    console.log("Supplier confirmed sample:", supplierConfirmed.rows)

    // Check manual_order_submissions table
    const manualSubmissions = await dbQuery(`
      SELECT * FROM manual_order_submissions 
      ORDER BY created_at DESC 
      LIMIT 10
    `)
    
    console.log("Manual order submissions:", manualSubmissions.rows.length)
    console.log("Manual submissions sample:", manualSubmissions.rows)

    return NextResponse.json({
      success: true,
      tableStructure: tableCheck.rows,
      allRecords: allRecords.rows,
      supplierConfirmed: supplierConfirmed.rows,
      manualSubmissions: manualSubmissions.rows,
      counts: {
        totalAcceptedRequests: allRecords.rows.length,
        supplierConfirmed: supplierConfirmed.rows.length,
        manualSubmissions: manualSubmissions.rows.length
      }
    })

  } catch (error) {
    console.error("Error debugging accepted requests:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

