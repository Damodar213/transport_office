"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { MapPin, Truck, Package, Clock, Phone, Eye } from "lucide-react"

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

export function OrderTracking() {
  const [orders] = useState<Order[]>([
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
  ])

  const [filteredOrders, setFilteredOrders] = useState(orders)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  const handleFilter = () => {
    let filtered = orders

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.loadType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredOrders(filtered)
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Order Tracking</h2>
        <p className="text-muted-foreground">Track your transport orders in real-time</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Search Orders</label>
              <Input
                placeholder="Search by order number, load type, or vehicle..."
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <h4 className="font-medium mb-2">Transport Details</h4>
                  <div className="space-y-1 text-sm">
                    <div>Supplier: {order.supplierCompany}</div>
                    <div>Vehicle: {order.vehicleNumber}</div>
                    <div>Driver: {order.driverName}</div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {order.status !== "confirmed" && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{order.progress}%</span>
                  </div>
                  <Progress value={order.progress} className="h-2" />
                </div>
              )}

              {/* Timeline */}
              <div>
                <h4 className="font-medium mb-2">Timeline</h4>
                <div className="space-y-2 text-sm">
                  {order.actualPickup && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-600" />
                      <span>Picked up: {order.actualPickup}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span>Estimated delivery: {order.estimatedDelivery}</span>
                  </div>
                  {order.actualDelivery && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <span>Delivered: {order.actualDelivery}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(`tel:${order.driverContact}`)}>
                  <Phone className="h-4 w-4 mr-1" />
                  Call Driver
                </Button>
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "in_transit").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "delivered").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Delivery Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3 days</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
