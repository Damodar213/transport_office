"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Check, X, Filter, Calendar, Truck, MapPin, Building } from "lucide-react"

interface SupplierOrder {
  id: number
  supplier_id: number
  supplier_name: string
  supplier_company: string
  state: string
  district: string
  place: string
  taluk?: string
  vehicle_number: string
  body_type: string
  status: "pending" | "confirmed" | "rejected"
  created_at: string
  submitted_at: string
  admin_notes?: string
  admin_action_date?: string
}

export function SupplierOrderManagement() {
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [confirmedOrders, setConfirmedOrders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [isFetchingConfirmed, setIsFetchingConfirmed] = useState(true)
  const [error, setError] = useState("")
  const [filters, setFilters] = useState({
    status: "all",
    state: "all",
    supplier: "",
  })

  const states = ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Kerala", "Maharashtra"]

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsFetching(true)
      console.log("Fetching orders from /api/supplier-orders")
      const response = await fetch("/api/supplier-orders")
      console.log("Orders response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Orders data received:", data)
        setOrders(data.orders)
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch orders:", errorData)
        setError("Failed to fetch orders")
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError("Failed to fetch orders")
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch confirmed orders from API
  const fetchConfirmedOrders = async () => {
    try {
      setIsFetchingConfirmed(true)
      console.log("Fetching confirmed orders from /api/admin/confirmed-orders")
      const response = await fetch("/api/admin/confirmed-orders")
      console.log("Confirmed orders response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Confirmed orders data received:", data)
        setConfirmedOrders(data.confirmedOrders)
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch confirmed orders:", errorData)
        setError("Failed to fetch confirmed orders")
      }
    } catch (err) {
      console.error("Error fetching confirmed orders:", err)
      setError("Failed to fetch confirmed orders")
    } finally {
      setIsFetchingConfirmed(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchConfirmedOrders()
  }, [])

  const handleConfirm = async (orderId: number, notes: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/supplier-orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          status: "confirmed",
          adminNotes: notes,
          adminActionDate: new Date().toISOString().replace("T", " ").substring(0, 16),
        }),
      })

      if (response.ok) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: "confirmed",
                  admin_notes: notes,
                  admin_action_date: new Date().toISOString().replace("T", " ").substring(0, 16),
                }
              : order,
          ),
        )

        // Refresh confirmed orders to show the newly confirmed order
        await fetchConfirmedOrders()

        setSelectedOrder(null)
        setAdminNotes("")
      } else {
        setError("Failed to confirm order")
      }
    } catch (error) {
      console.error("Confirmation error:", error)
      setError("Failed to confirm order")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (orderId: number, notes: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/supplier-orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: orderId,
          status: "rejected",
          admin_notes: notes,
          admin_action_date: new Date().toISOString().replace("T", " ").substring(0, 16),
        }),
      })

      if (response.ok) {
        // Update local state
        setOrders((prev) =>
          prev.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: "rejected",
                  admin_notes: notes,
                  admin_action_date: new Date().toISOString().replace("T", " ").substring(0, 16),
                }
              : order,
          ),
        )

        // Refresh confirmed orders in case this affects any confirmed orders
        await fetchConfirmedOrders()

        setSelectedOrder(null)
        setAdminNotes("")
      } else {
        setError("Failed to reject order")
      }
    } catch (error) {
      console.error("Rejection error:", error)
      setError("Failed to reject order")
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredOrders = orders.filter((order) => {
    if (filters.status !== "all" && order.status !== filters.status) return false
    if (filters.state !== "all" && order.state !== filters.state) return false
    if (filters.supplier && !order.supplierCompany.toLowerCase().includes(filters.supplier.toLowerCase())) return false
    return true
  })

  const getStatusCount = (status: string) => {
    return orders.filter((order) => order.status === status).length
  }

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Supplier Order Management</h2>
          <p className="text-muted-foreground">Review and manage transport orders submitted by suppliers</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading orders...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Supplier Order Management</h2>
        <p className="text-muted-foreground">Review and manage transport orders submitted by suppliers</p>
      </div>

      {/* Loading States */}
      {(isFetching || isFetchingConfirmed) && (
        <Alert className="mb-6">
          <AlertDescription>
            {isFetching ? "Loading supplier orders..." : ""}
            {isFetchingConfirmed ? "Loading confirmed orders..." : ""}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{getStatusCount("pending")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{getStatusCount("confirmed")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{getStatusCount("rejected")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <select
                className="w-full p-2 border rounded-md"
                value={filters.state}
                onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
              >
                <option value="all">All States</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Supplier</label>
              <input
                type="text"
                placeholder="Filter by supplier..."
                className="w-full p-2 border rounded-md"
                value={filters.supplier}
                onChange={(e) => setFilters((prev) => ({ ...prev, supplier: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Supplier Vehicle Locations</CardTitle>
          <CardDescription>{filteredOrders.length} orders found</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No supplier orders found matching the current filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.supplier_company}</div>
                        <div className="text-sm text-muted-foreground">{order.supplier_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{order.place}, {order.district}</div>
                          <div className="text-muted-foreground">{order.state}</div>
                          {order.taluk && <div className="text-muted-foreground">{order.taluk}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div className="font-medium">{order.vehicle_number}</div>
                          <div className="text-muted-foreground">{order.body_type}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div>{order.submitted_at.split(" ")[0]}</div>
                          <div className="text-muted-foreground">{order.submitted_at.split(" ")[1]}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {order.status === "pending" ? "Review" : "View"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Order Review - {order.supplier_company}</DialogTitle>
                            <DialogDescription>
                              Review transport order details and take action
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Order Details */}
                            <div className="space-y-4">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Building className="h-5 w-5" />
                                Order Details
                              </h3>
                              <div className="space-y-3 p-4 bg-muted/50 rounded">
                                <div>
                                  <strong>Supplier:</strong> {order.supplier_name} ({order.supplier_company})
                                </div>
                                <div>
                                  <strong>Location:</strong> {order.place}, {order.district}, {order.state}
                                </div>
                                {order.taluk && (
                                  <div>
                                    <strong>Taluk:</strong> {order.taluk}
                                  </div>
                                )}
                                <div>
                                  <strong>Vehicle Number:</strong> {order.vehicle_number}
                                </div>
                                <div>
                                  <strong>Body Type:</strong> {order.body_type}
                                </div>
                                <div>
                                  <strong>Created:</strong> {order.created_at}
                                </div>
                                <div>
                                  <strong>Submitted:</strong> {order.submitted_at}
                                </div>
                                {order.admin_action_date && (
                                  <div>
                                    <strong>Admin Action:</strong> {order.admin_action_date}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Admin Actions */}
                            <div className="space-y-4">
                              <h3 className="font-semibold">Admin Actions</h3>

                              {order.status === "pending" && (
                                <>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Admin Notes</label>
                                    <Textarea
                                      value={adminNotes}
                                      onChange={(e) => setAdminNotes(e.target.value)}
                                      placeholder="Enter your review notes..."
                                      rows={3}
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleConfirm(order.id, adminNotes)}
                                      disabled={isProcessing}
                                      className="flex-1"
                                    >
                                      <Check className="h-4 w-4 mr-2" />
                                      {isProcessing ? "Confirming..." : "Confirm Order"}
                                    </Button>
                                    <Button
                                      onClick={() => handleReject(order.id, adminNotes)}
                                      disabled={isProcessing}
                                      variant="destructive"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject Order
                                    </Button>
                                  </div>
                                </>
                              )}

                              {order.status !== "pending" && order.admin_notes && (
                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Admin Notes</label>
                                  <Alert>
                                    <AlertDescription>{order.admin_notes}</AlertDescription>
                                  </Alert>
                                </div>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirmed Orders Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Confirmed Orders</CardTitle>
          <CardDescription>Orders that have been confirmed and are ready for execution</CardDescription>
        </CardHeader>
        <CardContent>
          {isFetchingConfirmed ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading confirmed orders...
            </div>
          ) : confirmedOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No confirmed orders found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Transport Order ID</TableHead>
                  <TableHead>Supplier ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {confirmedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.transport_order_id}</TableCell>
                    <TableCell>{order.supplier_id}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.notes || "No notes"}</TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
