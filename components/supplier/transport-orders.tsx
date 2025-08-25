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

interface TransportOrder {
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
  status: "pending" | "confirmed" | "rejected"
  created_at: string
  submitted_at: string
  admin_notes?: string
  admin_action_date?: string
}

interface TransportOrdersProps {
  onDataChange?: () => void
}

export function TransportOrders({ onDataChange }: TransportOrdersProps) {
  const [orders, setOrders] = useState<TransportOrder[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<TransportOrder | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isFetching, setIsFetching] = useState(true)

  const bodyTypes = ["Half Body", "Full Body", "Container", "Open Body", "Closed Body"]
  const states = ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Kerala", "Maharashtra"]

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      setIsFetching(true)
      const response = await fetch("/api/supplier-orders?supplierId=111111") // Use the actual supplier ID from your existing data
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
      } else {
        setError("Failed to fetch orders")
      }
    } catch (err) {
      setError("Failed to fetch orders")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const orderData = {
        supplierId: "111111", // Use the actual supplier ID from your existing data
        state: formData.get("state") as string,
        district: formData.get("district") as string,
        place: formData.get("place") as string,
        taluk: formData.get("taluk") as string,
        vehicleNumber: formData.get("vehicleNumber") as string,
        bodyType: formData.get("bodyType") as string,
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
        setError("Failed to create order")
      }
    } catch (err) {
      setError("Failed to save transport order")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (order: TransportOrder) => {
    setEditingOrder(order)
    setIsDialogOpen(true)
  }

  const handleDelete = async (orderId: number) => {
    if (confirm("Are you sure you want to delete this order?")) {
      setOrders((prev) => prev.filter((order) => order.id !== orderId))
      onDataChange?.() // Refresh dashboard stats
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      confirmed: "default",
      rejected: "destructive",
    } as const

    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
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
            <h2 className="text-2xl font-bold text-foreground">Manage Transport Orders</h2>
            <p className="text-muted-foreground">Create and manage your transport requests</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading orders...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Manage Transport Orders</h2>
          <p className="text-muted-foreground">Create and manage your transport requests</p>
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
              <DialogTitle>{editingOrder ? "Edit Transport Order" : "Create New Transport Order"}</DialogTitle>
              <DialogDescription>Enter the transport details. Orders will be automatically submitted to admin for review.</DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select name="state" defaultValue={editingOrder?.state || ""} required>
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
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    name="district"
                    type="text"
                    required
                    defaultValue={editingOrder?.district || ""}
                    placeholder="Enter district"
                  />
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

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingOrder ? "Update Order" : "Create Order"}
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
          <CardTitle>Your Transport Orders</CardTitle>
          <CardDescription>Manage your transport requests and track their status</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transport orders found. Create your first order to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Body Type</TableHead>
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
                    </TableCell>
                    <TableCell className="font-medium">{order.vehicle_number}</TableCell>
                    <TableCell>{order.body_type}</TableCell>
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
