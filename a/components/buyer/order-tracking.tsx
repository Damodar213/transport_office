"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { MapPin, Truck, Package, Clock, RefreshCw, Wifi, WifiOff } from "lucide-react"

interface Order {
  id: number
  orderNumber: string
  loadType: string
  fromLocation: string
  toLocation: string
  supplierName: string
  supplierCompany: string
  vehicleNumber: string
  driverName: string
  driverContact: string
  estimatedTons: number
  status: "confirmed" | "picked_up" | "in_transit" | "delivered"
  progress: number
  estimatedDelivery: string
  actualPickup?: string
  actualDelivery?: string
  currentLocation?: string
  createdAt: string
}

interface OrderTrackingProps {
  onDataChange?: () => void
}

export function OrderTracking({ onDataChange }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      // Fetch orders from the API with current filters
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (searchTerm) params.append("search", searchTerm)
      
      const response = await fetch(`/api/orders?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        if (data.orders && Array.isArray(data.orders)) {
          // Transform API data to match our interface
          const transformedOrders: Order[] = data.orders.map((order: any) => ({
            id: order.id,
            orderNumber: order.orderNumber || order.order_number || `ORD-${order.id}`,
            loadType: order.loadType || order.load_type || "Unknown",
            fromLocation: order.fromLocation || order.from_location || order.from_place || "Unknown",
            toLocation: order.toLocation || order.to_location || order.to_place || "Unknown",
            supplierName: order.supplierName || order.supplier_name || "Unknown",
            supplierCompany: order.supplierCompany || order.supplier_company || "Unknown",
            vehicleNumber: order.vehicleNumber || order.vehicle_number || "Unknown",
            driverName: order.driverName || order.driver_name || "Unknown",
            driverContact: order.driverContact || order.driver_contact || "Unknown",
            estimatedTons: order.estimatedTons || order.estimated_tons || 0,
            status: order.status || "confirmed",
            progress: order.progress || 0,
            estimatedDelivery: order.estimatedDelivery || order.estimated_delivery || "Unknown",
            actualPickup: order.actualPickup || order.actual_pickup,
            actualDelivery: order.actualDelivery || order.actual_delivery,
            currentLocation: order.currentLocation || order.current_location,
            createdAt: order.createdAt || order.created_at || "Unknown"
          }))
          setOrders(transformedOrders)
          setFilteredOrders(transformedOrders)
          setLastUpdated(new Date())
          onDataChange?.()
        } else {
          // Fallback to mock data if API doesn't return expected format
          const mockOrders: Order[] = [
            {
              id: 1,
              orderNumber: "ORD-2024-001",
              loadType: "Rice",
              fromLocation: "Bangalore, Karnataka",
              toLocation: "Chennai, Tamil Nadu",
              supplierName: "Rajesh Kumar",
              supplierCompany: "Kumar Transport",
              vehicleNumber: "KA01AB1234",
              driverName: "Suresh Patel",
              driverContact: "+91 9876543210",
              estimatedTons: 25.5,
              status: "in_transit",
              progress: 65,
              estimatedDelivery: "2024-02-15 18:00",
              actualPickup: "2024-02-13 09:30",
              currentLocation: "Vellore, Tamil Nadu",
              createdAt: "2024-01-15",
            },
            {
              id: 2,
              orderNumber: "ORD-2024-002",
              loadType: "Wheat",
              fromLocation: "Mysore, Karnataka",
              toLocation: "Hyderabad, Telangana",
              supplierName: "Mohan Singh",
              supplierCompany: "Singh Transport Co.",
              vehicleNumber: "KA02CD5678",
              driverName: "Ramesh Kumar",
              driverContact: "+91 9876543211",
              estimatedTons: 30.0,
              status: "confirmed",
              progress: 0,
              estimatedDelivery: "2024-02-20 16:00",
              createdAt: "2024-01-20",
            },
            {
              id: 3,
              orderNumber: "ORD-2024-003",
              loadType: "Cotton",
              fromLocation: "Hubli, Karnataka",
              toLocation: "Mumbai, Maharashtra",
              supplierName: "Vijay Reddy",
              supplierCompany: "Reddy Logistics",
              vehicleNumber: "KA03EF9012",
              driverName: "Prakash Sharma",
              driverContact: "+91 9876543212",
              estimatedTons: 18.5,
              status: "delivered",
              progress: 100,
              estimatedDelivery: "2024-01-25 14:00",
              actualPickup: "2024-01-23 08:00",
              actualDelivery: "2024-01-25 13:30",
              createdAt: "2024-01-10",
            },
          ]
          setOrders(mockOrders)
          setFilteredOrders(mockOrders)
          setLastUpdated(new Date())
        }
      } else {
        throw new Error("Failed to fetch orders")
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Failed to load orders. Please try again later.")
      // Fallback to mock data on error
      const mockOrders: Order[] = [
        {
          id: 1,
          orderNumber: "ORD-2024-001",
          loadType: "Rice",
          fromLocation: "Bangalore, Karnataka",
          toLocation: "Chennai, Tamil Nadu",
          supplierName: "Rajesh Kumar",
          supplierCompany: "Kumar Transport",
          vehicleNumber: "KA01AB1234",
          driverName: "Suresh Patel",
          driverContact: "+91 9876543210",
          estimatedTons: 25.5,
          status: "in_transit",
          progress: 65,
          estimatedDelivery: "2024-02-15 18:00",
          actualPickup: "2024-02-13 09:30",
          currentLocation: "Vellore, Tamil Nadu",
          createdAt: "2024-01-15",
        },
        {
          id: 2,
          orderNumber: "ORD-2024-002",
          loadType: "Wheat",
          fromLocation: "Mysore, Karnataka",
          toLocation: "Hyderabad, Telangana",
          supplierName: "Mohan Singh",
          supplierCompany: "Singh Transport Co.",
          vehicleNumber: "KA02CD5678",
          driverName: "Ramesh Kumar",
          driverContact: "+91 9876543211",
          estimatedTons: 30.0,
          status: "confirmed",
          progress: 0,
          estimatedDelivery: "2024-02-20 16:00",
          createdAt: "2024-01-20",
        },
        {
          id: 3,
          orderNumber: "ORD-2024-003",
          loadType: "Cotton",
          fromLocation: "Hubli, Karnataka",
          toLocation: "Mumbai, Maharashtra",
          supplierName: "Vijay Reddy",
          supplierCompany: "Reddy Logistics",
          vehicleNumber: "KA03EF9012",
          driverName: "Prakash Sharma",
          driverContact: "+91 9876543212",
          estimatedTons: 18.5,
          status: "delivered",
          progress: 100,
          estimatedDelivery: "2024-01-25 14:00",
          actualPickup: "2024-01-23 08:00",
          actualDelivery: "2024-01-25 13:30",
          createdAt: "2024-01-10",
        },
      ]
      setOrders(mockOrders)
      setFilteredOrders(mockOrders)
      setLastUpdated(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchOrders()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, statusFilter, searchTerm])

  // Update filtered orders when orders or filters change
  useEffect(() => {
    let filtered = orders

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.loadType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredOrders(filtered)
  }, [orders, statusFilter, searchTerm])

  const handleFilter = () => {
    // Trigger a fresh fetch with current filters
    fetchOrders()
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-blue-100 text-blue-800",
      picked_up: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
    }

    const labels = {
      confirmed: "Confirmed",
      picked_up: "Picked Up",
      in_transit: "In Transit",
      delivered: "Delivered",
    }

    return <Badge className={colors[status as keyof typeof colors]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Clock className="h-4 w-4" />
      case "picked_up":
        return <Package className="h-4 w-4" />
      case "in_transit":
        return <Truck className="h-4 w-4" />
      case "delivered":
        return <MapPin className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Tracking</h2>
          <p className="text-muted-foreground">Track your transport orders in real-time</p>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Tracking</h2>
          <p className="text-muted-foreground">Track your transport orders in real-time</p>
        </div>
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-red-600 mb-2">{error}</div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Tracking</h2>
          <p className="text-muted-foreground">Track your transport orders in real-time</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            {autoRefresh ? <Wifi className="h-4 w-4 mr-1" /> : <WifiOff className="h-4 w-4 mr-1" />}
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search Orders</label>
              <Input
                placeholder="Search by order number, load type, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleFilter}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Grid */}
      <div className="grid gap-6">
        {filteredOrders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    {order.orderNumber}
                  </CardTitle>
                  <CardDescription>
                    {order.loadType} • {order.estimatedTons} tons
                  </CardDescription>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <div className="text-sm text-muted-foreground mt-1">Created: {order.createdAt}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Route Information */}
              <div>
                <h4 className="font-medium mb-2">Route</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span>From: {order.fromLocation}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    <span>To: {order.toLocation}</span>
                  </div>
                  {order.currentLocation && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-600" />
                      <span>Current: {order.currentLocation}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-muted-foreground">No orders found matching your criteria.</div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter((o) => o.status === "pending" || o.status === "confirmed").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {orders.filter((o) => o.status === "picked_up" || o.status === "in_transit").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently moving</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {orders.filter((o) => o.status === "delivered").length}
            </div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
