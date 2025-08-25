export interface OrderStatusUpdate {
  orderId: number
  status: string
  notes?: string
  updatedBy: string
  timestamp: string
}

export interface OrderAssignment {
  orderId: number
  supplierId: string
  supplierCompany: string
  driverId?: number
  vehicleId?: number
  rate?: number
  adminNotes?: string
  assignedBy: string
}

export const createOrder = async (orderData: any) => {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to create order")
  }

  return response.json()
}

export const updateOrderStatus = async (orderId: number, status: string, notes?: string, updatedBy = "user") => {
  const response = await fetch("/api/orders/status", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderId,
      status,
      notes,
      updatedBy,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to update order status")
  }

  return response.json()
}

export const assignOrder = async (assignment: OrderAssignment) => {
  const response = await fetch("/api/orders/assign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(assignment),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to assign order")
  }

  return response.json()
}

export const fetchOrders = async (filters: {
  status?: string
  buyerId?: string
  supplierId?: string
  search?: string
}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value)
  })

  const response = await fetch(`/api/orders?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch orders")
  }

  return response.json()
}

export const fetchOrderStatistics = async (userId?: string, role?: string) => {
  const params = new URLSearchParams()
  if (userId) params.append("userId", userId)
  if (role) params.append("role", role)

  const response = await fetch(`/api/orders/statistics?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to fetch statistics")
  }

  return response.json()
}

export const getOrderStatusColor = (status: string) => {
  const colors = {
    draft: "bg-gray-100 text-gray-800",
    pending: "bg-yellow-100 text-yellow-800",
    assigned: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    picked_up: "bg-purple-100 text-purple-800",
    in_transit: "bg-indigo-100 text-indigo-800",
    delivered: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
    rejected: "bg-red-100 text-red-800",
  }
  return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

export const getOrderStatusLabel = (status: string) => {
  const labels = {
    draft: "Draft",
    pending: "Pending Review",
    assigned: "Assigned",
    confirmed: "Confirmed",
    picked_up: "Picked Up",
    in_transit: "In Transit",
    delivered: "Delivered",
    cancelled: "Cancelled",
    rejected: "Rejected",
  }
  return labels[status as keyof typeof labels] || status
}

export const calculateDeliveryProgress = (status: string) => {
  const progressMap = {
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
  return progressMap[status as keyof typeof progressMap] || 0
}
