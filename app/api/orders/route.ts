import { type NextRequest, NextResponse } from "next/server"

export interface TransportOrder {
  id: number
  orderNumber: string
  buyerId: string
  buyerCompany: string
  supplierId?: string
  supplierCompany?: string
  driverId?: number
  vehicleId?: number
  loadType: string
  fromLocation: string
  toLocation: string
  estimatedTons: number
  deliveryPlace: string
  state: string
  district: string
  taluk: string
  status:
    | "draft"
    | "pending"
    | "assigned"
    | "confirmed"
    | "picked_up"
    | "in_transit"
    | "delivered"
    | "cancelled"
    | "rejected"
  adminNotes?: string
  assignedBy?: string
  assignedAt?: string
  confirmedAt?: string
  pickupDate?: string
  deliveryDate?: string
  estimatedDeliveryDate?: string
  rate?: number
  distance?: number
  createdAt: string
  updatedAt: string
}

// Mock database - replace with actual database implementation
const orders: TransportOrder[] = [
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
  {
    id: 2,
    orderNumber: "ORD-2024-002",
    buyerId: "BUY002",
    buyerCompany: "XYZ Industries",
    loadType: "Wheat",
    fromLocation: "Mumbai",
    toLocation: "Pune",
    estimatedTons: 15,
    deliveryPlace: "Pune Market",
    state: "Maharashtra",
    district: "Pune",
    taluk: "Pune",
    status: "pending",
    createdAt: "2024-02-11 11:20",
    updatedAt: "2024-02-11 11:20",
  },
]

let nextOrderId = 3

// GET - Fetch orders with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const buyerId = searchParams.get("buyerId")
    const supplierId = searchParams.get("supplierId")
    const search = searchParams.get("search")

    let filteredOrders = [...orders]

    // Filter by status
    if (status && status !== "all") {
      filteredOrders = filteredOrders.filter((order) => order.status === status)
    }

    // Filter by buyer
    if (buyerId) {
      filteredOrders = filteredOrders.filter((order) => order.buyerId === buyerId)
    }

    // Filter by supplier
    if (supplierId) {
      filteredOrders = filteredOrders.filter((order) => order.supplierId === supplierId)
    }

    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase()
      filteredOrders = filteredOrders.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.loadType.toLowerCase().includes(searchLower) ||
          order.fromLocation.toLowerCase().includes(searchLower) ||
          order.toLocation.toLowerCase().includes(searchLower) ||
          order.buyerCompany.toLowerCase().includes(searchLower) ||
          order.supplierCompany?.toLowerCase().includes(searchLower),
      )
    }

    // Sort by creation date (newest first)
    filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ orders: filteredOrders })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const newOrder: TransportOrder = {
      id: nextOrderId++,
      orderNumber: `ORD-${new Date().getFullYear()}-${String(nextOrderId - 1).padStart(3, "0")}`,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    }

    orders.push(newOrder)

    return NextResponse.json({ message: "Order created successfully", order: newOrder }, { status: 201 })
  } catch (error) {
    console.error("Create order error:", error)
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
