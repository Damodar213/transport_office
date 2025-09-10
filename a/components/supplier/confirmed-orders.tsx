"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Filter, Trash, FileText, Table as TableIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

interface ConfirmedOrder {
  id: number
  transport_order_id: number
  supplier_id: number
  status: string
  notes?: string
  created_at: string
  updated_at: string
  state: string
  district: string
  place: string
  taluk?: string
  vehicle_number: string
  body_type: string
  admin_notes?: string
  admin_action_date?: string
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
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch confirmed orders from database
  const fetchConfirmedOrders = async () => {
    try {
      setIsFetching(true)
      
      // Get current supplier ID from auth
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        setError("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id
      
      const response = await fetch(`/api/supplier-confirmed-orders?supplierId=${supplierId}`)
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
          order.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredOrders(filtered)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      confirmed: "bg-green-100 text-green-800",
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

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text("Confirmed Orders Report", 14, 22)
      
      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
      
      // Prepare table data
      const tableData = filteredOrders.map(order => [
        order.transport_order_id,
        order.place,
        `${order.body_type} - ${order.vehicle_number}`,
        `${order.place}, ${order.district}, ${order.state}`,
        order.vehicle_number,
        order.admin_action_date ? new Date(order.admin_action_date).toLocaleDateString() : "Not set",
        order.status.toUpperCase(),
        "Confirmed by Admin"
      ])
      
      // Add table
      autoTable(doc, {
        head: [['Order ID', 'Location', 'Vehicle Details', 'Route', 'Assigned Truck', 'Delivery Date', 'Status', 'Driver']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      })
      
      // Save the PDF
      doc.save(`confirmed-orders-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF")
    }
  }

  const handleExportExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = filteredOrders.map(order => ({
        'Order ID': order.transport_order_id,
        'Location': order.place,
        'Vehicle Details': `${order.body_type} - ${order.vehicle_number}`,
        'Route': `${order.place}, ${order.district}, ${order.state}`,
        'Assigned Truck': order.vehicle_number,
        'Delivery Date': order.admin_action_date ? new Date(order.admin_action_date).toLocaleDateString() : "Not set",
        'Status': order.status.toUpperCase(),
        'Driver': "Confirmed by Admin",
        'Created Date': new Date(order.created_at).toLocaleDateString(),
        'Updated Date': new Date(order.updated_at).toLocaleDateString()
      }))
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(excelData)
      
      // Set column widths
      const colWidths = [
        { wch: 10 }, // Order ID
        { wch: 15 }, // Location
        { wch: 25 }, // Vehicle Details
        { wch: 30 }, // Route
        { wch: 15 }, // Assigned Truck
        { wch: 15 }, // Delivery Date
        { wch: 12 }, // Status
        { wch: 20 }, // Driver
        { wch: 15 }, // Created Date
        { wch: 15 }  // Updated Date
      ]
      ws['!cols'] = colWidths
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Confirmed Orders")
      
      // Save the Excel file
      XLSX.writeFile(wb, `confirmed-orders-${new Date().toISOString().split('T')[0]}.xlsx`)
    } catch (error) {
      console.error("Error generating Excel:", error)
      alert("Failed to generate Excel file")
    }
  }

  const handleViewOrder = (order: ConfirmedOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              <TableIcon className="h-4 w-4 mr-2" />
              Export as Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
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
                    <TableCell>{order.place}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.body_type}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.vehicle_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">{order.place}, {order.district}</div>
                        <div className="text-sm text-muted-foreground">{order.state}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{order.vehicle_number}</TableCell>
                    <TableCell>{order.admin_action_date ? new Date(order.admin_action_date).toLocaleDateString() : "Not set"}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <span className="text-muted-foreground text-sm">Confirmed by Admin</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
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

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.transport_order_id}</DialogTitle>
            <DialogDescription>
              Complete information about this confirmed order
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Order Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Order ID:</span>
                      <span>{selectedOrder.transport_order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Supplier ID:</span>
                      <span>{selectedOrder.supplier_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Created Date:</span>
                      <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Updated Date:</span>
                      <span>{new Date(selectedOrder.updated_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Vehicle Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Vehicle Number:</span>
                      <span>{selectedOrder.vehicle_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Body Type:</span>
                      <span>{selectedOrder.body_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Delivery Date:</span>
                      <span>{selectedOrder.admin_action_date ? new Date(selectedOrder.admin_action_date).toLocaleDateString() : "Not set"}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Location Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Location Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Current Location</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">State:</span> {selectedOrder.state}</div>
                        <div><span className="font-medium">District:</span> {selectedOrder.district}</div>
                        <div><span className="font-medium">Place:</span> {selectedOrder.place}</div>
                        {selectedOrder.taluk && (
                          <div><span className="font-medium">Taluk:</span> {selectedOrder.taluk}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Route Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">From:</span> {selectedOrder.place}, {selectedOrder.district}</div>
                        <div><span className="font-medium">State:</span> {selectedOrder.state}</div>
                        <div><span className="font-medium">Assigned Truck:</span> {selectedOrder.vehicle_number}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              {(selectedOrder.admin_notes || selectedOrder.notes) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.admin_notes || selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Confirmation Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Confirmation Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Confirmed By:</span>
                        <span className="text-sm">Admin</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Confirmation Date:</span>
                        <span className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Last Updated:</span>
                        <span className="text-sm">{new Date(selectedOrder.updated_at).toLocaleString()}</span>
                      </div>
                      {selectedOrder.admin_action_date && (
                        <div className="flex justify-between">
                          <span className="font-medium">Action Date:</span>
                          <span className="text-sm">{new Date(selectedOrder.admin_action_date).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

