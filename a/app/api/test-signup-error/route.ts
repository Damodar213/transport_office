import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getPool, dbQuery } from "@/lib/db"
import bcrypt from "bcryptjs"
import { createUserAsync } from "@/lib/user-storage"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
  }
export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("=== TESTING SIGNUP ERROR ===")
    
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    // Test data similar to what signup would send
    const testUserId = "test_signup_" + Date.now()
    const testPassword = "test123"
    const passwordHash = await bcrypt.hash(testPassword, 10)
    
    const supplierData = {
      userId: testUserId,
      passwordHash,
      role: "supplier" as const,
      name: "Test User",
      mobile: "1234567890",
      companyName: "Test Company",
      gstNumber: "TEST123",
      email: "test@example.com",
      numberOfVehicles: 5,
        documents: undefined,
    }

    console.log("Testing createUserAsync with data:", {
      userId: supplierData.userId,
      role: supplierData.role,
      name: supplierData.name,
      companyName: supplierData.companyName
    })

    // Test the createUserAsync function
    const result = await createUserAsync(supplierData)
    
    console.log("createUserAsync succeeded:", {
      id: result.id,
      userId: result.userId,
      role: result.role
    })

    // Clean up test data
    await dbQuery("DELETE FROM suppliers WHERE user_id = $1", [testUserId])
    await dbQuery("DELETE FROM users WHERE user_id = $1", [testUserId])

    const response = NextResponse.json({
      success: true,
      message: "Signup test completed successfully",
      result: {
        id: result.id,
        userId: result.userId,
        role: result.role
      })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Signup test error:", error)
    const response = NextResponse.json({ 
      success: false,
      error: "Signup test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
  })
    return addCorsHeaders(response)
  }