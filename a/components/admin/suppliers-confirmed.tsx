"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Filter, FileText, Table as TableIcon, MapPin, Calendar, Package, User, Truck, Phone, RefreshCw, Send, CheckCircle } from "lucide-react"
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
}

interface Buyer {
  user_id: string
  name: string
  email: string
  phone: string
  company_name: string
  created_at: string
}

export function SuppliersConfirmed() {
  const [orders, setOrders] = useState<ConfirmedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ConfirmedOrder[]>([])
  const [isFetching, setIsFetching] = useState(true) // Start with true to show loading initially
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<ConfirmedOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [selectedBuyer, setSelectedBuyer] = useState<string>("")
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Fetch confirmed orders from all suppliers
  const fetchConfirmedOrders = async (forceRefresh = false) => {
    try {
      setIsFetching(true)
      
      // Add cache-busting parameter if force refresh is requested
      const url = forceRefresh 
        ? `/api/admin/suppliers-confirmed?cache_bust=${Date.now()}`
        : "/api/admin/suppliers-confirmed"
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setFilteredOrders(data.orders)
      } else {
        setError("Failed to fetch confirmed orders")
      }
    } catch (err) {
      setError("Failed to fetch confirmed orders")
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch all buyers
  const fetchBuyers = async () => {
    try {
      const response = await fetch("/api/admin/buyers")
      if (response.ok) {
        const data = await response.json()
        setBuyers(data.buyers)
      } else {
        console.error("Failed to fetch buyers")
      }
    } catch (err) {
      console.error("Failed to fetch buyers:", err)
    }
  }

  useEffect(() => {
    fetchConfirmedOrders()
    fetchBuyers()
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

    setFilteredOrders(filtered)
  }

  useEffect(() => {
    handleFilter()
  }, [orders, statusFilter, searchTerm])

  const getStatusBadge = (status: string) => {
    const colors = {
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

  const handleSendToBuyer = (order: ConfirmedOrder) => {
    setSelectedOrder(order)
    setSelectedBuyer("")
    setIsSendDialogOpen(true)
  }

  const handleConfirmSend = async () => {
    if (!selectedOrder || !selectedBuyer) {
      return
    }

    try {
      setIsSending(true)
      
      const response = await fetch("/api/admin/send-to-buyer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderSubmissionId: selectedOrder.id,
          buyerId: selectedBuyer
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log("Order sent to buyer successfully:", data)
        
        // Close dialog and reset state
        setIsSendDialogOpen(false)
        setSelectedOrder(null)
        setSelectedBuyer("")
        
        // Refresh the orders list to show updated status with force refresh
        fetchConfirmedOrders(true)
        
        // Show success popup message
        alert(`🎉 ORDER SENT TO BUYER SUCCESSFULLY!\n\n📋 Order Details:\n• Order Number: ${selectedOrder?.order_number}\n• Load Type: ${selectedOrder?.load_type}\n• Route: ${selectedOrder?.from_place} → ${selectedOrder?.to_place}\n\n👤 Driver Information:\n• Name: ${selectedOrder?.driver_name}\n• Mobile: ${selectedOrder?.driver_mobile}\n• Vehicle: ${selectedOrder?.vehicle_number}\n\n✅ Status: The buyer will receive a notification and can track this order in their "Accepted Requests" section.\n\n📊 This order is now marked as "Sent" in your dashboard.`)
      } else {
        const errorData = await response.json()
        alert(`Failed to send order: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Error sending order to buyer:", error)
      alert("Failed to send order to buyer")
    } finally {
      setIsSending(false)
    }
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
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
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
                        <p><span className="font-medium">Buyer:</span> {order.buyer_company || 'N/A'} ({order.buyer_name || 'N/A'})</p>
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
                    {order.is_sent_to_buyer ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Sent
                      </Badge>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleSendToBuyer(order)}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Send to Buyer
                      </Button>
                    )}
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

      {/* Send to Buyer Dialog */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Order to Buyer</DialogTitle>
            <DialogDescription>
              Select a buyer to send the confirmed order to their accepted requests.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Order Details</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium">Order:</span> {selectedOrder.order_number}</p>
                  <p><span className="font-medium">Load:</span> {selectedOrder.load_type}</p>
                  <p><span className="font-medium">Route:</span> {selectedOrder.from_place} → {selectedOrder.to_place}</p>
                  <p><span className="font-medium">Driver:</span> {selectedOrder.driver_name}</p>
                  <p><span className="font-medium">Driver Mobile:</span> {selectedOrder.driver_mobile || 'N/A'}</p>
                  <p><span className="font-medium">Vehicle:</span> {selectedOrder.vehicle_number}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Select Buyer</label>
                <Select value={selectedBuyer} onValueChange={setSelectedBuyer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a buyer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers.map((buyer) => (
                      <SelectItem key={buyer.user_id} value={buyer.user_id}>
                        <span className="font-medium">{buyer.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsSendDialogOpen(false)}
                  disabled={isSending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSend}
                  disabled={!selectedBuyer || isSending}
                >
                  {isSending ? "Sending..." : "Send to Buyer"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}


