"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Calendar } from "lucide-react"

interface SupplierVehicleLocation {
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
  driver_id?: number
  driver_name?: string
  status: "pending" | "confirmed" | "rejected"
  created_at: string
  submitted_at: string
  admin_notes?: string
  admin_action_date?: string
  recommended_location?: string
}

interface Driver {
  id: number
  driver_name: string
  mobile: string
  license_number: string
}

interface SupplierVehicleLocationProps {
  onDataChange?: () => void
}

export function TransportOrders({ onDataChange }: SupplierVehicleLocationProps) {
  const [orders, setOrders] = useState<SupplierVehicleLocation[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [states, setStates] = useState<string[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SupplierVehicleLocation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isFetching, setIsFetching] = useState(true)
  const [selectedState, setSelectedState] = useState<string>("")

  const bodyTypes = ["Half Body", "Full Body", "Container", "Open Body", "Closed Body"]
  const [districtsByState, setDistrictsByState] = useState<Record<string, string[]>>({})
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)

  // Fetch states from API
  const fetchStates = async () => {
    try {
      const response = await fetch("/api/admin/states")
      if (response.ok) {
        const data = await response.json()
        setStates(data.states || [])
      } else {
        console.error("Failed to fetch states")
      }
    } catch (error) {
      console.error("Error fetching states:", error)
    }
  }

  // Fetch orders from API
  const fetchOrders = async () => {
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
      
      const response = await fetch(`/api/supplier-orders?supplierId=${supplierId}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        setError("Failed to fetch vehicle locations")
      }
    } catch (err) {
      setError("Failed to fetch vehicle locations")
    } finally {
      setIsFetching(false)
    }
  }

  // Fetch drivers from API
  const fetchDrivers = async () => {
    try {
      // Get current supplier ID from auth
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        console.error("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id
      
      const response = await fetch(`/api/supplier-drivers?supplierId=${supplierId}`)
      if (response.ok) {
        const data = await response.json()
        setDrivers(data.drivers)
      }
    } catch (err) {
      console.error("Failed to fetch drivers:", err)
    }
  }

  // Fetch districts from admin API
  const fetchDistricts = async () => {
    try {
      setIsLoadingDistricts(true)
      const response = await fetch("/api/admin/districts")
      if (response.ok) {
        const data = await response.json()
        const districts = data.districts || []
        
        // Group districts by state
        const groupedDistricts: Record<string, string[]> = {}
        const uniqueStates: string[] = []
        
        districts.forEach((district: any) => {
          if (!groupedDistricts[district.state]) {
            groupedDistricts[district.state] = []
            uniqueStates.push(district.state)
          }
          groupedDistricts[district.state].push(district.name)
        })
        
        setDistrictsByState(groupedDistricts)
        setStates(uniqueStates.sort())
      } else {
        console.error("Failed to fetch districts")
        // Fallback to empty arrays
        setDistrictsByState({})
        setStates([])
      }
    } catch (err) {
      console.error("Failed to fetch districts:", err)
      // Fallback to empty arrays
      setDistrictsByState({})
      setStates([])
    } finally {
      setIsLoadingDistricts(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    fetchDrivers()
    fetchDistricts()
    fetchStates()
  }, [])

  // Set selected state when editing an order
  useEffect(() => {
    if (editingOrder?.recommended_location) {
      // Parse the recommended location to extract state if it contains " - "
      const parts = editingOrder.recommended_location.split(" - ")
      if (parts.length > 1) {
        setSelectedState(parts[0])
      } else {
        setSelectedState("")
      }
    } else {
      setSelectedState("")
    }
  }, [editingOrder])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Get current supplier ID from auth
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        setError("Failed to get current supplier")
        setIsLoading(false)
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id

      // Combine selected state with location details for recommended location
      const recommendedState = selectedState
      const recommendedDetails = formData.get("recommendedLocation") as string
      const recommendedLocation = recommendedState && recommendedDetails 
        ? `${recommendedState} - ${recommendedDetails}`
        : recommendedDetails || ""

      const orderData = {
        supplierId: supplierId,
        state: formData.get("state") as string,
        district: formData.get("district") as string,
        place: formData.get("place") as string,
        taluk: formData.get("taluk") as string,
        vehicleNumber: formData.get("vehicleNumber") as string,
        bodyType: formData.get("bodyType") as string,
        driverId: formData.get("driverId") ? parseInt(formData.get("driverId") as string) : undefined,
        recommendedLocation: recommendedLocation,
      }

      const response = await fetch("/api/supplier-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      })

      if (response.ok) {
        const data = await response.json()
        setOrders((prev) => [data.order, ...prev])
        onDataChange?.() // Refresh dashboard stats
        setIsDialogOpen(false)
        setEditingOrder(null)
      } else {
        setError("Failed to create vehicle location")
      }
    } catch (err) {
      setError("Failed to save vehicle location")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (order: SupplierVehicleLocation) => {
    setEditingOrder(order)
    setIsDialogOpen(true)
  }

  const handleDelete = async (orderId: number) => {
    if (confirm("Are you sure you want to delete this vehicle location? This action cannot be undone.")) {
      try {
        const response = await fetch(`/api/supplier-orders?id=${orderId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setOrders((prev) => prev.filter((order) => order.id !== orderId))
          onDataChange?.() // Refresh dashboard stats
        } else {
          const errorData = await response.json()
          setError(errorData.error || "Failed to delete vehicle location")
        }
      } catch (err) {
        setError("Failed to delete vehicle location")
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      confirmed: "default",
      accepted: "default",
      rejected: "destructive",
    } as const

    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      accepted: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (isFetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Manage Suppliers Vehicle Location</h2>
            <p className="text-muted-foreground">Create and manage your vehicle location requests</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading vehicle locations...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
                      <h2 className="text-2xl font-bold text-foreground">Manage Suppliers Vehicle Location</h2>
            <p className="text-muted-foreground">Create and manage your vehicle location requests</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingOrder(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingOrder ? "Edit Vehicle Location" : "Create New Vehicle Location"}</DialogTitle>
              <DialogDescription>Enter the vehicle location details. Requests will be automatically submitted to admin for review.</DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select 
                    name="state" 
                    value={selectedState || editingOrder?.state || ""} 
                    onValueChange={setSelectedState}
                    required
                    disabled={isLoadingDistricts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingDistricts ? "Loading states..." : "Select state"} />
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
                  <Label htmlFor="district">District *</Label>
                  <Select 
                    name="district" 
                    defaultValue={editingOrder?.district || ""} 
                    required
                    disabled={!selectedState && !editingOrder?.state || isLoadingDistricts}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        isLoadingDistricts 
                          ? "Loading districts..." 
                          : selectedState || editingOrder?.state 
                            ? "Select district" 
                            : "Select state first"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedState || editingOrder?.state) && districtsByState[selectedState || editingOrder?.state || '']?.map((district: any) => (
                        <SelectItem key={district} value={district}>
                          {district}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="place">Place *</Label>
                  <Input
                    id="place"
                    name="place"
                    type="text"
                    required
                    defaultValue={editingOrder?.place || ""}
                    placeholder="Enter place"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taluk">Taluk (Optional)</Label>
                  <Input
                    id="taluk"
                    name="taluk"
                    type="text"
                    defaultValue={editingOrder?.taluk || ""}
                    placeholder="Enter taluk"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    type="text"
                    required
                    defaultValue={editingOrder?.vehicle_number || ""}
                    placeholder="Enter vehicle number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Body Type *</Label>
                  <Select name="bodyType" defaultValue={editingOrder?.body_type || ""} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bodyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driverId">Select Driver</Label>
                <Select name="driverId" defaultValue={editingOrder?.driver_id?.toString() || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No drivers available
                      </div>
                    ) : (
                      drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
                          {driver.driver_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose a driver from your registered drivers list
                </p>
              </div>

              <div className="space-y-4">
                <Label>Recommended Location (Optional)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recommendedState">State</Label>
                    <Select 
                      value={selectedState} 
                      onValueChange={setSelectedState}
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
                    <Label htmlFor="recommendedLocation">Location Details</Label>
                    <Input
                      id="recommendedLocation"
                      name="recommendedLocation"
                      type="text"
                      defaultValue={
                        editingOrder?.recommended_location 
                          ? editingOrder.recommended_location.includes(" - ")
                            ? editingOrder.recommended_location.split(" - ").slice(1).join(" - ")
                            : editingOrder.recommended_location
                          : ""
                      }
                      placeholder="Enter location details or leave empty"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Specify any recommended location details or special notes for this vehicle location
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                                 <Button type="submit" disabled={isLoading} className="flex-1">
                   {isLoading ? "Saving..." : editingOrder ? "Update Location" : "Create Location"}
                 </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Vehicle Locations</CardTitle>
          <CardDescription>Manage your vehicle location requests and track their status</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vehicle locations found. Create your first location request to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Body Type</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div className="font-medium">
                        {order.place}, {order.district}
                      </div>
                      <div className="text-sm text-muted-foreground">{order.state}</div>
                      {order.recommended_location && (
                        <div className="text-xs text-blue-600 mt-1">
                          <strong>Recommended:</strong> {order.recommended_location}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{order.vehicle_number}</TableCell>
                    <TableCell>{order.body_type}</TableCell>
                    <TableCell>
                      {order.driver_name ? (
                        <div className="font-medium text-blue-600">{order.driver_name}</div>
                      ) : (
                        <div className="text-muted-foreground italic">No driver assigned</div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div className="text-sm">
                          <div>{order.submitted_at?.split(" ")[0] || order.created_at}</div>
                          {order.submitted_at && (
                            <div className="text-muted-foreground">{order.submitted_at.split(" ")[1]}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {order.status === "pending" && (
                          <Button variant="outline" size="sm" disabled>
                            Under Review
                          </Button>
                        )}
                        {order.status === "confirmed" && (
                          <Button variant="outline" size="sm" disabled className="text-green-600">
                            Confirmed
                          </Button>
                        )}
                        {order.status === "rejected" && (
                          <Button variant="outline" size="sm" disabled className="text-red-600">
                            Rejected
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(order.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
    </div>
  )
}
