import { type NextRequest, NextResponse } from "next/server"

// POST - Assign order to supplier (Admin functionality)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, supplierId, supplierCompany, driverId, vehicleId, rate, adminNotes, assignedBy } = body

    if (!orderId || !supplierId) {
      return NextResponse.json({ error: "Order ID and Supplier ID are required" }, { status: 400 })
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
      status: "assigned",
    }

    console.log("Order assignment:", assignmentData)

    // In real implementation, update the order in database
    // await updateOrder(orderId, assignmentData)

    return NextResponse.json({
      message: "Order assigned successfully",
      assignment: assignmentData,
    })
  } catch (error) {
    console.error("Order assignment error:", error)
    return NextResponse.json({ error: "Failed to assign order" }, { status: 500 })
  }
}
