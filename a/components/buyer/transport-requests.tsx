"use client"

import { useState, useEffect } from "react"
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
  required_date: string
  special_instructions?: string
  status: "draft" | "submitted" | "assigned" | "in_progress" | "completed"
  created_at: string
}

interface District {
  id: string
  name: string
  state: string
  description?: string
  isActive: boolean
  createdAt: string
}

interface TransportRequestsProps {
  onDataChange?: () => void
}

export function TransportRequests({ onDataChange }: TransportRequestsProps) {
  const [requests, setRequests] = useState<TransportRequest[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<TransportRequest | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)

  const [loadTypes, setLoadTypes] = useState<string[]>([])
  const states = ["Karnataka", "Tamil Nadu", "Andhra Pradesh", "Telangana", "Kerala", "Maharashtra", "Gujarat"]

  // Load load types from API
  useEffect(() => {
    const loadLoadTypes = async () => {
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

    loadLoadTypes()
  }, [])

  // Load districts from database
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        console.log("Loading districts from API...")
        const response = await fetch("/api/admin/districts")
        if (response.ok) {
          const data = await response.json()
          console.log("Districts loaded:", data.districts?.length || 0, "districts")
          setDistricts(data.districts || [])
        } else {
          console.error("Failed to load districts - response not ok:", response.status)
        }
      } catch (error) {
        console.error("Failed to load districts:", error)
        // Fallback to empty array if API fails
        setDistricts([])
      }
    }

    loadDistricts()
  }, [])

  // Fetch existing requests from database
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoadingRequests(true)
        
        // Get current user session
        const userResponse = await fetch("/api/auth/me", {
          credentials: 'include'
        })
        if (!userResponse.ok) {
          console.error("Failed to get current user")
          return
        }
        
        const userData = await userResponse.json()
        const buyerId = userData.user?.id
        
        if (!buyerId) {
          console.error("No buyer ID found in session")
          return
        }
        
        const response = await fetch("/api/buyer-requests")
        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            setRequests(result.data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch requests:", error)
        // Fallback to empty array if API fails
        setRequests([])
      } finally {
        setIsLoadingRequests(false)
      }
    }

    fetchRequests()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const estimatedTons = formData.get("estimatedTons") as string
      const numberOfGoods = formData.get("numberOfGoods") as string
      
      // Validate that either estimatedTons or numberOfGoods is provided
      if (!estimatedTons && !numberOfGoods) {
        setError("Either Estimated Tons or Number of Goods is required")
        setIsLoading(false)
        return
      }

      // Get current user session
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (!userResponse.ok) {
        setError("Failed to get current user session")
        setIsLoading(false)
        return
      }
      
      const userData = await userResponse.json()
      const buyerId = userData.user?.id
      
      if (!buyerId) {
        setError("No buyer ID found in session")
        setIsLoading(false)
        return
      }

      const requestData = {
        load_type: formData.get("loadType") as string,
        from_state: formData.get("fromState") as string,
        from_district: formData.get("fromDistrict") as string,
        from_place: formData.get("fromPlace") as string,
        from_taluk: formData.get("fromTaluk") as string,
        to_state: formData.get("toState") as string,
        to_district: formData.get("toDistrict") as string,
        to_place: formData.get("toPlace") as string,
        to_taluk: formData.get("toTaluk") as string,
        estimated_tons: estimatedTons ? Number.parseFloat(estimatedTons) : undefined,
        number_of_goods: numberOfGoods ? Number.parseInt(numberOfGoods) : undefined,
        delivery_place: formData.get("deliveryPlace") as string,
        required_date: formData.get("requiredDate") as string,
        special_instructions: formData.get("specialInstructions") as string,
      }

      // Save to database
      const response = await fetch("/api/buyer-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save transport request")
      }

      const result = await response.json()
      
      if (editingRequest) {
        // For editing, we'll need to implement a PUT endpoint
        setError("Editing is not yet implemented - please delete and recreate")
      } else {
        // Add the new request to the list
        const newRequest: TransportRequest = {
          id: result.data.id,
          order_number: result.data.order_number,
          load_type: result.data.load_type,
          from_state: result.data.from_state,
          from_district: result.data.from_district,
          from_place: result.data.from_place,
          from_taluk: result.data.from_taluk,
          to_state: result.data.to_state,
          to_district: result.data.to_district,
          to_place: result.data.to_place,
          to_taluk: result.data.to_taluk,
          estimated_tons: result.data.estimated_tons,
          number_of_goods: result.data.number_of_goods,
          delivery_place: result.data.delivery_place,
          required_date: result.data.required_date,
          special_instructions: result.data.special_instructions,
          status: result.data.status,
          created_at: result.data.created_at,
        }
        setRequests((prev) => [...prev, newRequest])
      }

      setIsDialogOpen(false)
      setEditingRequest(null)
      
      // Notify parent component about data change
      if (onDataChange) {
        onDataChange()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transport request")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitRequest = async (requestId: number) => {
    try {
      // Update status in database
      const response = await fetch(`/api/buyer-requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "pending" }),
      })

      if (response.ok) {
        setRequests((prev) =>
          prev.map((request) => (request.id === requestId ? { ...request, status: "pending" } : request)),
        )
        
        // Notify parent component about data change
        if (onDataChange) {
          onDataChange()
        }
      } else {
        setError("Failed to submit request")
      }
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
      try {
        const response = await fetch(`/api/buyer-requests/${requestId}`, {
          method: "DELETE",
        })

        if (response.ok) {
          setRequests((prev) => prev.filter((request) => request.id !== requestId))
          
          // Notify parent component about data change
          if (onDataChange) {
            onDataChange()
          }
        } else {
          setError("Failed to delete request")
        }
      } catch (err) {
        setError("Failed to delete request")
      }
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-800",
      pending: "bg-yellow-100 text-yellow-800",
      submitted: "bg-blue-100 text-blue-800",
      assigned: "bg-purple-100 text-purple-800",
      in_progress: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </Badge>
    )
  }

  if (isLoadingRequests) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Transport Requests</h2>
            <p className="text-muted-foreground">Create and manage your transport requirements</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading requests...</p>
        </div>
      </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="loadType">Load Type *</Label>
                    <Select name="loadType" defaultValue={editingRequest?.load_type || ""} required>
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
                    <Label htmlFor="estimatedTons">Estimated Tons / Number of Goods *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="estimatedTons"
                        name="estimatedTons"
                        type="number"
                        step="0.1"
                        defaultValue={editingRequest?.estimated_tons || ""}
                        placeholder="Weight in tons"
                      />
                      <Input
                        id="numberOfGoods"
                        name="numberOfGoods"
                        type="number"
                        defaultValue={editingRequest?.number_of_goods || ""}
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
                    <Label htmlFor="fromState">State *</Label>
                    <Select name="fromState" defaultValue={editingRequest?.from_state || ""} required>
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
                    <Select name="fromDistrict" defaultValue={editingRequest?.from_district || ""} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.length === 0 ? (
                          <SelectItem value="" disabled>Loading districts...</SelectItem>
                        ) : (
                          districts.map((district) => (
                            <SelectItem key={district.id} value={district.name}>
                              {district.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                      defaultValue={editingRequest?.from_place || ""}
                      placeholder="Enter place"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromTaluk">Taluk</Label>
                    <Input
                      id="fromTaluk"
                      name="fromTaluk"
                      type="text"
                      defaultValue={editingRequest?.from_taluk || ""}
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
                    <Select name="toState" defaultValue={editingRequest?.to_state || ""} required>
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
                    <Select name="toDistrict" defaultValue={editingRequest?.to_district || ""} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.length === 0 ? (
                          <SelectItem value="" disabled>Loading districts...</SelectItem>
                        ) : (
                          districts.map((district) => (
                            <SelectItem key={district.id} value={district.name}>
                              {district.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
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
                      defaultValue={editingRequest?.to_place || ""}
                      placeholder="Enter place"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="toTaluk">Taluk</Label>
                    <Input
                      id="toTaluk"
                      name="toTaluk"
                      type="text"
                      defaultValue={editingRequest?.to_taluk || ""}
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
                      defaultValue={editingRequest?.delivery_place || ""}
                      placeholder="Enter delivery place"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requiredDate">Required Date</Label>
                    <Input
                      id="requiredDate"
                      name="requiredDate"
                      type="date"
                      defaultValue={editingRequest?.required_date || ""}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialInstructions">Special Instructions</Label>
                  <Textarea
                    id="specialInstructions"
                    name="specialInstructions"
                    defaultValue={editingRequest?.special_instructions || ""}
                    placeholder="Any special handling requirements or instructions"
                    rows={3}
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false)
                    setEditingRequest(null)
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : editingRequest ? "Update Request" : "Create Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Transport Requests</CardTitle>
          <CardDescription>
            {requests.length === 0 ? "No transport requests yet" : `${requests.length} transport request(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transport requests found</p>
              <p className="text-sm text-muted-foreground mt-2">Create your first transport request to get started</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Load Type</TableHead>
                    <TableHead>From → To</TableHead>
                    <TableHead>Delivery Place</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.load_type}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.estimated_tons ? `${request.estimated_tons} tons` : ''}
                            {request.estimated_tons && request.number_of_goods && ' • '}
                            {request.number_of_goods ? `${request.number_of_goods} items` : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.from_place}</div>
                          <div className="text-sm text-muted-foreground">→ {request.to_place}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.delivery_place}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSubmitRequest(request.id)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Submit
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(request)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(request.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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
    </div>
  )
}
