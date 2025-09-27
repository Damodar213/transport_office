"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Filter, FileText, Table as TableIcon, MapPin, Calendar, Package, User, Truck, Phone, RefreshCw, Trash2, Send, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
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

interface Buyer {
  user_id: string
  name: string
  email: string
  company_name: string
}

interface ConfirmedOrder {
  id: number
  order_id: number
  supplier_id: string
  submitted_by: string
  submitted_at: string
  notification_sent: boolean
  whatsapp_sent: boolean
  status: string
  order_number: string
  load_type: string
  from_state: string
  from_district: string
  from_place: string
  from_taluk?: string
  to_state: string
  to_district: string
  to_place: string
  to_taluk?: string
  estimated_tons?: number
  number_of_goods?: number
  delivery_place: string
  required_date?: string
  special_instructions?: string
  order_status: string
  rate?: number
  distance_km?: number
  order_created_at: string
  order_updated_at: string
  buyer_company?: string
  buyer_name?: string
  buyer_email?: string
  buyer_mobile?: string
  supplier_name?: string
  supplier_company?: string
  driver_name?: string
  driver_mobile?: string
  vehicle_number?: string
  vehicle_type?: string
  is_sent_to_buyer?: boolean
  order_type?: string
}


export function SuppliersConfirmed() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<ConfirmedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ConfirmedOrder[]>([])
  const [isFetching, setIsFetching] = useState(true) // Start with true to show loading initially
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState<string>("")
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [buyers, setBuyers] = useState<any[]>([])

  // Fetch confirmed orders from all suppliers
  const fetchConfirmedOrders = async (forceRefresh = false) => {
    try {
      setIsFetching(true)
      setError("")
      
      // Always use force refresh to get latest data
      const url = `/api/admin/suppliers-confirmed?force_refresh=${Date.now()}`
      
      console.log("Fetching confirmed orders from:", url)
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Received confirmed orders data:", data)
        console.log("Orders count:", data.orders?.length || 0)
        console.log("Debug info:", data.debug)
        
        console.log("Setting orders from API response...")
        setOrders(data.orders || [])
        setFilteredOrders(data.orders || [])
        
        if (data.orders?.length === 0) {
          console.log("No confirmed orders found")
        } else {
          console.log("Sample order properties after refresh:")
          data.orders.forEach((order: any, index: number) => {
            if (index < 3) { // Log first 3 orders
              console.log(`Order ${index + 1}:`, {
                id: order.id,
                order_id: order.order_id,
                order_number: order.order_number,
                order_type: order.order_type,
                status: order.status,
                order_status: order.order_status
              })
            }
          })
        }
      } else {
        const errorData = await response.json()
        console.error("Failed to fetch confirmed orders:", errorData)
        setError(`Failed to fetch confirmed orders: ${errorData.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error("Error fetching confirmed orders:", err)
      setError(`Failed to fetch confirmed orders: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch buyers for send to buyer functionality
  const fetchBuyers = async () => {
    try {
      const response = await fetch("/api/admin/buyers")
      if (response.ok) {
        const data = await response.json()
        setBuyers(data.buyers || [])
      }
    } catch (error) {
      console.error("Failed to fetch buyers:", error)
    }
  }

  // Handle send to buyer
  const handleSendToBuyer = (order: ConfirmedOrder) => {
    console.log("Selected order for sending to buyer:", order)
    console.log("Order details:", {
      order_number: order.order_number,
      load_type: order.load_type,
      from_place: order.from_place,
      to_place: order.to_place,
      driver_name: order.driver_name,
      vehicle_number: order.vehicle_number
    })
    setSelectedOrder(order)
    setIsSendDialogOpen(true)
    fetchBuyers()
  }

  // Handle confirm send to buyer
  const handleConfirmSend = async () => {
    if (!selectedOrder || !selectedBuyer) return

    console.log("Sending order to buyer:", {
      orderSubmissionId: selectedOrder.id,
      buyerId: selectedBuyer,
      selectedOrder: selectedOrder
    })

    setIsSending(true)
    try {
      console.log("Sending order to buyer:", { orderSubmissionId: selectedOrder.id, buyerId: selectedBuyer })
      const response = await fetch("/api/admin/send-to-buyer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderSubmissionId: selectedOrder.id,
          buyerId: selectedBuyer,
        }),
      })

      console.log("Response status:", response.status, response.statusText)
      if (response.ok) {
        const result = await response.json()
        console.log("Order sent successfully:", result)
        // Refresh the orders list
        fetchConfirmedOrders(true)
        setIsSendDialogOpen(false)
        setSelectedBuyer("")
        setSelectedOrder(null)
        toast({
          title: "Success",
          description: "Order sent to buyer successfully",
        })
      } else {
        let errorMessage = "Failed to send order to buyer"
        try {
          const errorData = await response.json()
          console.error("API Error:", errorData)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (jsonError) {
          console.error("Failed to parse error response:", jsonError)
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sending order to buyer:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send order to buyer",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Handle mark as complete for manual orders
  const handleMarkAsComplete = async (order: ConfirmedOrder) => {
    console.log("=== MARK AS COMPLETE BUTTON CLICKED ===")
    console.log("Full order object:", JSON.stringify(order, null, 2))
    console.log("Order ID:", order.order_id)
    console.log("Order status:", order.status)
    console.log("Order type:", order.order_type)
    console.log("isSending state:", isSending)
    
    // Show alert to confirm function is called
    alert(`Mark as Complete clicked for order: ${order.order_number} (ID: ${order.order_id})`)
    
    try {
      setIsSending(true)
      console.log("Set isSending to true")
      
      const requestBody = {
        orderNumber: order.order_number,
        status: "completed"
      }
      
      console.log("Sending request to update order status:", requestBody)
      
      // Update the manual order status to completed
      const response = await fetch("/api/admin/update-manual-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Response status:", response.status)
      console.log("Response ok:", response.ok)

      if (response.ok) {
        const responseData = await response.json()
        console.log("Success response:", responseData)
        
        // Immediately update the local state to reflect the change
        setOrders(prevOrders => 
          prevOrders.map(o => 
            o.id === order.id 
              ? { ...o, status: 'completed' }
              : o
          )
        )
        setFilteredOrders(prevFiltered => 
          prevFiltered.map(o => 
            o.id === order.id 
              ? { ...o, status: 'completed' }
              : o
          )
        )
        
        toast({
          title: "Success",
          description: `Manual order ${order.order_number} marked as complete`,
        })
        
        // Wait a moment then refresh to get the latest data from server
        setTimeout(() => {
          console.log("Refreshing orders after successful update...")
          fetchConfirmedOrders(true)
        }, 1000)
      } else {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to mark order as complete",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error marking order as complete:", error)
      toast({
        title: "Error",
        description: "Failed to mark order as complete",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  useEffect(() => {
    console.log("SuppliersConfirmed component mounted, fetching orders...")
    fetchConfirmedOrders()
    
    // Temporarily disable periodic refresh completely to debug the issue
    // Set up periodic refresh every 60 seconds (increased from 30 seconds)
    const interval = setInterval(() => {
      console.log("Periodic refresh triggered for suppliers confirmed")
      fetchConfirmedOrders(true)
    }, 60000) // Changed from 30000 to 60000 (60 seconds)
    
    return () => {
      console.log("SuppliersConfirmed component unmounting, clearing interval")
      clearInterval(interval)
    }
  }, [])

  const handleFilter = () => {
    let filtered = orders

    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter((order) =>
        order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.buyer_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.supplier_company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    console.log("Filtered orders:", filtered.length)
    console.log("Sample filtered order:", filtered[0])
    setFilteredOrders(filtered)
  }

  useEffect(() => {
    handleFilter()
  }, [orders, statusFilter, searchTerm])

  const getStatusBadge = (status: string) => {
    const colors = {
      accepted: "bg-green-100 text-green-800",
      confirmed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return (
      <Badge className={colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"}>
        {status.replace("_", " ").toUpperCase()}
      </Badge>
    )
  }

  const handleViewOrder = (order: ConfirmedOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }


  const handleDeleteOrder = (orderId: number) => {
    setDeleteOrderId(orderId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteOrderId) return

    try {
      setIsDeleting(true)
      setError("")

      const response = await fetch(`/api/admin/suppliers-confirmed?id=${deleteOrderId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Remove the deleted order from the local state
        setOrders(prev => prev.filter(order => order.id !== deleteOrderId))
        setFilteredOrders(prev => prev.filter(order => order.id !== deleteOrderId))
        setIsDeleteDialogOpen(false)
        setDeleteOrderId(null)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete order")
      }
    } catch (err) {
      setError("Failed to delete order")
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setDeleteOrderId(null)
  }


  const handleExportPDF = () => {
    try {
      const doc = new jsPDF()
      
      // Add title
      doc.setFontSize(20)
      doc.text("Suppliers Confirmed Orders Report", 14, 22)
      
      // Add date
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30)
      
      // Prepare table data
      const tableData = filteredOrders.map(order => [
        order.order_number,
        order.buyer_company || 'N/A',
        order.supplier_company || 'N/A',
        order.driver_name || 'N/A',
        order.vehicle_number || 'N/A',
        order.load_type,
        `${order.from_place} → ${order.to_place}`,
        new Date(order.submitted_at).toLocaleDateString(),
        order.status.toUpperCase()
      ])
      
      // Add table
      autoTable(doc, {
        head: [['Order #', 'Buyer', 'Supplier', 'Driver', 'Vehicle', 'Load Type', 'Route', 'Confirmed Date', 'Status']],
        body: tableData,
        startY: 40,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
      })
      
      doc.save('suppliers-confirmed-orders.pdf')
    } catch (error) {
      console.error('Error generating PDF:', error)
    }
  }

  const handleExportExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(
        filteredOrders.map(order => ({
          'Order Number': order.order_number,
          'Buyer Company': order.buyer_company || 'N/A',
          'Supplier Company': order.supplier_company || 'N/A',
          'Driver Name': order.driver_name || 'N/A',
          'Driver Mobile': order.driver_mobile || 'N/A',
          'Vehicle Number': order.vehicle_number || 'N/A',
          'Vehicle Type': order.vehicle_type || 'N/A',
          'Load Type': order.load_type,
          'From': order.from_place,
          'To': order.to_place,
          'Estimated Tons': order.estimated_tons || 'N/A',
          'Confirmed Date': new Date(order.submitted_at).toLocaleDateString(),
          'Status': order.status.toUpperCase()
        }))
      )
      
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Suppliers Confirmed Orders')
      
      XLSX.writeFile(workbook, 'suppliers-confirmed-orders.xlsx')
    } catch (error) {
      console.error('Error generating Excel:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suppliers Confirmed Orders</h2>
          <p className="text-muted-foreground">Orders confirmed by suppliers with driver and vehicle assignments</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchConfirmedOrders(true)}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
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
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by order number, buyer, supplier, driver, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleFilter}>
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {isFetching ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h4 className="text-lg font-medium mb-2">Loading Orders...</h4>
            <p className="text-muted-foreground">Please wait while we fetch the confirmed orders.</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Confirmed Orders</h4>
            <p className="text-muted-foreground">No suppliers have confirmed any orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => (
            <Card key={`${order.id}-${order.order_number}-${index}`} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{order.order_number}</h4>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{order.load_type}</span>
                        {order.estimated_tons && (
                          <span className="text-muted-foreground">({order.estimated_tons} tons)</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{order.from_place} → {order.to_place}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{order.driver_name || 'N/A'}</span>
                        {order.driver_mobile && (
                          <span className="text-muted-foreground">({order.driver_mobile})</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span>{order.vehicle_number || 'N/A'}</span>
                        {order.vehicle_type && (
                          <span className="text-muted-foreground">({order.vehicle_type})</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <p><span className="font-medium">Buyer:</span> {order.buyer_name || 'N/A'}</p>
                        {order.buyer_mobile && (
                          <p><span className="font-medium">Contact:</span> {order.buyer_mobile}</p>
                        )}
                      </div>
                      <div>
                        <p><span className="font-medium">Supplier:</span> {order.supplier_company || 'N/A'}</p>
                        <p><span className="font-medium">Confirmed:</span> {new Date(order.submitted_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {order.order_type === 'buyer_request' && !order.is_sent_to_buyer && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendToBuyer(order)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to Buyer
                      </Button>
                    )}
                    {order.order_type === 'manual_order' && order.status !== 'completed' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            console.log("Button clicked for order:", order.order_number)
                            handleMarkAsComplete(order)
                          }}
                          disabled={isSending}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isSending ? "Marking..." : "Mark as Complete"}
                        </Button>
                      </>
                    )}
                    {order.order_type === 'manual_order' && order.status === 'completed' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Complete information about the confirmed order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Order Number:</span> {selectedOrder.order_number}</p>
                    <p><span className="font-medium">Load Type:</span> {selectedOrder.load_type}</p>
                    <p><span className="font-medium">Status:</span> {selectedOrder.status}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Route Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">From:</span> {selectedOrder.from_place}, {selectedOrder.from_district}</p>
                    <p><span className="font-medium">To:</span> {selectedOrder.to_place}, {selectedOrder.to_district}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Supplier</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Supplier:</span> {selectedOrder.supplier_company || 'N/A'}</p>
                  <p><span className="font-medium">Driver:</span> {selectedOrder.driver_name || 'N/A'}</p>
                  <p><span className="font-medium">Driver Mobile:</span> {selectedOrder.driver_mobile || 'N/A'}</p>
                  <p><span className="font-medium">Vehicle:</span> {selectedOrder.vehicle_number || 'N/A'}</p>
                </div>
              </div>

              {selectedOrder.special_instructions && (
                <div>
                  <h4 className="font-medium mb-2">Special Instructions</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Confirmed Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this confirmed order? This action cannot be undone and will also remove any related accepted requests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send to Buyer Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Order to Buyer</DialogTitle>
            <DialogDescription>
              Select a buyer to send the confirmed order to their accepted requests.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Order Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Order Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Order:</span>
                  <span>{selectedOrder?.order_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Load:</span>
                  <span>{selectedOrder?.load_type || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Route:</span>
                  <span>{selectedOrder?.from_place || 'N/A'} → {selectedOrder?.to_place || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Driver:</span>
                  <span>{selectedOrder?.driver_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Vehicle:</span>
                  <span>{selectedOrder?.vehicle_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Select Buyer Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Select Buyer</h3>
              <div>
                <label className="text-sm font-medium">Select Buyer</label>
                <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a buyer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.user_id} value={buyer.user_id}>
                        {buyer.name} ({buyer.company_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsSendDialogOpen(false)
                setSelectedBuyer("")
                setSelectedOrder(null)
              }}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={isSending || !selectedBuyer}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send to Buyer
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


