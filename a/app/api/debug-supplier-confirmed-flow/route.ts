import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Debug supplier confirmed flow API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const debugInfo: any = {
      step1_manual_orders: null,
      step2_manual_submissions: null,
      step3_accepted_requests: null,
      step4_admin_query: null,
      step5_joins: null,
      issues: [],
      recommendations: []
    }

    // Step 1: Check manual_orders table
    try {
      const manualOrders = await dbQuery(`
        SELECT id, order_number, load_type, from_state, from_district, to_state, to_district, 
               status, created_at, created_by
        FROM manual_orders 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      debugInfo.step1_manual_orders = {
        count: manualOrders.rows.length,
        data: manualOrders.rows
      }
      
      if (manualOrders.rows.length === 0) {
        debugInfo.issues.push("No manual orders found in database")
        debugInfo.recommendations.push("Create a manual order first")
      }
      
      console.log("Step 1 - Manual orders:", manualOrders.rows.length)
    } catch (error) {
      debugInfo.step1_manual_orders = { error: error.message }
      debugInfo.issues.push(`Manual orders table error: ${error.message}`)
    }

    // Step 2: Check manual_order_submissions table
    try {
      const manualSubmissions = await dbQuery(`
        SELECT id, order_id, supplier_id, status, created_at, submitted_by
        FROM manual_order_submissions 
        ORDER BY created_at DESC 
        LIMIT 5
      `)
      
      debugInfo.step2_manual_submissions = {
        count: manualSubmissions.rows.length,
        data: manualSubmissions.rows
      }
      
      if (manualSubmissions.rows.length === 0) {
        debugInfo.issues.push("No manual order submissions found")
        debugInfo.recommendations.push("Send manual orders to suppliers first")
      }
      
      console.log("Step 2 - Manual submissions:", manualSubmissions.rows.length)
    } catch (error) {
      debugInfo.step2_manual_submissions = { error: error.message }
      debugInfo.issues.push(`Manual submissions table error: ${error.message}`)
    }

    // Step 3: Check accepted_requests table
    try {
      const acceptedRequests = await dbQuery(`
        SELECT id, order_submission_id, supplier_id, sent_by_admin, accepted_at, 
               status, order_number, created_at
        FROM accepted_requests 
        ORDER BY created_at DESC 
        LIMIT 10
      `)
      
      debugInfo.step3_accepted_requests = {
        count: acceptedRequests.rows.length,
        data: acceptedRequests.rows
      }
      
      // Check specifically for supplier confirmed orders
      const supplierConfirmed = acceptedRequests.rows.filter(ar => ar.sent_by_admin === false)
      debugInfo.step3_accepted_requests.supplier_confirmed = supplierConfirmed.length
      
      if (acceptedRequests.rows.length === 0) {
        debugInfo.issues.push("No accepted requests found in database")
        debugInfo.recommendations.push("Accept some orders as a supplier first")
      } else if (supplierConfirmed.length === 0) {
        debugInfo.issues.push("No supplier confirmed orders found (sent_by_admin = false)")
        debugInfo.recommendations.push("Check if supplier accept order API is working correctly")
      }
      
      console.log("Step 3 - Accepted requests:", acceptedRequests.rows.length, "Supplier confirmed:", supplierConfirmed.length)
    } catch (error) {
      debugInfo.step3_accepted_requests = { error: error.message }
      debugInfo.issues.push(`Accepted requests table error: ${error.message}`)
    }

    // Step 4: Test the admin suppliers-confirmed query
    try {
      const adminQuery = await dbQuery(`
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
      
      debugInfo.step4_admin_query = {
        count: adminQuery.rows.length,
        data: adminQuery.rows
      }
      
      if (adminQuery.rows.length === 0) {
        debugInfo.issues.push("Admin query returns no results")
        debugInfo.recommendations.push("Check if the JOIN conditions are working correctly")
      }
      
      console.log("Step 4 - Admin query results:", adminQuery.rows.length)
    } catch (error) {
      debugInfo.step4_admin_query = { error: error.message }
      debugInfo.issues.push(`Admin query error: ${error.message}`)
    }

    // Step 5: Test individual JOINs to see which one is failing
    try {
      // Test accepted_requests to manual_order_submissions JOIN
      const join1 = await dbQuery(`
        SELECT ar.id, ar.order_submission_id, mos.id as mos_id, mos.order_id
        FROM accepted_requests ar
        LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
        WHERE ar.sent_by_admin = false
        LIMIT 5
      `)
      
      // Test manual_order_submissions to manual_orders JOIN
      const join2 = await dbQuery(`
        SELECT mos.id, mos.order_id, mo.id as mo_id, mo.order_number
        FROM manual_order_submissions mos
        LEFT JOIN manual_orders mo ON mos.order_id = mo.id
        LIMIT 5
      `)
      
      debugInfo.step5_joins = {
        accepted_to_submissions: {
          count: join1.rows.length,
          data: join1.rows
        },
        submissions_to_orders: {
          count: join2.rows.length,
          data: join2.rows
        }
      }
      
      console.log("Step 5 - JOIN tests:", join1.rows.length, join2.rows.length)
    } catch (error) {
      debugInfo.step5_joins = { error: error.message }
      debugInfo.issues.push(`JOIN test error: ${error.message}`)
    }

    // Check for data inconsistencies
    try {
      // Check if there are accepted_requests with invalid order_submission_id
      const invalidSubmissions = await dbQuery(`
        SELECT ar.id, ar.order_submission_id, ar.sent_by_admin
        FROM accepted_requests ar
        LEFT JOIN manual_order_submissions mos ON ar.order_submission_id = mos.id
        LEFT JOIN order_submissions os ON ar.order_submission_id = os.id
        WHERE mos.id IS NULL AND os.id IS NULL AND ar.sent_by_admin = false
      `)
      
      if (invalidSubmissions.rows.length > 0) {
        debugInfo.issues.push(`Found ${invalidSubmissions.rows.length} accepted_requests with invalid order_submission_id`)
        debugInfo.recommendations.push("Fix the order_submission_id references in accepted_requests table")
      }
    } catch (error) {
      debugInfo.issues.push(`Data consistency check error: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
      summary: {
        totalIssues: debugInfo.issues.length,
        hasManualOrders: debugInfo.step1_manual_orders?.count > 0,
        hasSubmissions: debugInfo.step2_manual_submissions?.count > 0,
        hasAcceptedRequests: debugInfo.step3_accepted_requests?.count > 0,
        hasSupplierConfirmed: debugInfo.step3_accepted_requests?.supplier_confirmed > 0,
        adminQueryWorks: debugInfo.step4_admin_query?.count > 0
      }
    })

  } catch (error) {
    console.error("Error debugging supplier confirmed flow:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

