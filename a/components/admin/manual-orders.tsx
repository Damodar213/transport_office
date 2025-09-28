"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Search, Filter, Eye, Edit, Truck } from "lucide-react"

interface ManualOrder {
  id: number
  order_number: string
  load_type: string
  estimated_tons: number
  delivery_place: string
  from_location: string
  status: string
  created_by: string
  assigned_supplier_id?: string
  assigned_supplier_name?: string
  admin_notes?: string
  special_instructions?: string
  required_date: string
  created_at: string
  updated_at: string
}

interface Supplier {
  id: string
  companyName: string
  availableVehicles: number
  rating: number
  location: string
  isVerified: boolean
}

export function ManualOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<ManualOrder[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
  })
  const [selectedOrder, setSelectedOrder] = useState<ManualOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch manual orders
  const fetchManualOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters.status !== "all") {
        params.append("status", filters.status)
      }
      
      const response = await fetch(`/api/admin/manual-orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch manual orders")
      }
      
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (err) {
      console.error("Error fetching manual orders:", err)
      setError(err instanceof Error ? err.message : "Failed to load manual orders")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch suppliers for assignment
  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/admin/available-suppliers")
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers")
      }
      
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (err) {
      console.error("Error fetching suppliers:", err)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchManualOrders()
    fetchSuppliers()
  }, [])

  // Refresh data when filters change
  useEffect(() => {
    fetchManualOrders()
  }, [filters])

  // Filter orders based on search
  const filteredOrders = orders.filter(order => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      return (
        order.order_number.toLowerCase().includes(searchTerm) ||
        order.load_type.toLowerCase().includes(searchTerm) ||
        order.delivery_place.toLowerCase().includes(searchTerm) ||
        (order.assigned_supplier_name && order.assigned_supplier_name.toLowerCase().includes(searchTerm))
      )
    }
    return true
  })

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const },
      assigned: { label: "Assigned", variant: "default" as const },
      in_progress: { label: "In Progress", variant: "default" as const },
      completed: { label: "Completed", variant: "default" as const },
      cancelled: { label: "Cancelled", variant: "destructive" as const },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // Handle order assignment
  const handleAssignOrder = async () => {
    if (!selectedOrder || !selectedSupplier) return

    setIsProcessing(true)
    try {
      const supplier = suppliers.find(s => s.id === selectedSupplier)
      if (!supplier) {
        throw new Error("Selected supplier not found")
      }

      const response = await fetch("/api/admin/manual-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: "assign",
          supplierId: selectedSupplier,
          supplierName: supplier.companyName,
          adminNotes: adminNotes,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to assign order")
      }

      toast({
        title: "Order Assigned Successfully!",
        description: `Order ${selectedOrder.order_number} has been assigned to ${supplier.companyName}`,
      })

      // Refresh orders
      await fetchManualOrders()
      setIsAssignDialogOpen(false)
      setSelectedSupplier("")
      setAdminNotes("")
    } catch (error) {
      console.error("Assignment error:", error)
      toast({
        title: "Assignment Failed",
        description: error instanceof Error ? error.message : "Failed to assign order",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle status update
  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/manual-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          action: "update_status",
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update status")
      }

      toast({
        title: "Status Updated",
        description: `Order status updated to ${newStatus}`,
      })

      // Refresh orders
      await fetchManualOrders()
    } catch (error) {
      console.error("Status update error:", error)
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Orders</CardTitle>
          <CardDescription>Loading manual orders...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manual Orders</CardTitle>
          <CardDescription>Error loading manual orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-600">{error}</div>
          <Button onClick={fetchManualOrders} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Manual Orders
          </CardTitle>
          <CardDescription>
            Manage manual orders created by admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Orders Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Load Type</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Delivery Place</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No manual orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => (
                    <TableRow key={`${order.id}-${order.order_number}-${index}`}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.load_type}</TableCell>
                      <TableCell>{order.estimated_tons} tons</TableCell>
                      <TableCell>{order.delivery_place}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {order.assigned_supplier_name || "Not assigned"}
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setIsDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsAssignDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Detailed information for order {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Order Number</Label>
                  <div className="font-medium">{selectedOrder.order_number}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(selectedOrder.status)}</div>
                </div>
                <div>
                  <Label>Load Type</Label>
                  <div>{selectedOrder.load_type}</div>
                </div>
                <div>
                  <Label>Weight</Label>
                  <div>{selectedOrder.estimated_tons} tons</div>
                </div>
                <div>
                  <Label>From Location</Label>
                  <div>{selectedOrder.from_location}</div>
                </div>
                <div>
                  <Label>Delivery Place</Label>
                  <div>{selectedOrder.delivery_place}</div>
                </div>
                <div>
                  <Label>Assigned To</Label>
                  <div>{selectedOrder.assigned_supplier_name || "Not assigned"}</div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <div>{selectedOrder.created_by}</div>
                </div>
              </div>
              
              {selectedOrder.admin_notes && (
                <div>
                  <Label>Admin Notes</Label>
                  <div className="p-3 bg-gray-50 rounded-md">{selectedOrder.admin_notes}</div>
                </div>
              )}
              
              {selectedOrder.special_instructions && (
                <div>
                  <Label>Special Instructions</Label>
                  <div className="p-3 bg-gray-50 rounded-md">{selectedOrder.special_instructions}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Order Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Order</DialogTitle>
            <DialogDescription>
              Assign order {selectedOrder?.order_number} to a supplier
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Select Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter((s) => s.isVerified)
                    .map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.companyName} ({supplier.availableVehicles} vehicles)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes for the supplier..."
                rows={3}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleAssignOrder} 
                disabled={isProcessing || !selectedSupplier}
                className="flex-1"
              >
                {isProcessing ? "Assigning..." : "Assign Order"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAssignDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

