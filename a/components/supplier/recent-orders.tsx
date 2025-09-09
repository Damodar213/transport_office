"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { Eye, RefreshCw, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RecentOrder {
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

export function RecentOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Fetch recent orders (limit to 5 most recent)
  const fetchRecentOrders = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const response = await fetch("/api/supplier/orders")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      if (result.success) {
        // Get only orders that are not yet confirmed (still pending)
        const pendingOrders = result.orders.filter((order: RecentOrder) => 
          order.status === "submitted" || order.status === "pending"
        )
        // Get only the 5 most recent pending orders
        const recentOrders = pendingOrders.slice(0, 5)
        setOrders(recentOrders)
      } else {
        throw new Error(result.error || "Failed to fetch orders")
      }
    } catch (err) {
      console.error("Error fetching recent orders:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch orders")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch orders on component mount
  useEffect(() => {
    fetchRecentOrders()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      submitted: { color: "bg-blue-100 text-blue-800", label: "New", icon: Clock },
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

  const handleViewOrder = (order: RecentOrder) => {
    setSelectedOrder(order)
    setIsDialogOpen(true)
  }

  const handleRefresh = () => {
    fetchRecentOrders()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">New Orders</h3>
            <p className="text-sm text-muted-foreground">Orders sent by admin waiting for confirmation</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading new orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">New Orders</h3>
            <p className="text-sm text-muted-foreground">Orders sent by admin waiting for confirmation</p>
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
          <h3 className="text-lg font-semibold">New Orders</h3>
          <p className="text-sm text-muted-foreground">Orders sent by admin waiting for confirmation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.location.href = '/supplier/orders'}>
            <ExternalLink className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No New Orders</h4>
            <p className="text-muted-foreground">You don't have any pending orders waiting for confirmation.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{order.order_number}</h4>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Sent {new Date(order.submitted_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p><span className="font-medium">Buyer:</span> {order.buyer_company || 'N/A'} ({order.buyer_name || 'N/A'})</p>
                      {order.buyer_mobile && (
                        <p><span className="font-medium">Contact:</span> {order.buyer_mobile}</p>
                      )}
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
