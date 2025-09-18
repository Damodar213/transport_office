"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Eye, RefreshCw, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, ExternalLink, UserCheck } from "lucide-react"
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
  effective_status?: string
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

interface Driver {
  id: number
  supplier_id: number
  driver_name: string
  mobile: string
  license_document_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Vehicle {
  id: number
  supplier_id: string
  vehicle_number: string
  body_type: string
  capacity_tons?: number
  number_of_wheels?: number
  document_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export function RecentOrders() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Accept order states
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false)
  const [acceptingOrder, setAcceptingOrder] = useState<RecentOrder | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string>("")
  const [selectedVehicle, setSelectedVehicle] = useState<string>("")
  const [driverMobile, setDriverMobile] = useState<string>("")
  const [isAccepting, setIsAccepting] = useState(false)

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
        // Use effective_status if available, otherwise fall back to status
        const pendingOrders = result.orders.filter((order: RecentOrder) => {
          const effectiveStatus = order.effective_status || order.status
          return effectiveStatus !== "accepted" && (
            effectiveStatus === "new" || effectiveStatus === "submitted" || effectiveStatus === "viewed" || effectiveStatus === "responded" || 
            effectiveStatus === "assigned" || effectiveStatus === "pending"
          )
        })
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

  // Fetch drivers and vehicles
  const fetchDriversAndVehicles = async () => {
    try {
      // Get current supplier ID
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (!userResponse.ok) {
        console.error("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id
      
      // Fetch drivers
      const driversResponse = await fetch(`/api/supplier-drivers?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      if (driversResponse.ok) {
        const driversData = await driversResponse.json()
        setDrivers(driversData.drivers || [])
      }
      
      // Fetch vehicles
      const vehiclesResponse = await fetch(`/api/supplier-trucks?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      if (vehiclesResponse.ok) {
        const vehiclesData = await vehiclesResponse.json()
        setVehicles(vehiclesData.trucks || [])
      }
    } catch (error) {
      console.error("Error fetching drivers and vehicles:", error)
    }
  }

  // Handle driver selection - auto-populate mobile number
  const handleDriverChange = (driverId: string) => {
    setSelectedDriver(driverId)
    const driver = drivers.find(d => d.id.toString() === driverId)
    if (driver) {
      setDriverMobile(driver.mobile)
    } else {
      setDriverMobile("")
    }
  }

  // Handle order acceptance
  const handleAcceptOrder = async () => {
    if (!acceptingOrder || !selectedDriver || !selectedVehicle) {
      toast({
        title: "Error",
        description: "Please select both driver and vehicle",
        variant: "destructive"
      })
      return
    }

    try {
      setIsAccepting(true)
      
      const response = await fetch("/api/supplier/accept-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: acceptingOrder.id,
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          driverMobile: driverMobile
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Order accepted successfully! Confirmation sent to admin.",
        })
        
        // Close dialog and reset form
        setIsAcceptDialogOpen(false)
        setAcceptingOrder(null)
        setSelectedDriver("")
        setSelectedVehicle("")
        setDriverMobile("")
        
        // Refresh orders
        fetchRecentOrders()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to accept order")
      }
    } catch (error) {
      console.error("Error accepting order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept order",
        variant: "destructive"
      })
    } finally {
      setIsAccepting(false)
    }
  }

  // Open accept order dialog
  const openAcceptDialog = (order: RecentOrder) => {
    setAcceptingOrder(order)
    setIsAcceptDialogOpen(true)
    setSelectedDriver("")
    setSelectedVehicle("")
    setDriverMobile("")
  }

  // Fetch orders on component mount
  useEffect(() => {
    fetchRecentOrders()
    fetchDriversAndVehicles()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
      new: { color: "bg-blue-100 text-blue-800", label: "New", icon: Clock },
      viewed: { color: "bg-yellow-100 text-yellow-800", label: "Viewed", icon: Eye },
      responded: { color: "bg-green-100 text-green-800", label: "Responded", icon: CheckCircle },
      confirmed: { color: "bg-green-100 text-green-800", label: "Confirmed", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected", icon: XCircle },
      submitted: { color: "bg-blue-100 text-blue-800", label: "Submitted", icon: Clock },
      assigned: { color: "bg-purple-100 text-purple-800", label: "Assigned", icon: UserCheck },
      pending: { color: "bg-orange-100 text-orange-800", label: "Pending", icon: Clock },
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
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => openAcceptDialog(order)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Accept Order
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

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Accept Order Dialog */}
      <Dialog open={isAcceptDialogOpen} onOpenChange={setIsAcceptDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accept Order</DialogTitle>
            <DialogDescription>
              Select driver and vehicle for order {acceptingOrder?.order_number}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Driver Selection */}
            <div className="space-y-2">
              <Label htmlFor="driver">Select Driver</Label>
              <Select value={selectedDriver} onValueChange={handleDriverChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a driver" />
                </SelectTrigger>
                <SelectContent>
                  {drivers.filter(driver => driver.is_active).map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.driver_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Driver Mobile (Auto-populated) */}
            <div className="space-y-2">
              <Label htmlFor="mobile">Driver Mobile</Label>
              <Input
                id="mobile"
                value={driverMobile}
                readOnly
                placeholder="Mobile number will appear when driver is selected"
              />
            </div>

            {/* Vehicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Select Vehicle</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.filter(vehicle => vehicle.is_active).map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.vehicle_number} ({vehicle.body_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAcceptDialogOpen(false)}
                disabled={isAccepting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptOrder}
                disabled={isAccepting || !selectedDriver || !selectedVehicle}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAccepting ? "Accepting..." : "Accept Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
