"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { Plus, Edit, Trash2, Send, Calendar } from "lucide-react"

interface TransportRequest {
  id: number
  loadType: string
  fromState: string
  fromDistrict: string
  fromPlace: string
  fromTaluk?: string
  toState: string
  toDistrict: string
  toPlace: string
  toTaluk?: string
  estimatedTons: number
  numberOfGoods?: number
  deliveryPlace: string
  requiredDate: string
  specialInstructions?: string
  status: "draft" | "submitted" | "assigned" | "in_progress" | "completed"
  createdAt: string
}

export function TransportRequests() {
  const [requests, setRequests] = useState<TransportRequest[]>([
    {
      id: 1,
      loadType: "Rice",
      fromState: "Karnataka",
      fromDistrict: "Bangalore",
      fromPlace: "Whitefield",
      fromTaluk: "Bangalore East",
      toState: "Tamil Nadu",
      toDistrict: "Chennai",
      toPlace: "Guindy",
      estimatedTons: 25.5,
      numberOfGoods: 500,
      deliveryPlace: "Guindy Industrial Estate",
      requiredDate: "2024-02-15",
      specialInstructions: "Handle with care - premium quality rice",
      status: "submitted",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      loadType: "Wheat",
      fromState: "Karnataka",
      fromDistrict: "Mysore",
      fromPlace: "Mysore City",
      toState: "Andhra Pradesh",
      toDistrict: "Hyderabad",
      toPlace: "Secunderabad",
      estimatedTons: 30.0,
      deliveryPlace: "Secunderabad Railway Station",
      requiredDate: "2024-02-20",
      status: "assigned",
      createdAt: "2024-01-20",
    },
  ])

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<TransportRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const loadTypes = [
    "Rice",
    "Wheat",
    "Cotton",
    "Sugar",
    "Cement",
    "Steel",
    "Textiles",
    "Electronics",
    "Furniture",
    "Other",
  ]
  const states = ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala", "Maharashtra", "Gujarat"]

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const requestData = {
        loadType: formData.get("loadType") as string,
        fromState: formData.get("fromState") as string,
        fromDistrict: formData.get("fromDistrict") as string,
        fromPlace: formData.get("fromPlace") as string,
        fromTaluk: formData.get("fromTaluk") as string,
        toState: formData.get("toState") as string,
        toDistrict: formData.get("toDistrict") as string,
        toPlace: formData.get("toPlace") as string,
        toTaluk: formData.get("toTaluk") as string,
        estimatedTons: Number.parseFloat(formData.get("estimatedTons") as string),
        numberOfGoods: Number.parseInt(formData.get("numberOfGoods") as string) || undefined,
        deliveryPlace: formData.get("deliveryPlace") as string,
        requiredDate: formData.get("requiredDate") as string,
        specialInstructions: formData.get("specialInstructions") as string,
        status: "draft" as const,
      }

      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (editingRequest) {
        setRequests((prev) =>
          prev.map((request) => (request.id === editingRequest.id ? { ...request, ...requestData } : request)),
        )
      } else {
        const newRequest: TransportRequest = {
          id: Date.now(),
          ...requestData,
          createdAt: new Date().toISOString().split("T")[0],
        }
        setRequests((prev) => [...prev, newRequest])
      }

      setIsDialogOpen(false)
      setEditingRequest(null)
    } catch (err) {
      setError("Failed to save transport request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitRequest = async (requestId: number) => {
    try {
      setRequests((prev) =>
        prev.map((request) => (request.id === requestId ? { ...request, status: "submitted" } : request)),
      )
    } catch (err) {
      setError("Failed to submit request")
    }
  }

  const handleEdit = (request: TransportRequest) => {
    setEditingRequest(request)
    setIsDialogOpen(true)
  }

  const handleDelete = async (requestId: number) => {
    if (confirm("Are you sure you want to delete this request?")) {
      setRequests((prev) => prev.filter((request) => request.id !== requestId))
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      submitted: "bg-blue-100 text-blue-800",
      assigned: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transport Requests</h2>
          <p className="text-muted-foreground">Create and manage your transport requirements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingRequest(null)}>
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRequest ? "Edit Transport Request" : "Create New Transport Request"}</DialogTitle>
              <DialogDescription>Enter your transport requirements and delivery details</DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-6">
              {/* Load Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Load Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loadType">Load Type *</Label>
                    <Select name="loadType" defaultValue={editingRequest?.loadType || ""} required>
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
                    <Label htmlFor="estimatedTons">Estimated Tons *</Label>
                    <Input
                      id="estimatedTons"
                      name="estimatedTons"
                      type="number"
                      step="0.1"
                      required
                      defaultValue={editingRequest?.estimatedTons || ""}
                      placeholder="Enter weight in tons"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numberOfGoods">Number of Goods</Label>
                    <Input
                      id="numberOfGoods"
                      name="numberOfGoods"
                      type="number"
                      defaultValue={editingRequest?.numberOfGoods || ""}
                      placeholder="Enter quantity"
                    />
                  </div>
                </div>
              </div>

              {/* From Location */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">From Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromState">State *</Label>
                    <Select name="fromState" defaultValue={editingRequest?.fromState || ""} required>
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
                    <Label htmlFor="fromDistrict">District *</Label>
                    <Input
                      id="fromDistrict"
                      name="fromDistrict"
                      type="text"
                      required
                      defaultValue={editingRequest?.fromDistrict || ""}
                      placeholder="Enter district"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fromPlace">Place *</Label>
                    <Input
                      id="fromPlace"
                      name="fromPlace"
                      type="text"
                      required
                      defaultValue={editingRequest?.fromPlace || ""}
                      placeholder="Enter place"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromTaluk">Taluk</Label>
                    <Input
                      id="fromTaluk"
                      name="fromTaluk"
                      type="text"
                      defaultValue={editingRequest?.fromTaluk || ""}
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
                    <Label htmlFor="toState">State *</Label>
                    <Select name="toState" defaultValue={editingRequest?.toState || ""} required>
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
                    <Label htmlFor="toDistrict">District *</Label>
                    <Input
                      id="toDistrict"
                      name="toDistrict"
                      type="text"
                      required
                      defaultValue={editingRequest?.toDistrict || ""}
                      placeholder="Enter district"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="toPlace">Place *</Label>
                    <Input
                      id="toPlace"
                      name="toPlace"
                      type="text"
                      required
                      defaultValue={editingRequest?.toPlace || ""}
                      placeholder="Enter place"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toTaluk">Taluk</Label>
                    <Input
                      id="toTaluk"
                      name="toTaluk"
                      type="text"
                      defaultValue={editingRequest?.toTaluk || ""}
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
                    <Label htmlFor="deliveryPlace">Delivery Place *</Label>
                    <Input
                      id="deliveryPlace"
                      name="deliveryPlace"
                      type="text"
                      required
                      defaultValue={editingRequest?.deliveryPlace || ""}
                      placeholder="Enter specific delivery location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredDate">Required Date *</Label>
                    <Input
                      id="requiredDate"
                      name="requiredDate"
                      type="date"
                      required
                      defaultValue={editingRequest?.requiredDate || ""}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    defaultValue={editingRequest?.specialInstructions || ""}
                    placeholder="Any special handling requirements or instructions"
                    rows={3}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingRequest ? "Update Request" : "Save as Draft"}
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
          <CardTitle>Your Transport Requests</CardTitle>
          <CardDescription>Manage your transport requirements and track their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Load Type</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.loadType}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        {request.fromPlace}, {request.fromDistrict}
                      </div>
                      <div className="text-muted-foreground">
                        → {request.toPlace}, {request.toDistrict}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{request.estimatedTons} tons</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {request.requiredDate}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>{request.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {request.status === "draft" && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(request)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleSubmitRequest(request.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(request.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {request.status !== "draft" && (
                        <Button variant="outline" size="sm" disabled>
                          Submitted
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
