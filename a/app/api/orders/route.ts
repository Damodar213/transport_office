import { type NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

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
  // Additional fields for enhanced tracking
  supplierName?: string
  driverName?: string
  driverContact?: string
  vehicleNumber?: string
  currentLocation?: string
  progress?: number
}

// Mock database - replace with actual database implementation
const orders: TransportOrder[] = []

let nextOrderId = 1

// GET - Fetch orders with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const buyerId = searchParams.get("buyerId")
    const supplierId = searchParams.get("supplierId")
    const search = searchParams.get("search")

    // Try to fetch from database first
    try {
      let query = `
        SELECT 
          o.*,
          s.name as supplier_name,
          d.name as driver_name,
          d.phone as driver_contact,
          t.vehicle_number,
          t.current_location
        FROM transport_orders o
        LEFT JOIN suppliers s ON o.supplier_id = s.id
        LEFT JOIN drivers d ON o.driver_id = d.id
        LEFT JOIN trucks t ON o.vehicle_id = t.id
        WHERE 1=1
      `
      const params: any[] = []
      let paramIndex = 1

      // Filter by status
      if (status && status !== "all") {
        query += ` AND o.status = $${paramIndex}`
        params.push(status)
        paramIndex++
      }

      // Filter by buyer
      if (buyerId) {
        query += ` AND o.buyer_id = $${paramIndex}`
        params.push(buyerId)
        paramIndex++
      }

      // Filter by supplier
      if (supplierId) {
        query += ` AND o.supplier_id = $${paramIndex}`
        params.push(supplierId)
        paramIndex++
      }

      // Search functionality
      if (search) {
        query += ` AND (
          o.order_number ILIKE $${paramIndex} OR
          o.load_type ILIKE $${paramIndex} OR
          o.from_location ILIKE $${paramIndex} OR
          o.to_location ILIKE $${paramIndex} OR
          o.buyer_company ILIKE $${paramIndex} OR
          s.name ILIKE $${paramIndex}
        )`
        params.push(`%${search}%`)
        paramIndex++
      }

      query += ` ORDER BY o.created_at DESC`

      const result = await dbQuery<TransportOrder>(query, params)
      
      if (result.rows.length > 0) {
        // Transform database results to match interface
        const transformedOrders = result.rows.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number || `ORD-${row.id}`,
          buyerId: row.buyer_id,
          buyerCompany: row.buyer_company,
          supplierId: row.supplier_id,
          supplierCompany: row.supplier_company,
          supplierName: row.supplier_name,
          driverId: row.driver_id,
          driverName: row.driver_name,
          driverContact: row.driver_contact,
          vehicleId: row.vehicle_id,
          vehicleNumber: row.vehicle_number,
          loadType: row.load_type,
          fromLocation: row.from_location,
          toLocation: row.to_location,
          estimatedTons: row.estimated_tons,
          deliveryPlace: row.delivery_place,
          state: row.state,
          district: row.district,
          taluk: row.taluk,
          status: row.status,
          adminNotes: row.admin_notes,
          assignedBy: row.assigned_by,
          assignedAt: row.assigned_at,
          confirmedAt: row.confirmed_at,
          pickupDate: row.pickup_date,
          deliveryDate: row.delivery_date,
          estimatedDeliveryDate: row.estimated_delivery_date,
          rate: row.rate,
          distance: row.distance,
          currentLocation: row.current_location,
          progress: calculateProgress(row.status),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))

        return NextResponse.json({ orders: transformedOrders })
      }
    } catch (dbError) {
      console.log("Database query failed, falling back to mock data:", dbError)
    }

    // Fallback to mock data if database is not available
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

// Helper function to calculate progress based on status
function calculateProgress(status: string): number {
  const progressMap: { [key: string]: number } = {
    draft: 0,
    pending: 10,
    assigned: 20,
    confirmed: 30,
    picked_up: 50,
    in_transit: 75,
    delivered: 100,
    cancelled: 0,
    rejected: 0,
  }
  return progressMap[status] || 0
}

// POST - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Generate sequential ID (MAX + 1, no gap filling)
    const maxId = orders.length > 0 ? Math.max(...orders.map(order => order.id)) : 0
    const newId = maxId + 1

    const newOrder: TransportOrder = {
      id: newId,
      orderNumber: `ORD-${newId}`,
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
