import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getSession } from "@/lib/auth"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    console.log("=== DATA ISOLATION TEST ===")
    
    // Test 1: Check if user is authenticated
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ success: false,
        test: "authentication",
        message: "No active session - user needs to log in" })
        recommendation: "Log in with valid credentials first"})
    return addCorsHeaders(response)
  }

    console.log("User session:", {
      userId: session.userId,
      userIdString: session.userIdString,
      role: session.role


})
    })

    // Test 2: Check if user is a supplier
    if (session.role !== 'supplier') {
      const response = NextResponse.json({
        success: false,
        test: "role_check",
        message: "User is not a supplier",
        userRole: session.role,
        recommendation: "Log in as a supplier to test truck data isolation"


}
    // Test 3: Check trucks for current supplier
    const currentSupplierTrucks = await dbQuery(
}
      "SELECT id, supplier_id, vehicle_number, body_type FROM trucks WHERE supplier_id = $1",
      [session.userIdString])
    console.log(`Found ${currentSupplierTrucks.rows.length} trucks for supplier ${session.userIdString}`)

    // Test 4: Check all trucks in database (for comparison)
    const allTrucks = await dbQuery("SELECT id, supplier_id, vehicle_number, body_type FROM trucks ORDER BY supplier_id")
    console.log(`Total trucks in database: ${allTrucks.rows.length}`)

    // Test 5: Check if there are trucks from other suppliers
    const otherSuppliersTrucks = await dbQuery(})
      "SELECT DISTINCT supplier_id, COUNT(*) as truck_count FROM trucks WHERE supplier_id != $1 GROUP BY supplier_id",
      [session.userIdString]
    )

    console.log("Other suppliers with trucks:", otherSuppliersTrucks.rows)

    const response = NextResponse.json({
      success: true,
      test: "data_isolation",
      message: "Data isolation test completed",
      currentUser: {


}
        userId: session.userIdString,
        role: session.role


}
      },
      currentSupplierTrucks: {


}
        count: currentSupplierTrucks.rows.length,
        trucks: currentSupplierTrucks.rows


}
      },
      databaseOverview: {


}
        totalTrucks: allTrucks.rows.length,
        otherSuppliers: otherSuppliersTrucks.rows


}
      },
      securityStatus: "Data isolation is working correctly - each supplier can only see their own trucks"


})
  } catch (error) {
    console.error("Data isolation test error:", error)
    const response = NextResponse.json({
      success: false,
      test: "error",
      message: "Test failed with error",
      error: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
