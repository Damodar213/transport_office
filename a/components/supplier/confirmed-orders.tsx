"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Filter, Trash } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConfirmedOrder {
  id: number
  transport_order_id: number
  supplier_id: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  transport_order_details: {
    state: string
    district: string
    place: string
    taluk?: string
    vehicle_number: string
    body_type: string
  }
  supplier_company: string
  driver_details: {
    driver_name: string
    mobile: string
  }
  truck_details: {
    vehicle_number: string
    body_type: string
    capacity: string
  }
}

interface ConfirmedOrdersProps {
  onDataChange?: () => void
}

export function ConfirmedOrders({ onDataChange }: ConfirmedOrdersProps) {
  const [orders, setOrders] = useState<ConfirmedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ConfirmedOrder[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState("")

  // Fetch confirmed orders from database
  const fetchConfirmedOrders = async () => {
    try {
      setIsFetching(true)
      const response = await fetch("/api/supplier-confirmed-orders?supplierId=111111") // Use the actual supplier ID from your existing data
      if (response.ok) {
        const data = await response.json()
        setOrders(data.confirmedOrders)
        setFilteredOrders(data.confirmedOrders)
      } else {
        setError("Failed to fetch confirmed orders")
      }
    } catch (err) {
      setError("Failed to fetch confirmed orders")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchConfirmedOrders()
  }, [])

  const handleFilter = () => {
    let filtered = orders

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.transport_order_details?.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.transport_order_details?.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.transport_order_details?.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.transport_order_details?.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.driver_details?.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.truck_details?.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredOrders(filtered)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      assigned: "bg-blue-100 text-blue-800",
      picked_up: "bg-yellow-100 text-yellow-800",
      in_transit: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const handleExport = () => {
    // Mock export functionality
    console.log("Exporting orders...")
  }

  // Delete confirmed order
  const handleDelete = async (orderId: number) => {
    if (!confirm("Are you sure you want to delete this confirmed order? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/supplier-confirmed-orders?id=${orderId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Remove the deleted order from local state
        setOrders((prev) => prev.filter((order) => order.id !== orderId))
        setFilteredOrders((prev) => prev.filter((order) => order.id !== orderId))
        onDataChange?.() // Refresh dashboard stats
        console.log("Confirmed order deleted successfully")
      } else {
        const errorData = await response.json()
        console.error("Failed to delete confirmed order:", errorData)
        alert("Failed to delete confirmed order")
      }
    } catch (err) {
      console.error("Error deleting confirmed order:", err)
      alert("Failed to delete confirmed order")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Confirmed Orders</h2>
          <p className="text-muted-foreground">Orders confirmed by admin and ready for execution</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search by location, vehicle, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleFilter} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmed Vehicle Locations</CardTitle>
          <CardDescription>{filteredOrders.length} orders found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Vehicle Details</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Assigned Truck</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p>Loading confirmed orders...</p>
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p>No confirmed orders found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.transport_order_id}</TableCell>
                    <TableCell>{order.transport_order_details?.place}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.transport_order_details?.body_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.truck_details?.capacity_tons || "N/A"} tons
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{order.transport_order_details?.place}, {order.transport_order_details?.district}</div>
                        <div className="text-sm text-muted-foreground">{order.transport_order_details?.state}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.truck_details?.vehicle_number || "Not assigned"}</TableCell>
                    <TableCell>{order.delivery_date || "Not set"}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {order.driver_details ? (
                        <div>
                          <div className="text-sm font-medium">{order.driver_details.driver_name}</div>
                          <div className="text-xs text-muted-foreground">{order.driver_details.mobile}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(order.id)}>
                          <Trash className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Confirmed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "in_transit").length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.filter((o) => o.status === "delivered").length}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

