"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Search, Filter, Eye, RefreshCw, Calendar, MapPin, Package, Truck, FileText, CheckCircle, XCircle, Clock, Download, Table as TableIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SupplierOrder {
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
}

export default function SupplierOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<SupplierOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch("/api/supplier/orders")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setOrders(result.orders)
        setFilteredOrders(result.orders)
      } else {
        throw new Error(result.error || "Failed to fetch orders")
      }
    } catch (err) {
      console.error("Error fetching orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch orders on component mount
  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders based on search and filters
  useEffect(() => {
    let filtered = orders

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.buyer_company && order.buyer_company.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (order.buyer_name && order.buyer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          order.load_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.from_place.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.to_place.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      submitted: { color: "bg-blue-100 text-blue-800", label: "Submitted", icon: Clock },
      viewed: { color: "bg-yellow-100 text-yellow-800", label: "Viewed", icon: Eye },
      responded: { color: "bg-green-100 text-green-800", label: "Responded", icon: CheckCircle },
      ignored: { color: "bg-red-100 text-red-800", label: "Ignored", icon: XCircle },
    }

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status, icon: Clock }
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const handleViewOrder = (order: SupplierOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  const handleExportPDF = () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank')
      if (!printWindow) return

      const ordersData = filteredOrders.map(order => ({
        'Order Number': order.order_number,
        'Buyer Company': order.buyer_company || 'N/A',
        'Buyer Name': order.buyer_name || 'N/A',
        'Load Type': order.load_type,
        'From': order.from_place,
        'To': order.to_place,
        'Status': order.submission_status,
        'Sent Date': new Date(order.submitted_at).toLocaleDateString(),
        'Contact': order.buyer_mobile || 'N/A'
      }))

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Supplier Orders Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .header { margin-bottom: 20px; }
            .date { color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Supplier Orders Report</h1>
            <p class="date">Generated on: ${new Date().toLocaleString()}</p>
            <p>Total Orders: ${ordersData.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Buyer Company</th>
                <th>Buyer Name</th>
                <th>Load Type</th>
                <th>From</th>
                <th>To</th>
                <th>Status</th>
                <th>Sent Date</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              ${ordersData.map(order => `
                <tr>
                  <td>${order['Order Number']}</td>
                  <td>${order['Buyer Company']}</td>
                  <td>${order['Buyer Name']}</td>
                  <td>${order['Load Type']}</td>
                  <td>${order['From']}</td>
                  <td>${order['To']}</td>
                  <td>${order['Status']}</td>
                  <td>${order['Sent Date']}</td>
                  <td>${order['Contact']}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
      
      toast({
        title: "PDF Export",
        description: "PDF export initiated. Use your browser's print dialog to save as PDF.",
      })
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to generate PDF export.",
        variant: "destructive",
      })
    }
  }

  const handleExportExcel = () => {
    try {
      const ordersData = filteredOrders.map(order => ({
        'Order Number': order.order_number,
        'Buyer Company': order.buyer_company || 'N/A',
        'Buyer Name': order.buyer_name || 'N/A',
        'Load Type': order.load_type,
        'From State': order.from_state,
        'From District': order.from_district,
        'From Place': order.from_place,
        'To State': order.to_state,
        'To District': order.to_district,
        'To Place': order.to_place,
        'Delivery Place': order.delivery_place,
        'Estimated Tons': order.estimated_tons || 'N/A',
        'Number of Goods': order.number_of_goods || 'N/A',
        'Rate': order.rate || 'N/A',
        'Distance (KM)': order.distance_km || 'N/A',
        'Status': order.submission_status,
        'Sent Date': new Date(order.submitted_at).toLocaleDateString(),
        'Buyer Email': order.buyer_email || 'N/A',
        'Buyer Mobile': order.buyer_mobile || 'N/A',
        'Required Date': order.required_date || 'N/A',
        'Special Instructions': order.special_instructions || 'N/A'
      }))

      // Convert to CSV format
      const headers = Object.keys(ordersData[0] || {})
      const csvContent = [
        headers.join(','),
        ...ordersData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row]
            // Escape commas and quotes in CSV
            return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
              ? `"${value.replace(/"/g, '""')}"` 
              : value
          }).join(',')
        )
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `supplier_orders_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Excel Export",
        description: "Orders exported to CSV file successfully.",
      })
    } catch (error) {
      toast({
        title: "Export Error",
        description: "Failed to generate Excel export.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Orders</h2>
            <p className="text-muted-foreground">View all orders sent to you</p>
          </div>
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Orders</h2>
            <p className="text-muted-foreground">View all orders sent to you</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Error loading orders: {error}
            <Button variant="link" size="sm" className="ml-2 p-0 h-auto" onClick={handleRefresh}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Orders</h2>
          <p className="text-muted-foreground">View all orders sent to you</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>
            <TableIcon className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter(order => order.status === "submitted").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter(order => order.status === "responded").length}
            </div>
            <p className="text-xs text-muted-foreground">You responded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Viewed</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter(order => order.status === "viewed").length}
            </div>
            <p className="text-xs text-muted-foreground">You viewed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="ignored">Ignored</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          <CardDescription>
            Showing {filteredOrders.length} of {orders.length} total orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No orders found matching your criteria</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Load Type</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.buyer_company || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{order.buyer_name || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.load_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.estimated_tons ? `${order.estimated_tons} tons` : 'N/A'}
                            {order.number_of_goods && ` • ${order.number_of_goods} items`}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.from_place}</div>
                          <div className="text-sm text-muted-foreground">→ {order.to_place}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(order.submitted_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Complete information about this transport order
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
                      <span className="font-medium">Order Number:</span>
                      <span>{selectedOrder.order_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Load Type:</span>
                      <span>{selectedOrder.load_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Estimated Tons:</span>
                      <span>{selectedOrder.estimated_tons ? `${selectedOrder.estimated_tons} tons` : 'Not specified'}</span>
                    </div>
                    {selectedOrder.number_of_goods && (
                      <div className="flex justify-between">
                        <span className="font-medium">Number of Goods:</span>
                        <span>{selectedOrder.number_of_goods}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="font-medium">Rate:</span>
                      <span>{selectedOrder.rate ? `₹${selectedOrder.rate}` : "Not set"}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Buyer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="font-medium">Company:</span>
                      <span>{selectedOrder.buyer_company || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Contact Person:</span>
                      <span>{selectedOrder.buyer_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Email:</span>
                      <span>{selectedOrder.buyer_email || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Mobile:</span>
                      <span>{selectedOrder.buyer_mobile || 'N/A'}</span>
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
                      <h4 className="font-medium mb-2">Pickup Location</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">State:</span> {selectedOrder.from_state}</div>
                        <div><span className="font-medium">District:</span> {selectedOrder.from_district}</div>
                        <div><span className="font-medium">Place:</span> {selectedOrder.from_place}</div>
                        {selectedOrder.from_taluk && (
                          <div><span className="font-medium">Taluk:</span> {selectedOrder.from_taluk}</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Delivery Location</h4>
                      <div className="space-y-1 text-sm">
                        <div><span className="font-medium">State:</span> {selectedOrder.to_state}</div>
                        <div><span className="font-medium">District:</span> {selectedOrder.to_district}</div>
                        <div><span className="font-medium">Place:</span> {selectedOrder.to_place}</div>
                        {selectedOrder.to_taluk && (
                          <div><span className="font-medium">Taluk:</span> {selectedOrder.to_taluk}</div>
                        )}
                        <div><span className="font-medium">Delivery Address:</span> {selectedOrder.delivery_place}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Special Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.special_instructions}</p>
                  </CardContent>
                </Card>
              )}

              {/* Submission Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Submission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Sent Date:</span>
                        <span className="text-sm">{new Date(selectedOrder.submitted_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Sent By:</span>
                        <span className="text-sm">{selectedOrder.submitted_by}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Notification Sent:</span>
                        <span className="text-sm">{selectedOrder.notification_sent ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">WhatsApp Sent:</span>
                        <span className="text-sm">{selectedOrder.whatsapp_sent ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Your Status:</span>
                        <span>{getStatusBadge(selectedOrder.status)}</span>
                      </div>
                      {selectedOrder.required_date && (
                        <div className="flex justify-between">
                          <span className="font-medium">Required Date:</span>
                          <span className="text-sm">{selectedOrder.required_date}</span>
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
