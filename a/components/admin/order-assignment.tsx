"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Eye, Check, X, Filter, Calendar, Package, Truck, Trash2, FileText, Download } from "lucide-react"

interface TransportRequest {
  id: number
  buyerId: string
  buyerName: string
  buyerCompany: string
  loadType: string
  fromLocation: string
  toLocation: string
  estimatedTons: number
  numberOfGoods?: number
  requiredDate: string
  specialInstructions?: string
  status: "pending" | "assigned" | "confirmed" | "rejected"
  submittedAt: string
  assignedSupplierId?: string
  assignedSupplierName?: string
  adminNotes?: string
  recommendedLocation?: string
  orderType?: string
  fromState?: string
  fromDistrict?: string
  fromPlace?: string
  fromTaluk?: string
  toState?: string
  toDistrict?: string
  toPlace?: string
  toTaluk?: string
}

interface Supplier {
  id: string
  name: string
  companyName: string
  availableVehicles: number
  rating: number
  location: string
  isVerified: boolean
}

export function OrderAssignment() {
  const { toast } = useToast()
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loadTypes, setLoadTypes] = useState<string[]>([])
  const [districts, setDistricts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Send to suppliers state
  const [isSendToSuppliersDialogOpen, setIsSendToSuppliersDialogOpen] = useState(false)
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([])
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)
  const [isSendingToSuppliers, setIsSendingToSuppliers] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    company: "",
  })

  // Fetch transport requests
  const fetchTransportRequests = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/admin/transport-requests?cache_bust=${Date.now()}`)
      if (!response.ok) {
        throw new Error("Failed to fetch transport requests")
      }
      
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (err) {
      console.error("Error fetching transport requests:", err)
      setError(err instanceof Error ? err.message : "Failed to load transport requests")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch available suppliers
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
      // Don't set error for suppliers as it's not critical
    }
  }

  // Fetch load types
  const fetchLoadTypes = async () => {
    try {
      const response = await fetch("/api/admin/load-types")
      if (response.ok) {
        const data = await response.json()
        setLoadTypes(data.loadTypes.map((lt: any) => lt.name))
      }
    } catch (error) {
      console.error("Failed to load load types:", error)
      // Fallback to default load types if API fails
      setLoadTypes([
        "Rice", "Wheat", "Cotton", "Sugar", "Cement", 
        "Steel", "Textiles", "Electronics", "Furniture", "Other"
      ])
    }
  }

  // Fetch districts
  const fetchDistricts = async () => {
    try {
      const response = await fetch("/api/admin/districts")
      if (response.ok) {
        const data = await response.json()
        setDistricts(data.districts || [])
      }
    } catch (error) {
      console.error("Failed to load districts:", error)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchTransportRequests()
    fetchSuppliers()
    fetchLoadTypes()
    fetchDistricts()
  }, [])

  // Refresh data when filters change
  useEffect(() => {
    fetchTransportRequests()
  }, [filters])

  // Manual order entry state
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualOrder, setManualOrder] = useState({
    loadType: "",
    estimatedTons: "",
    numberOfGoods: "",
    deliveryPlace: "",
    fromState: "",
    fromDistrict: "",
    fromPlace: "",
    fromTaluk: "",
    toState: "",
    toDistrict: "",
    toPlace: "",
    toTaluk: "",
    requiredDate: "",
    specialInstructions: "",
  })

  const states = ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala", "Maharashtra", "Gujarat"]

  const handleAssignment = async (requestId: number, supplierId: string, notes: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/admin/transport-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "assign",
          requestId,
          supplierId,
          notes,
          orderType: selectedRequest?.orderType || 'buyer_request',
        }),
      })

      if (!response.ok) {
        console.error("Response status:", response.status)
        console.error("Response headers:", Object.fromEntries(response.headers.entries()))
        
        const responseText = await response.text()
        console.error("Response text:", responseText)
        
        let errorData = {}
        try {
          errorData = JSON.parse(responseText)
        } catch (e) {
          console.error("Failed to parse response as JSON:", e)
        }
        
        console.error("Assignment API Error:", errorData)
        throw new Error((errorData as any).error || `Failed to assign order (${response.status}): ${responseText}`)
      }

      const data = await response.json()
      
      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "confirmed",
                assignedSupplierId: supplierId,
                assignedSupplierName: suppliers.find(s => s.id === supplierId)?.companyName,
                adminNotes: notes,
              }
            : request,
        ),
      )

      // Show success message with WhatsApp details
      if (data.whatsappMessage && data.supplierContact) {
        toast({
          title: "Order Assigned Successfully!",
          description: `Order has been assigned to ${suppliers.find(s => s.id === supplierId)?.companyName}. WhatsApp message ready to send.`,
          duration: 5000,
        })
        
        // Show WhatsApp message in console for admin to copy
        console.log("📱 WhatsApp Message to send:")
        console.log(data.whatsappMessage)
        console.log("📞 Supplier Contact:", data.supplierContact)
        
        // You could also show this in a modal or alert
        alert(`Order assigned successfully!\n\nWhatsApp Message:\n${data.whatsappMessage}\n\nSupplier Contact: ${data.supplierContact.whatsapp}`)
      } else {
        toast({
          title: "Order Assigned Successfully!",
          description: `Order has been assigned to ${suppliers.find(s => s.id === supplierId)?.companyName}`,
        })
      }

      setSelectedRequest(null)
      setSelectedSupplier("")
      setAdminNotes("")
      
      // Refresh data to get latest status
      fetchTransportRequests()
    } catch (error) {
      console.error("Assignment error:", error)
      setError(error instanceof Error ? error.message : "Failed to assign order")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (requestId: number, notes: string) => {
    setIsProcessing(true)

    try {
      const response = await fetch("/api/admin/transport-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reject",
          requestId,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject order")
      }

      const data = await response.json()
      
      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "rejected",
                adminNotes: notes,
              }
            : request,
        ),
      )

      setSelectedRequest(null)
      setAdminNotes("")
      
      // Refresh data to get latest status
      fetchTransportRequests()
    } catch (error) {
      console.error("Rejection error:", error)
      setError(error instanceof Error ? error.message : "Failed to reject order")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualOrder = async () => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/admin/manual-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loadType: manualOrder.loadType,
          estimatedTons: manualOrder.estimatedTons,
          numberOfGoods: manualOrder.numberOfGoods,
          deliveryPlace: manualOrder.deliveryPlace,
          fromState: manualOrder.fromState,
          fromDistrict: manualOrder.fromDistrict,
          fromPlace: manualOrder.fromPlace,
          fromTaluk: manualOrder.fromTaluk,
          toState: manualOrder.toState,
          toDistrict: manualOrder.toDistrict,
          toPlace: manualOrder.toPlace,
          toTaluk: manualOrder.toTaluk,
          requiredDate: manualOrder.requiredDate,
          specialInstructions: manualOrder.specialInstructions
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create manual order')
      }

      const result = await response.json()
      console.log('Manual order created:', result)

      // Show success message
      toast({
        title: "Success",
        description: "Manual order created successfully"
      })

      // Refresh the requests list
      await fetchTransportRequests()

      // Close the modal and reset form
      setShowManualEntry(false)
      setManualOrder({ 
        loadType: "", 
        estimatedTons: "", 
        numberOfGoods: "",
        deliveryPlace: "",
        fromState: "",
        fromDistrict: "",
        fromPlace: "",
        fromTaluk: "",
        toState: "",
        toDistrict: "",
        toPlace: "",
        toTaluk: "",
        requiredDate: "",
        specialInstructions: ""
      })

    } catch (error) {
      console.error("Manual order error:", error)
      alert(`Error creating manual order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Fetch available suppliers for sending orders
  const fetchAvailableSuppliers = async () => {
    try {
      setIsLoadingSuppliers(true)
      const response = await fetch("/api/admin/available-suppliers")
      if (response.ok) {
        const data = await response.json()
        setAvailableSuppliers(data.suppliers || [])
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error)
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  // Update order status to sent after user confirms
  const updateOrderStatusToSent = async (orderId: number) => {
    try {
      const response = await fetch("/api/admin/update-manual-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderId,
          status: 'assigned'
        })
      })

      if (response.ok) {
        console.log("Order status updated to sent")
        // Refresh requests to show updated status
        fetchTransportRequests()
      } else {
        console.error("Failed to update order status")
      }
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  // Handle sending order to suppliers
  const handleSendToSuppliers = async () => {
    if (!selectedRequest || selectedSuppliers.length === 0) return

    try {
      setIsSendingToSuppliers(true)
      
      const response = await fetch("/api/admin/send-manual-order-to-suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedRequest.id,
          supplierIds: selectedSuppliers,
          orderDetails: {
            loadType: selectedRequest.loadType,
            estimatedTons: selectedRequest.estimatedTons,
            numberOfGoods: selectedRequest.numberOfGoods,
            fromLocation: selectedRequest.fromLocation,
            toLocation: selectedRequest.toLocation,
            fromState: selectedRequest.fromState,
            fromDistrict: selectedRequest.fromDistrict,
            fromPlace: selectedRequest.fromPlace,
            fromTaluk: selectedRequest.fromTaluk,
            toState: selectedRequest.toState,
            toDistrict: selectedRequest.toDistrict,
            toPlace: selectedRequest.toPlace,
            toTaluk: selectedRequest.toTaluk,
            requiredDate: selectedRequest.requiredDate,
            specialInstructions: selectedRequest.specialInstructions
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Close dialog and reset state first
        setIsSendToSuppliersDialogOpen(false)
        setSelectedSuppliers([])
        
        // Show success message
        toast({
          title: "Success",
          description: `Order sent to ${selectedSuppliers.length} suppliers successfully`
        })
        
        // Open WhatsApp for each supplier
        if (data.sentOrders && data.sentOrders.length > 0) {
          data.sentOrders.forEach((order: any) => {
            if (order.whatsapp) {
              const whatsappUrl = `https://wa.me/${order.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(order.message)}`
              window.open(whatsappUrl, '_blank')
            }
          })
          
          // Show info message that WhatsApp has been opened
          toast({
            title: "WhatsApp Opened",
            description: `WhatsApp has been opened for ${data.sentOrders.length} supplier(s). Order status has been updated to "Sent".`,
            duration: 5000
          })
        }
        
        // Refresh requests
        fetchTransportRequests()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to send order to suppliers",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error sending order to suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to send order to suppliers",
        variant: "destructive"
      })
    } finally {
      setIsSendingToSuppliers(false)
    }
  }

  // Handle delete request
  const handleDeleteRequest = async (requestId: number, orderType: string) => {
    // Show confirmation dialog
    const confirmed = confirm(
      `Are you sure you want to delete this ${orderType === 'manual_order' ? 'manual order' : 'transport request'}?\n\n` +
      `This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/transport-requests?id=${requestId}&orderType=${orderType}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const data = await response.json()
        
        // Show success message
        toast({
          title: "Success",
          description: data.message || "Request deleted successfully"
        })
        
        // Remove from local state
        setRequests((prev) => prev.filter((request) => request.id !== requestId))
        
        // Refresh requests to ensure consistency
        fetchTransportRequests()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to delete request",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Error deleting request:", error)
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string, orderType?: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    // For manual orders with assigned status, show "Sent" instead of "Assigned"
    let displayStatus = status.charAt(0).toUpperCase() + status.slice(1)
    if (status === 'assigned' && orderType === 'manual_order') {
      displayStatus = 'Sent'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {displayStatus}
      </Badge>
    )
  }

  const filteredRequests = requests.filter((request) => {
    if (filters.status !== "all" && request.status !== filters.status) return false
    if (filters.company && !request.buyerCompany.toLowerCase().includes(filters.company.toLowerCase())) return false
    return true
  })

  // Export to PDF function
  const exportToPDF = () => {
    try {
      // Create a new window for PDF generation
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Please allow popups to export PDF",
          variant: "destructive"
        })
        return
      }

      const currentDate = new Date().toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Order Assignment Report - ${currentDate}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; }
            .header p { color: #666; margin: 5px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-pending { background-color: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; }
            .status-assigned { background-color: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; }
            .status-confirmed { background-color: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; }
            .status-rejected { background-color: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order Assignment Report</h1>
            <p>Generated on: ${currentDate}</p>
            <p>Total Orders: ${filteredRequests.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Buyer</th>
                <th>Company</th>
                <th>Load Type</th>
                <th>Route</th>
                <th>Required Date</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRequests.map(request => `
                <tr>
                  <td>${request.id}</td>
                  <td>${request.buyerName}</td>
                  <td>${request.buyerCompany}</td>
                  <td>${request.loadType}</td>
                  <td>${request.fromLocation} → ${request.toLocation}</td>
                  <td>${new Date(request.requiredDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                  <td><span class="status-${request.status}">${request.status.charAt(0).toUpperCase() + request.status.slice(1)}</span></td>
                  <td>${request.assignedSupplierName || 'Not Assigned'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This report was generated from the Transport Management System</p>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()

      toast({
        title: "Success",
        description: "PDF export initiated. Please use your browser's print dialog to save as PDF.",
      })
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      toast({
        title: "Error",
        description: "Failed to export PDF",
        variant: "destructive"
      })
    }
  }

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Create CSV content
      const headers = [
        'Order ID',
        'Buyer Name',
        'Company',
        'Load Type',
        'From Location',
        'To Location',
        'Required Date',
        'Status',
        'Assigned To',
        'Estimated Tons',
        'Number of Goods',
        'Special Instructions'
      ]

      const csvContent = [
        headers.join(','),
        ...filteredRequests.map(request => [
          request.id,
          `"${request.buyerName}"`,
          `"${request.buyerCompany}"`,
          `"${request.loadType}"`,
          `"${request.fromLocation}"`,
          `"${request.toLocation}"`,
          new Date(request.requiredDate).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
          request.status.charAt(0).toUpperCase() + request.status.slice(1),
          `"${request.assignedSupplierName || 'Not Assigned'}"`,
          request.estimatedTons || '',
          request.numberOfGoods || '',
          `"${request.specialInstructions || ''}"`
        ].join(','))
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `order-assignment-${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Excel file downloaded successfully",
      })
    } catch (error) {
      console.error("Error exporting to Excel:", error)
      toast({
        title: "Error",
        description: "Failed to export Excel file",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Assignment</h2>
          <p className="text-muted-foreground">Review buyer requests and assign to suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTransportRequests} 
            disabled={isLoading}
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToPDF}
            disabled={filteredRequests.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button 
            variant="outline" 
            onClick={exportToExcel}
            disabled={filteredRequests.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
            <DialogTrigger asChild>
              <Button>
                <Package className="h-4 w-4 mr-2" />
                Manual Order Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Manual Order</DialogTitle>
                <DialogDescription>Enter comprehensive transport requirements and delivery details</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Load Information */}
              <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Load Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                      <Label htmlFor="manual-loadType">Load Type *</Label>
                  <Select
                    value={manualOrder.loadType}
                    onValueChange={(value) => setManualOrder((prev) => ({ ...prev, loadType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select load type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                      <Label htmlFor="manual-tons">Estimated Tons / Number of Goods *</Label>
                      <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="manual-tons"
                    type="number"
                          step="0.1"
                    value={manualOrder.estimatedTons}
                    onChange={(e) => setManualOrder((prev) => ({ ...prev, estimatedTons: e.target.value }))}
                          placeholder="Weight in tons"
                        />
                        <Input
                          id="manual-goods"
                          type="number"
                          value={manualOrder.numberOfGoods}
                          onChange={(e) => setManualOrder((prev) => ({ ...prev, numberOfGoods: e.target.value }))}
                          placeholder="Quantity"
                  />
                </div>
                      <p className="text-sm text-muted-foreground">Fill at least one field</p>
                    </div>
                  </div>
                </div>

                {/* From Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">From Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                      <Label htmlFor="manual-fromState">State *</Label>
                      <Select
                        value={manualOrder.fromState}
                        onValueChange={(value) => setManualOrder((prev) => ({ ...prev, fromState: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-fromDistrict">District *</Label>
                      <Select
                        value={manualOrder.fromDistrict}
                        onValueChange={(value) => setManualOrder((prev) => ({ ...prev, fromDistrict: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.length === 0 ? (
                            <SelectItem value="" disabled>Loading districts...</SelectItem>
                          ) : (
                            districts.map((district) => (
                              <SelectItem key={district.id} value={district.name}>
                                {district.name}, {district.state}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-fromPlace">Place *</Label>
                      <Input
                        id="manual-fromPlace"
                        type="text"
                        value={manualOrder.fromPlace}
                        onChange={(e) => setManualOrder((prev) => ({ ...prev, fromPlace: e.target.value }))}
                        placeholder="Enter place"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-fromTaluk">Taluk</Label>
                      <Input
                        id="manual-fromTaluk"
                        type="text"
                        value={manualOrder.fromTaluk}
                        onChange={(e) => setManualOrder((prev) => ({ ...prev, fromTaluk: e.target.value }))}
                        placeholder="Enter taluk"
                      />
                    </div>
                  </div>
                </div>

                {/* To Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">To Location</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-toState">State *</Label>
                      <Select
                        value={manualOrder.toState}
                        onValueChange={(value) => setManualOrder((prev) => ({ ...prev, toState: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {states.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-toDistrict">District *</Label>
                      <Select
                        value={manualOrder.toDistrict}
                        onValueChange={(value) => setManualOrder((prev) => ({ ...prev, toDistrict: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select district" />
                        </SelectTrigger>
                        <SelectContent>
                          {districts.length === 0 ? (
                            <SelectItem value="" disabled>Loading districts...</SelectItem>
                          ) : (
                            districts.map((district) => (
                              <SelectItem key={district.id} value={district.name}>
                                {district.name}, {district.state}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-toPlace">Place *</Label>
                      <Input
                        id="manual-toPlace"
                        type="text"
                        value={manualOrder.toPlace}
                        onChange={(e) => setManualOrder((prev) => ({ ...prev, toPlace: e.target.value }))}
                        placeholder="Enter place"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-toTaluk">Taluk</Label>
                      <Input
                        id="manual-toTaluk"
                        type="text"
                        value={manualOrder.toTaluk}
                        onChange={(e) => setManualOrder((prev) => ({ ...prev, toTaluk: e.target.value }))}
                        placeholder="Enter taluk"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Delivery Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manual-delivery">Delivery Place *</Label>
                  <Input
                    id="manual-delivery"
                        type="text"
                    value={manualOrder.deliveryPlace}
                    onChange={(e) => setManualOrder((prev) => ({ ...prev, deliveryPlace: e.target.value }))}
                        placeholder="Enter delivery place"
                  />
                </div>
                    <div className="space-y-2">
                      <Label htmlFor="manual-requiredDate">Required Date</Label>
                      <Input
                        id="manual-requiredDate"
                        type="date"
                        value={manualOrder.requiredDate}
                        onChange={(e) => setManualOrder((prev) => ({ ...prev, requiredDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-specialInstructions">Special Instructions</Label>
                    <Textarea
                      id="manual-specialInstructions"
                      value={manualOrder.specialInstructions}
                      onChange={(e) => setManualOrder((prev) => ({ ...prev, specialInstructions: e.target.value }))}
                      placeholder="Any special handling requirements or instructions"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleManualOrder} disabled={isProcessing} className="flex-1">
                    {isProcessing ? "Creating..." : "Create Order"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowManualEntry(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            Error: {error}
            <Button 
              variant="link" 
              size="sm" 
              className="ml-2 p-0 h-auto text-red-800 underline"
              onClick={fetchTransportRequests}
            >
              Retry
            </Button>
          </p>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Company Filter</Label>
              <Input
                placeholder="Filter by company..."
                value={filters.company}
                onChange={(e) => setFilters((prev) => ({ ...prev, company: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {requests.filter((r) => r.status === "pending").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assigned Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requests.filter((r) => r.status === "assigned").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {requests.filter((r) => r.status === "confirmed").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.filter((s) => s.isVerified && s.availableVehicles > 0).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transport Requests</CardTitle>
          <CardDescription>
            {isLoading ? "Loading..." : `${filteredRequests.length} requests found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading transport requests...</div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No transport requests found</div>
            </div>
          ) : (
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Load Details</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>View</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.buyerName}</div>
                      <div className="text-sm text-muted-foreground">{request.buyerCompany}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.loadType}</div>
                      <div className="text-sm text-muted-foreground">{request.estimatedTons} tons</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>From: {request.fromLocation}</div>
                      <div>To: {request.toLocation}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {request.requiredDate}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status, request.orderType)}</TableCell>
                  <TableCell>
                    {request.assignedSupplierName ? (
                      <div className="text-sm">
                        <div className="font-medium">{request.assignedSupplierName}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                            disabled={request.status === "confirmed"}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {request.status === "pending" && request.orderType === 'manual_order' ? "View" : (request.status === "pending" ? "Assign" : "View")}
                          </Button>
                        </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Order Assignment - {request.loadType}</DialogTitle>
                          <DialogDescription>
                            Review request from {request.buyerCompany} and assign to supplier
                          </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Request Details */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Request Details</h3>
                            <div className="space-y-3 p-4 bg-muted/50 rounded max-h-[70vh] overflow-y-auto">
                              <div>
                                <strong>Buyer:</strong> {request.buyerName} ({request.buyerCompany})
                              </div>
                              <div>
                                <strong>Load Type:</strong> {request.loadType}
                              </div>
                              
                              {/* Load Information */}
                              <div className="border-t pt-2 mt-2">
                                <strong className="text-sm text-muted-foreground">LOAD INFORMATION</strong>
                              </div>
                              {request.estimatedTons && (
                              <div>
                                <strong>Weight:</strong> {request.estimatedTons} tons
                                </div>
                              )}
                              {request.numberOfGoods && (
                                <div>
                                  <strong>Number of Goods:</strong> {request.numberOfGoods} units
                                </div>
                              )}
                              
                              {/* From Location */}
                              <div className="border-t pt-2 mt-2">
                                <strong className="text-sm text-muted-foreground">FROM LOCATION</strong>
                              </div>
                              <div>
                                <strong>From:</strong> {request.fromLocation}
                              </div>
                              {request.orderType === 'manual_order' && request.fromState && (
                                <div>
                                  <strong>From State:</strong> {request.fromState}
                                </div>
                              )}
                              {request.orderType === 'manual_order' && request.fromDistrict && (
                                <div>
                                  <strong>From District:</strong> {request.fromDistrict}
                                </div>
                              )}
                              {request.orderType === 'manual_order' && request.fromPlace && (
                                <div>
                                  <strong>From Place:</strong> {request.fromPlace}
                                </div>
                              )}
                              {request.orderType === 'manual_order' && request.fromTaluk && (
                                <div>
                                  <strong>From Taluk:</strong> {request.fromTaluk}
                                </div>
                              )}
                              
                              {/* To Location */}
                              <div className="border-t pt-2 mt-2">
                                <strong className="text-sm text-muted-foreground">TO LOCATION</strong>
                              </div>
                              <div>
                                <strong>To:</strong> {request.toLocation}
                              </div>
                              {request.orderType === 'manual_order' && request.toState && (
                                <div>
                                  <strong>To State:</strong> {request.toState}
                                </div>
                              )}
                              {request.orderType === 'manual_order' && request.toDistrict && (
                                <div>
                                  <strong>To District:</strong> {request.toDistrict}
                                </div>
                              )}
                              {request.orderType === 'manual_order' && request.toPlace && (
                                <div>
                                  <strong>To Place:</strong> {request.toPlace}
                                </div>
                              )}
                              {request.orderType === 'manual_order' && request.toTaluk && (
                                <div>
                                  <strong>To Taluk:</strong> {request.toTaluk}
                                </div>
                              )}
                              
                              {/* Delivery Details */}
                              <div className="border-t pt-2 mt-2">
                                <strong className="text-sm text-muted-foreground">DELIVERY DETAILS</strong>
                              </div>
                              {request.requiredDate && (
                              <div>
                                <strong>Required Date:</strong> {request.requiredDate}
                              </div>
                              )}
                              <div>
                                <strong>Submitted:</strong> {request.submittedAt}
                              </div>
                              {request.specialInstructions && (
                                <div>
                                  <strong>Special Instructions:</strong> {request.specialInstructions}
                                </div>
                              )}
                              {request.recommendedLocation && (
                                <div>
                                  <strong>Recommended Location:</strong> {request.recommendedLocation}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assignment Form */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Assignment</h3>

                            {request.status === "pending" && (
                              <>
                                <div className="space-y-2">
                                  <Label>Admin Notes</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Enter assignment notes..."
                                    rows={3}
                                  />
                                </div>
                              </>
                            )}

                            {request.status !== "pending" && request.adminNotes && (
                              <div className="space-y-2">
                                <Label>Admin Notes</Label>
                                <Alert>
                                  <AlertDescription>{request.adminNotes}</AlertDescription>
                                </Alert>
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    {request.orderType === 'manual_order' && request.status === 'pending' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsSendToSuppliersDialogOpen(true);
                          fetchAvailableSuppliers();
                        }}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Send
                      </Button>
                    )}
                    {request.orderType === 'manual_order' && request.status === 'assigned' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        Sent
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteRequest(request.id, request.orderType || 'buyer_request')}
                      title="Delete this request"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Send to Suppliers Dialog */}
      <Dialog open={isSendToSuppliersDialogOpen} onOpenChange={setIsSendToSuppliersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Order to Suppliers</DialogTitle>
            <DialogDescription>
              Select suppliers to send order details. Internal notifications will be created in their accounts, and WhatsApp Web will open for suppliers with phone numbers.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="p-4 bg-muted/50 rounded-lg max-h-[50vh] overflow-y-auto">
                <h3 className="font-semibold mb-3">Order Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Order:</strong> ORD-{selectedRequest.id}
                  </div>
                  <div>
                    <strong>Load Type:</strong> {selectedRequest.loadType}
                  </div>
                  <div>
                    <strong>From:</strong> {selectedRequest.fromLocation}
                  </div>
                  <div>
                    <strong>To:</strong> {selectedRequest.toLocation}
                  </div>
                </div>
              </div>

              {/* Select Suppliers */}
              <div className="space-y-4">
                <h3 className="font-semibold">Select Suppliers</h3>
                <p className="text-sm text-muted-foreground">
                  Choose suppliers to send this order to (selected: {selectedSuppliers.length})
                </p>
                
                {isLoadingSuppliers ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading suppliers...</div>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {availableSuppliers
                      .filter(supplier => supplier.isVerified)
                      .map((supplier) => (
                        <div
                          key={supplier.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                        >
                          <div>
                            <div className="font-medium">{supplier.companyName}</div>
                            <div className="text-sm text-muted-foreground">
                              {supplier.name} • {supplier.location}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm text-muted-foreground">
                              <Truck className="h-4 w-4 inline mr-1" />
                              {supplier.availableVehicles} • ★ {supplier.rating}
                            </div>
                            <input
                              type="checkbox"
                              checked={selectedSuppliers.includes(supplier.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSuppliers([...selectedSuppliers, supplier.id])
                                } else {
                                  setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id))
                                }
                              }}
                              className="h-4 w-4"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSendToSuppliersDialogOpen(false)
                    setSelectedSuppliers([])
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendToSuppliers}
                  disabled={selectedSuppliers.length === 0 || isSendingToSuppliers}
                >
                  {isSendingToSuppliers ? "Sending..." : `Send to ${selectedSuppliers.length} Suppliers`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
