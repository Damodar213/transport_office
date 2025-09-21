import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

// POST - Assign order to supplier (Admin functionality)
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)})
    return addCorsHeaders(response)
  }
export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const body = await request.json()
    const { orderId, supplierId, supplierCompany, driverId, vehicleId, rate, adminNotes, assignedBy } = body

    if (!orderId || !supplierId) {
    }

    // Mock assignment logic - replace with actual database update
    const assignmentData = {
      orderId,
      supplierId,
      supplierCompany,
      driverId,
      vehicleId,
      rate,
      adminNotes,
      assignedBy,
      assignedAt: new Date().toISOString(),
      status: "assigned"}

    console.log("Order assignment:", assignmentData)

    // In real implementation, update the order in database
    // await updateOrder(orderId, assignmentData)

    const response = NextResponse.json({
      message: "Order assigned successfully",
      assignment: assignmentData})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Order assignment error:", error)
  }
