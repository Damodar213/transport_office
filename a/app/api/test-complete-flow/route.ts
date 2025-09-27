import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Test complete flow API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Step 1: Check all tables and their data
    const tables = [
      'manual_orders',
      'manual_order_submissions', 
      'accepted_requests',
      'order_submissions',
      'buyer_requests'
    ]
    
    const tableData: any = {}
    
    for (const table of tables) {
      try {
        const result = await dbQuery(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 5`)
        tableData[table] = {
          count: result.rows.length,
          data: result.rows
        }
        console.log(`${table}: ${result.rows.length} records`)
      } catch (error) {
        tableData[table] = {
          count: 0,
          error: error.message
        }
        console.log(`${table}: Error - ${error.message}`)
      }
    }
    
    // Step 2: Test the admin suppliers-confirmed query
    let adminQueryResult = null
    try {
      const result = await dbQuery(`
        SELECT 
          ar.id,
          ar.order_submission_id as order_id,
          ar.supplier_id,
          ar.accepted_at as submitted_at,
          ar.status,
          ar.order_number,
          ar.load_type,
          ar.from_state,
          ar.from_district,
          ar.from_place,
          ar.to_state,
          ar.to_district,
          ar.to_place,
          CASE 
            WHEN mos.id IS NOT NULL THEN 'Manual Order'
            WHEN os.id IS NOT NULL THEN 'Buyer Request'
            ELSE 'Unknown'
          END as buyer_name,
          ar.supplier_company,
          ar.driver_name,
          ar.driver_mobile,
          ar.vehicle_number,
          CASE 
            WHEN mos.id IS NOT NULL THEN 'manual_order'
            WHEN os.id IS NOT NULL THEN 'buyer_request'
            ELSE 'unknown'
          END as order_type
        FROM accepted_requests ar
        LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
        LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
        WHERE ar.sent_by_admin = false
        ORDER BY ar.accepted_at DESC
        LIMIT 10
      `)
      
      adminQueryResult = {
        count: result.rows.length,
        data: result.rows
      }
      console.log("Admin query result:", result.rows.length, "records")
    } catch (error) {
      adminQueryResult = {
        count: 0,
        error: error.message
      }
      console.log("Admin query error:", error.message)
    }
    
    // Step 3: Check for any data inconsistencies
    const inconsistencies = []
    
    // Check if there are accepted_requests without proper order_submission_id
    try {
      const orphanedAccepted = await dbQuery(`
        SELECT ar.* FROM accepted_requests ar
        LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
        LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
        WHERE mos.id IS NULL AND os.id IS NULL
      `)
      
      if (orphanedAccepted.rows.length > 0) {
        inconsistencies.push({
          type: "orphaned_accepted_requests",
          count: orphanedAccepted.rows.length,
          data: orphanedAccepted.rows
        })
      }
    } catch (error) {
      console.log("Error checking orphaned accepted requests:", error.message)
    }
    
    // Check if there are manual_order_submissions without corresponding accepted_requests
    try {
      const unacceptedSubmissions = await dbQuery(`
        SELECT mos.* FROM manual_order_submissions mos
        LEFT JOIN accepted_requests ar ON ar.order_submission_id = mos.id
        WHERE ar.id IS NULL AND mos.status = 'accepted'
      `)
      
      if (unacceptedSubmissions.rows.length > 0) {
        inconsistencies.push({
          type: "unaccepted_submissions",
          count: unacceptedSubmissions.rows.length,
          data: unacceptedSubmissions.rows
        })
      }
    } catch (error) {
      console.log("Error checking unaccepted submissions:", error.message)
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        totalTables: tables.length,
        totalAcceptedRequests: tableData.accepted_requests?.count || 0,
        totalManualOrders: tableData.manual_orders?.count || 0,
        totalManualSubmissions: tableData.manual_order_submissions?.count || 0,
        adminQueryResults: adminQueryResult?.count || 0,
        inconsistencies: inconsistencies.length
      },
      tableData,
      adminQueryResult,
      inconsistencies,
      recommendations: [
        "1. Check if manual orders are being created with proper state/district data",
        "2. Verify that manual order submissions are being created when admin sends to suppliers",
        "3. Ensure supplier accept order API is creating accepted_requests with sent_by_admin = false",
        "4. Check if admin suppliers-confirmed API is being called properly",
        "5. Verify database schema has all required columns"
      ]
    })

  } catch (error) {
    console.error("Error testing complete flow:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

