import { type NextRequest, NextResponse } from "next/server"

// Mock database - replace with actual database implementation
const orders = [
  {
    id: 1,
    orderNumber: "ORD-2024-001",
    buyerId: "BUY001",
    buyerCompany: "ABC Traders",
    supplierId: "SUP001",
    supplierCompany: "Kumar Transport Co.",
    driverId: 1,
    vehicleId: 1,
    loadType: "Rice",
    fromLocation: "Bangalore",
    toLocation: "Chennai",
    estimatedTons: 25,
    deliveryPlace: "Chennai Port",
    state: "Tamil Nadu",
    district: "Chennai",
    taluk: "Chennai",
    status: "in_transit",
    adminNotes: "Priority delivery",
    assignedBy: "admin",
    assignedAt: "2024-02-10 10:30",
    confirmedAt: "2024-02-10 14:00",
    pickupDate: "2024-02-11 08:00",
    estimatedDeliveryDate: "2024-02-12 18:00",
    rate: 15000,
    distance: 350,
    createdAt: "2024-02-10 09:15",
    updatedAt: "2024-02-11 08:00",
  },
]

// GET - Fetch single order
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const orderId = Number.parseInt(id)
    const order = orders.find((o) => o.id === orderId)

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Get order error:", error)
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
  }
}

// PUT - Update order
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const orderId = Number.parseInt(id)
    const body = await request.json()

    const orderIndex = orders.findIndex((o) => o.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    orders[orderIndex] = {
      ...orders[orderIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ message: "Order updated successfully", order: orders[orderIndex] })
  } catch (error) {
    console.error("Update order error:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}

// DELETE - Delete order
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const orderId = Number.parseInt(id)
    const orderIndex = orders.findIndex((o) => o.id === orderId)

    if (orderIndex === -1) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    orders.splice(orderIndex, 1)

    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Delete order error:", error)
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
  }
}
