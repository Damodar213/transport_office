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
import { Search, Filter, Eye, Edit, Trash2, RefreshCw, Download, Calendar, MapPin, Package, Truck, FileText, Send, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface BuyersOrder {
  id: number
  order_number: string
  buyer_id: string
  buyer_company?: string
  buyer_name?: string
  buyer_email?: string
  buyer_mobile?: string
  supplier_id?: string
  supplier_company?: string
  driver_id?: number
  driver_name?: string
  vehicle_id?: number
  vehicle_number?: string
  body_type?: string
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
  status: string
  admin_notes?: string
  assigned_by?: string
  assigned_at?: string
  confirmed_at?: string
  pickup_date?: string
  delivery_date?: string
  estimated_delivery_date?: string
  rate?: number
  distance_km?: number
  created_at: string
  updated_at: string
}

export function BuyersOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<BuyersOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<BuyersOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<BuyersOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [isSendingOrder, setIsSendingOrder] = useState(false)
  const [orderSubmissions, setOrderSubmissions] = useState<any[]>([])

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch("/api/buyer-requests")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        setOrders(result.data)
        setFilteredOrders(result.data)
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

  // Fetch suppliers when dialog opens
  useEffect(() => {
    if (isSupplierDialogOpen) {
      fetchSuppliers()
    }
  }, [isSupplierDialogOpen])

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true)
      const response = await fetch("/api/admin/suppliers")
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.suppliers) {
          setSuppliers(data.suppliers)
        } else {
          console.error("Suppliers API returned error:", data.error)
          setSuppliers([])
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      setSuppliers([])
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  // Send order to suppliers
  const sendOrderToSuppliers = async () => {
    if (!selectedOrder || selectedSuppliers.length === 0) return

    try {
      setIsSendingOrder(true)
      
      // Check if order is already assigned to a specific supplier
      if (selectedOrder.supplier_id) {
        toast({
          title: "Order Already Assigned",
          description: `This order has already been assigned to a supplier and cannot be sent to additional suppliers.`,
          variant: "destructive"
        })
        setIsSendingOrder(false)
        return
      }

      // Check if order has already been submitted to any suppliers
      if (selectedOrder.status === "submitted") {
        const existingSubmissionsResponse = await fetch(`/api/order-submissions/${selectedOrder.id}`)
        if (existingSubmissionsResponse.ok) {
          const data = await existingSubmissionsResponse.json()
          const existingSubmissions = data.submissions || []
          
          if (existingSubmissions.length > 0) {
            toast({
              title: "Order Already Submitted",
              description: `This order has already been submitted to ${existingSubmissions.length} supplier(s) and cannot be sent to additional suppliers.`,
              variant: "destructive"
            })
            setIsSendingOrder(false)
            return
          }
        }
      }

      // Check which suppliers have already been sent this order
      const existingSubmissionsResponse = await fetch(`/api/order-submissions/${selectedOrder.id}`)
      let existingSubmissions: any[] = []
      if (existingSubmissionsResponse.ok) {
        const data = await existingSubmissionsResponse.json()
        existingSubmissions = data.submissions || []
      }

      // Filter out suppliers who have already been sent this order
      const alreadySentTo = existingSubmissions.map(sub => sub.supplier_id)
      const newSuppliers = selectedSuppliers.filter(supplierId => !alreadySentTo.includes(supplierId))

      if (newSuppliers.length === 0) {
        toast({
          title: "All Selected Suppliers Already Notified",
          description: `All selected suppliers have already been sent this order.`,
          variant: "destructive"
        })
        setIsSendingOrder(false)
        return
      }

      if (newSuppliers.length < selectedSuppliers.length) {
        toast({
          title: "Some Suppliers Already Notified",
          description: `${selectedSuppliers.length - newSuppliers.length} suppliers were already sent this order. Sending to ${newSuppliers.length} new suppliers.`,
        })
      }
      
      // Get supplier details with phone numbers
      const suppliersWithPhones = suppliers.filter(s => 
        newSuppliers.includes(s.id) && (s.whatsapp || s.mobile)
      )
      
      // Debug: Show all suppliers and their phone numbers
      console.log("DEBUG: All suppliers:", suppliers)
      console.log("DEBUG: Suppliers with phones:", suppliersWithPhones)
      console.log("DEBUG: Phone number check:", suppliers.map(s => ({
        id: s.id,
        companyName: s.companyName,
        whatsapp: s.whatsapp,
        mobile: s.mobile,
        hasPhone: !!(s.whatsapp || s.mobile)
      })))

      // Create WhatsApp message
      const message = createWhatsAppMessage(selectedOrder)
      const encodedMessage = encodeURIComponent(message)

      // Record order submissions in database
      const submissionPromises = newSuppliers.map(async (supplierId) => {
        try {
          const response = await fetch("/api/order-submissions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              orderId: selectedOrder.id,
              supplierId: supplierId,
              submittedBy: "admin", // You might want to get this from session
              whatsappSent: suppliersWithPhones.some(s => s.id === supplierId),
              notificationSent: true
            })
          })
          
          if (!response.ok) {
            console.error(`Failed to record submission for supplier ${supplierId}`)
          }
        } catch (error) {
          console.error(`Error recording submission for supplier ${supplierId}:`, error)
        }
      })

      // Send internal notifications to suppliers
      const notificationPromises = newSuppliers.map(async (supplierId) => {
        try {
          const response = await fetch("/api/supplier/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              type: "info",
              title: "New Transport Order Available",
              message: `New transport order ${selectedOrder.order_number} is available for your consideration. Load: ${selectedOrder.load_type}, Route: ${selectedOrder.from_place} → ${selectedOrder.to_place}`,
              category: "order",
              priority: "high",
              supplierId: supplierId,
              orderId: selectedOrder.id
            })
          })
          
          if (!response.ok) {
            console.error(`Failed to create notification for supplier ${supplierId}`)
          }
        } catch (error) {
          console.error(`Error creating notification for supplier ${supplierId}:`, error)
        }
      })

      // Wait for all submissions and notifications to be created
      await Promise.all([...submissionPromises, ...notificationPromises])

      // Update order status to "submitted" after sending to suppliers
      try {
        const updateResponse = await fetch(`/api/buyer-requests/${selectedOrder.id}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "submitted"
          })
        })
        
        if (updateResponse.ok) {
          // Update the order in local state
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === selectedOrder.id 
                ? { ...order, status: "submitted" }
                : order
            )
          )
          setFilteredOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === selectedOrder.id 
                ? { ...order, status: "submitted" }
                : order
            )
          )
          console.log("Order status updated to submitted")
        } else {
          console.error("Failed to update order status")
        }
      } catch (error) {
        console.error("Error updating order status:", error)
      }

      // Send to each supplier via WhatsApp (if they have phone numbers)
      console.log("DEBUG: suppliersWithPhones:", suppliersWithPhones)
      console.log("DEBUG: suppliersWithPhones.length:", suppliersWithPhones.length)
      console.log("DEBUG: selectedSuppliers:", selectedSuppliers)
      console.log("DEBUG: suppliers:", suppliers)
      
      if (suppliersWithPhones.length > 0) {
        // Show confirmation for multiple WhatsApp windows
        const shouldOpenWhatsApp = window.confirm(
          `This will open ${suppliersWithPhones.length} WhatsApp windows (one for each supplier). ` +
          `Each window will open with a 2-second delay to avoid browser blocking. ` +
          `Do you want to continue?`
        )
        
        if (shouldOpenWhatsApp) {
          // Enhanced approach for production - open one at a time with user interaction
          const openWhatsAppMessages = async () => {
            console.log("DEBUG: Starting to open WhatsApp messages for", suppliersWithPhones.length, "suppliers")
            for (let i = 0; i < suppliersWithPhones.length; i++) {
              const supplier = suppliersWithPhones[i]
              console.log("DEBUG: Processing supplier", i + 1, ":", supplier)
              const phoneNumber = (supplier.whatsapp || supplier.mobile).replace(/[^0-9]/g, "")
              const cleanPhoneNumber = phoneNumber.startsWith("91") ? phoneNumber.substring(2) : phoneNumber
              const whatsappUrl = `https://wa.me/91${cleanPhoneNumber}?text=${encodedMessage}`
              console.log("DEBUG: WhatsApp URL for supplier", i + 1, ":", whatsappUrl)
              
              // Show progress and open WhatsApp with longer delay
              if (i === 0) {
                // First window opens immediately
                window.open(whatsappUrl, "_blank")
              } else {
                // Subsequent windows open with longer delay and user notification
                setTimeout(() => {
                  // Show notification for each window
                  toast({
                    title: `Opening WhatsApp ${i + 1}/${suppliersWithPhones.length}`,
                    description: `Opening WhatsApp for ${supplier.companyName || supplier.contactPerson}`,
                    duration: 2000
                  })
                  
                  // Open the window
                  const newWindow = window.open(whatsappUrl, "_blank")
                  
                  // Check if popup was blocked
                  if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
                    // Show WhatsApp URL for manual copy-paste
                    navigator.clipboard.writeText(whatsappUrl).then(() => {
                      toast({
                        title: "Popup Blocked - URL Copied",
                        description: `WhatsApp popup was blocked. WhatsApp URL copied to clipboard for ${supplier.companyName || supplier.contactPerson}. Paste it in a new tab.`,
                        variant: "destructive",
                        duration: 8000
                      })
                    }).catch(() => {
                      toast({
                        title: "Popup Blocked",
                        description: `WhatsApp popup was blocked for ${supplier.companyName || supplier.contactPerson}. Please allow popups and try again.`,
                        variant: "destructive",
                        duration: 5000
                      })
                    })
                  }
                }, i * 2000) // 2 second delay between each window
              }
            }
          }
          
          // Start opening WhatsApp messages
          openWhatsAppMessages()
        }
      }

      toast({
        title: "Success",
        description: `Order ${selectedOrder.order_number} submitted and sent to ${newSuppliers.length} new suppliers! Status updated to "Submitted". Internal notifications created and WhatsApp opened for ${suppliersWithPhones.length} suppliers with phone numbers.`,
      })
      setIsSupplierDialogOpen(false)
      setSelectedSuppliers([])
      
    } catch (error) {
      console.error("Error sending order to suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to send order to suppliers. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSendingOrder(false)
    }
  }

  // Create WhatsApp message for order
  const createWhatsAppMessage = (order: BuyersOrder) => {
    // Get website URL from environment variable
    const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'
    
    return `🚛 *New Transport Order Available*

*Order:* ${order.order_number}
*Load Type:* ${order.load_type}
*Route:* ${order.from_place} → ${order.to_place}
*Status:* Submitted

🌐 *Access Your Supplier Dashboard:*
${websiteUrl}/supplier/dashboard

*Contact for more details:*
*MAHALAXMI TRANSPORT*
📞 8217563933
📞 80736 27241`
  }

  // Handle send to suppliers
  const handleSendToSuppliers = async (order: BuyersOrder) => {
    // First check if order is already assigned to a specific supplier
    if (order.supplier_id) {
      toast({
        title: "Order Already Assigned",
        description: `This order has already been assigned to a supplier and cannot be sent to additional suppliers.`,
        variant: "destructive"
      })
      return
    }

    // Check if order has already been submitted to any suppliers
    if (order.status === "submitted") {
      try {
        const response = await fetch(`/api/order-submissions/${order.id}`)
        if (response.ok) {
          const data = await response.json()
          const existingSubmissions = data.submissions || []
          
          if (existingSubmissions.length > 0) {
            toast({
              title: "Order Already Submitted",
              description: `This order has already been submitted to ${existingSubmissions.length} supplier(s) and cannot be sent to additional suppliers.`,
              variant: "destructive"
            })
            return
          }
        }
      } catch (error) {
        console.error("Error checking order submissions:", error)
        // If we can't check, we'll allow opening the dialog but show a warning
      }
    }

    setSelectedOrder(order)
    setSelectedSuppliers([])
    
    // Fetch existing submissions for this order
    try {
      const response = await fetch(`/api/order-submissions/${order.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrderSubmissions(data.submissions || [])
      } else {
        setOrderSubmissions([])
      }
    } catch (error) {
      console.error("Error fetching order submissions:", error)
      setOrderSubmissions([])
    }
    
    setIsSupplierDialogOpen(true)
  }

  // Check if order can be sent to suppliers
  const canSendToSuppliers = (order: BuyersOrder) => {
    // Cannot send if already assigned to a specific supplier
    if (order.supplier_id) {
      return false
    }
    
    // Can only send if order status is pending
    if (order.status !== "pending") {
      return false
    }
    
    return true
  }

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

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const orderDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((order) => {
            orderDate.setTime(Date.parse(order.created_at))
            return orderDate.toDateString() === today.toDateString()
          })
          break
        case "week":
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((order) => {
            orderDate.setTime(Date.parse(order.created_at))
            return orderDate >= weekAgo
          })
          break
        case "month":
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((order) => {
            orderDate.setTime(Date.parse(order.created_at))
            return orderDate >= monthAgo
          })
          break
      }
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter, dateFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      submitted: { color: "bg-blue-100 text-blue-800", label: "Submitted" },
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      assigned: { color: "bg-purple-100 text-purple-800", label: "Assigned" },
      confirmed: { color: "bg-green-100 text-green-800", label: "Confirmed" },
      picked_up: { color: "bg-indigo-100 text-indigo-800", label: "Picked Up" },
      in_transit: { color: "bg-orange-100 text-orange-800", label: "In Transit" },
      delivered: { color: "bg-green-100 text-green-800", label: "Delivered" },
      cancelled: { color: "bg-red-100 text-red-800", label: "Cancelled" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
    }

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", label: status }
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const handleViewOrder = (order: BuyersOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleExportOrders = () => {
    // Export to CSV
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Order Number,Buyer Company,Buyer Name,Load Type,From,To,Status,Created Date\n" +
      filteredOrders.map(order => 
        `${order.order_number},${order.buyer_company || ''},${order.buyer_name || ''},${order.load_type},${order.from_place},${order.to_place},${order.status},${order.created_at}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `buyers_orders_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    // Generate PDF content with better formatting
    const pdfContent = generateFormattedPDFContent(filteredOrders)
    
    // Create PDF blob and download
    const blob = new Blob([pdfContent], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `buyers_orders_${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const generateFormattedPDFContent = (orders: BuyersOrder[]) => {
    // Enhanced PDF content generation with better formatting
    let content = `BUYERS ORDERS REPORT\n`
    content += `================================\n\n`
    content += `Report Generated: ${new Date().toLocaleString()}\n`
    content += `Total Orders: ${orders.length}\n`
    content += `Filtered Results: ${filteredOrders.length}\n\n`
    
    // Summary statistics
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    content += `STATUS SUMMARY:\n`
    content += `----------------\n`
    Object.entries(statusCounts).forEach(([status, count]) => {
      content += `${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}\n`
    })
    content += `\n`
    
    // Detailed order information
    content += `DETAILED ORDER INFORMATION:\n`
    content += `==========================\n\n`
    
    orders.forEach((order, index) => {
      content += `Order ${index + 1}: ${order.order_number}\n`
      content += `----------------------------------------\n`
      content += `Buyer Information:\n`
      content += `  Company: ${order.buyer_company || 'N/A'}\n`
      content += `  Contact: ${order.buyer_name || 'N/A'}\n`
      content += `  Email: ${order.buyer_email || 'N/A'}\n`
      content += `  Mobile: ${order.buyer_mobile || 'N/A'}\n\n`
      
      content += `Load Details:\n`
      content += `  Type: ${order.load_type}\n`
      content += `  Weight: ${order.estimated_tons ? `${order.estimated_tons} tons` : 'Not specified'}\n`
      content += `  Quantity: ${order.number_of_goods ? `${order.number_of_goods} items` : 'Not specified'}\n\n`
      
      content += `Route Information:\n`
      content += `  From: ${order.from_place}, ${order.from_district}, ${order.from_state}\n`
      content += `  To: ${order.to_place}, ${order.to_district}, ${order.to_state}\n`
      content += `  Delivery Address: ${order.delivery_place}\n\n`
      
      content += `Status & Timeline:\n`
      content += `  Current Status: ${order.status}\n`
      content += `  Created: ${new Date(order.created_at).toLocaleDateString()}\n`
      if (order.rate) content += `  Rate: ₹${order.rate}\n`
      if (order.distance_km) content += `  Distance: ${order.distance_km} km\n`
      if (order.required_date) content += `  Required Date: ${order.required_date}\n`
      if (order.special_instructions) content += `  Special Instructions: ${order.special_instructions}\n`
      content += `\n`
    })
    
    // Footer
    content += `\n================================\n`
    content += `End of Report\n`
    content += `Generated by Transport Office Admin Panel\n`
    
    return content
  }

  const handleRefresh = () => {
    fetchOrders()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Buyers Orders</h2>
            <p className="text-muted-foreground">Manage all orders created by buyers</p>
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
            <h2 className="text-2xl font-bold text-foreground">Buyers Orders</h2>
            <p className="text-muted-foreground">Manage all orders created by buyers</p>
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
          <h2 className="text-2xl font-bold text-foreground">Buyers Orders</h2>
          <p className="text-muted-foreground">Manage all orders created by buyers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
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
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter(order => order.status === "pending").length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting assignment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter(order => order.status === "in_transit").length}
            </div>
            <p className="text-xs text-muted-foreground">Currently moving</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter(order => order.status === "delivered").length}
            </div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
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
                  setDateFilter("all")
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
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order, index) => (
                    <TableRow key={`${order.id}-${order.order_number}-${index}`}>
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
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.status)}
                          {order.status === "pending" && (
                            <Badge variant="outline" className="text-xs">
                              Ready to Send
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSendToSuppliers(order)}
                            title={
                              order.supplier_id 
                                ? "Order Already Assigned" 
                                : order.status === "pending" 
                                  ? "Send to Suppliers"
                                  : "Send to Suppliers"
                            }
                            disabled={!canSendToSuppliers(order)}
                          >
                            <Send className="h-4 w-4" />
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
                      <span className="font-medium">Status:</span>
                      <span>{getStatusBadge(selectedOrder.status)}</span>
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

              {/* Timestamps */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span className="text-sm">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Updated:</span>
                        <span className="text-sm">{new Date(selectedOrder.updated_at).toLocaleString()}</span>
                      </div>
                      {selectedOrder.assigned_at && (
                        <div className="flex justify-between">
                          <span className="font-medium">Assigned:</span>
                          <span className="text-sm">{selectedOrder.assigned_at}</span>
                        </div>
                      )}
                      {selectedOrder.confirmed_at && (
                        <div className="flex justify-between">
                          <span className="font-medium">Confirmed:</span>
                          <span className="text-sm">{selectedOrder.confirmed_at}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      {selectedOrder.pickup_date && (
                        <div className="flex justify-between">
                          <span className="font-medium">Pickup Date:</span>
                          <span className="text-sm">{selectedOrder.pickup_date}</span>
                        </div>
                      )}
                      {selectedOrder.estimated_delivery_date && (
                        <div className="flex justify-between">
                          <span className="font-medium">Estimated Delivery:</span>
                          <span className="text-sm">{selectedOrder.estimated_delivery_date}</span>
                        </div>
                      )}
                      {selectedOrder.delivery_date && (
                        <div className="flex justify-between">
                          <span className="font-medium">Actual Delivery:</span>
                          <span className="text-sm">{selectedOrder.delivery_date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Notes */}
              {selectedOrder.admin_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.admin_notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Supplier Selection Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Order to Suppliers</DialogTitle>
            <DialogDescription>
              Select suppliers to send order details. Internal notifications will be created in their accounts, and WhatsApp Web will open for suppliers with phone numbers.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Warning for submitted orders */}
              {selectedOrder.status === "submitted" && orderSubmissions.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    ⚠️ This order has already been submitted to {orderSubmissions.length} supplier(s). 
                    You cannot send it to additional suppliers.
                  </AlertDescription>
                </Alert>
              )}

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Order:</span>
                      <div className="text-sm text-muted-foreground">{selectedOrder.order_number}</div>
                    </div>
                    <div>
                      <span className="font-medium">Load Type:</span>
                      <div className="text-sm text-muted-foreground">{selectedOrder.load_type}</div>
                    </div>
                    <div>
                      <span className="font-medium">From:</span>
                      <div className="text-sm text-muted-foreground">{selectedOrder.from_place}</div>
                    </div>
                    <div>
                      <span className="font-medium">To:</span>
                      <div className="text-sm text-muted-foreground">{selectedOrder.to_place}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supplier Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Select Suppliers</CardTitle>
                  <CardDescription>
                    Choose suppliers to send this order to (selected: {selectedSuppliers.length})
                    {orderSubmissions.length > 0 && (
                      <span className="block text-blue-600 mt-1">
                        ℹ️ {orderSubmissions.length} supplier(s) have already been sent this order
                      </span>
                    )}
                    {suppliers.filter(s => !s.mobile && !s.whatsapp).length > 0 && (
                      <span className="block text-orange-600 mt-1">
                        ⚠️ Some suppliers don't have phone numbers and won't receive WhatsApp messages
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSuppliers ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Loading suppliers...</p>
                    </div>
                  ) : suppliers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">No suppliers found</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {suppliers.map((supplier) => {
                        const alreadySent = orderSubmissions.some(sub => sub.supplier_id === supplier.id)
                        return (
                          <div
                            key={supplier.id}
                            className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                              alreadySent 
                                ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                                : selectedSuppliers.includes(supplier.id)
                                  ? 'border-primary bg-primary/5 cursor-pointer'
                                  : 'border-border hover:border-primary/50 cursor-pointer'
                            } ${!supplier.mobile && !supplier.whatsapp ? 'opacity-60' : ''}`}
                            onClick={() => {
                              if (!alreadySent) {
                                setSelectedSuppliers(prev =>
                                  prev.includes(supplier.id)
                                    ? prev.filter(id => id !== supplier.id)
                                    : [...prev, supplier.id]
                                )
                              }
                            }}
                          >
                            <div className="flex-1">
                              <div className="font-medium flex items-center gap-2">
                                {supplier.company_name}
                                {alreadySent && (
                                  <Badge variant="secondary" className="text-xs">
                                    Already Sent
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {supplier.contact_person} • {supplier.whatsapp || supplier.mobile || 'No phone number'}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {!supplier.mobile && !supplier.whatsapp && (
                                <span className="text-xs text-orange-600">No WhatsApp</span>
                              )}
                              <input
                                type="checkbox"
                                checked={selectedSuppliers.includes(supplier.id)}
                                disabled={alreadySent}
                                onChange={() => {}}
                                className="h-4 w-4"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSupplierDialogOpen(false)
                    setSelectedSuppliers([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendOrderToSuppliers}
                  disabled={
                    selectedSuppliers.length === 0 || 
                    isSendingOrder ||
                    (selectedOrder.status === "submitted" && orderSubmissions.length > 0)
                  }
                >
                  {isSendingOrder ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Sending Notifications & WhatsApp...
                    </>
                  ) : selectedOrder.status === "submitted" && orderSubmissions.length > 0 ? (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Order Already Submitted
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedSuppliers.length} Suppliers
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
