"use client"

import { useState } from "react"
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
import { Eye, Check, X, Filter, Calendar, Package, Truck } from "lucide-react"

interface TransportRequest {
  id: number
  buyerId: string
  buyerName: string
  buyerCompany: string
  loadType: string
  fromLocation: string
  toLocation: string
  estimatedTons: number
  requiredDate: string
  specialInstructions?: string
  status: "pending" | "assigned" | "confirmed" | "rejected"
  submittedAt: string
  assignedSupplierId?: string
  assignedSupplierName?: string
  adminNotes?: string
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
  const [requests, setRequests] = useState<TransportRequest[]>([
    {
      id: 1,
      buyerId: "BUY001",
      buyerName: "Priya Sharma",
      buyerCompany: "ABC Industries",
      loadType: "Rice",
      fromLocation: "Bangalore, Karnataka",
      toLocation: "Chennai, Tamil Nadu",
      estimatedTons: 25.5,
      requiredDate: "2024-02-15",
      specialInstructions: "Handle with care - premium quality rice",
      status: "pending",
      submittedAt: "2024-02-10 14:30",
    },
    {
      id: 2,
      buyerId: "BUY002",
      buyerName: "Amit Patel",
      buyerCompany: "XYZ Logistics",
      loadType: "Wheat",
      fromLocation: "Mysore, Karnataka",
      toLocation: "Hyderabad, Telangana",
      estimatedTons: 30.0,
      requiredDate: "2024-02-20",
      status: "assigned",
      submittedAt: "2024-02-09 11:20",
      assignedSupplierId: "SUP001",
      assignedSupplierName: "Kumar Transport Co.",
      adminNotes: "Assigned to reliable supplier with good track record",
    },
  ])

  const [suppliers] = useState<Supplier[]>([
    {
      id: "SUP001",
      name: "Rajesh Kumar",
      companyName: "Kumar Transport Co.",
      availableVehicles: 3,
      rating: 4.5,
      location: "Bangalore",
      isVerified: true,
    },
    {
      id: "SUP002",
      name: "Suresh Patel",
      companyName: "Patel Logistics",
      availableVehicles: 2,
      rating: 4.8,
      location: "Mysore",
      isVerified: true,
    },
    {
      id: "SUP003",
      name: "Mohan Singh",
      companyName: "Singh Transport Co.",
      availableVehicles: 1,
      rating: 4.2,
      location: "Chennai",
      isVerified: false,
    },
  ])

  const [selectedRequest, setSelectedRequest] = useState<TransportRequest | null>(null)
  const [selectedSupplier, setSelectedSupplier] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    dateFrom: "",
    dateTo: "",
    company: "",
  })

  // Manual order entry state
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualOrder, setManualOrder] = useState({
    loadType: "",
    estimatedTons: "",
    deliveryPlace: "",
    supplierId: "",
  })

  const handleAssignment = async (requestId: number, supplierId: string, notes: string) => {
    setIsProcessing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const supplier = suppliers.find((s) => s.id === supplierId)

      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId
            ? {
                ...request,
                status: "assigned",
                assignedSupplierId: supplierId,
                assignedSupplierName: supplier?.companyName,
                adminNotes: notes,
              }
            : request,
        ),
      )

      setSelectedRequest(null)
      setSelectedSupplier("")
      setAdminNotes("")
    } catch (error) {
      console.error("Assignment error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (requestId: number, notes: string) => {
    setIsProcessing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

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
    } catch (error) {
      console.error("Rejection error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualOrder = async () => {
    setIsProcessing(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const supplier = suppliers.find((s) => s.id === manualOrder.supplierId)

      const newRequest: TransportRequest = {
        id: Date.now(),
        buyerId: "ADMIN",
        buyerName: "Admin",
        buyerCompany: "Manual Entry",
        loadType: manualOrder.loadType,
        fromLocation: "Admin Specified",
        toLocation: manualOrder.deliveryPlace,
        estimatedTons: Number.parseFloat(manualOrder.estimatedTons),
        requiredDate: new Date().toISOString().split("T")[0],
        status: "assigned",
        submittedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
        assignedSupplierId: manualOrder.supplierId,
        assignedSupplierName: supplier?.companyName,
        adminNotes: "Manual order entry by admin",
      }

      setRequests((prev) => [...prev, newRequest])
      setShowManualEntry(false)
      setManualOrder({ loadType: "", estimatedTons: "", deliveryPlace: "", supplierId: "" })
    } catch (error) {
      console.error("Manual order error:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      confirmed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const filteredRequests = requests.filter((request) => {
    if (filters.status !== "all" && request.status !== filters.status) return false
    if (filters.company && !request.buyerCompany.toLowerCase().includes(filters.company.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Assignment</h2>
          <p className="text-muted-foreground">Review buyer requests and assign to suppliers</p>
        </div>
        <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
          <DialogTrigger asChild>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Manual Order Entry
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manual Order Entry</DialogTitle>
              <DialogDescription>Create a manual order and assign directly to a supplier</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="manual-loadType">Load Type</Label>
                <Input
                  id="manual-loadType"
                  value={manualOrder.loadType}
                  onChange={(e) => setManualOrder((prev) => ({ ...prev, loadType: e.target.value }))}
                  placeholder="Enter load type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-tons">Estimated Tons</Label>
                <Input
                  id="manual-tons"
                  type="number"
                  value={manualOrder.estimatedTons}
                  onChange={(e) => setManualOrder((prev) => ({ ...prev, estimatedTons: e.target.value }))}
                  placeholder="Enter weight in tons"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-delivery">Delivery Place</Label>
                <Input
                  id="manual-delivery"
                  value={manualOrder.deliveryPlace}
                  onChange={(e) => setManualOrder((prev) => ({ ...prev, deliveryPlace: e.target.value }))}
                  placeholder="Enter delivery location"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-supplier">Assign to Supplier</Label>
                <Select
                  value={manualOrder.supplierId}
                  onValueChange={(value) => setManualOrder((prev) => ({ ...prev, supplierId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers
                      .filter((s) => s.isVerified)
                      .map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.companyName} ({supplier.availableVehicles} vehicles)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
          <CardDescription>{filteredRequests.length} requests found</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Load Details</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Required Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
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
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          disabled={request.status === "confirmed"}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {request.status === "pending" ? "Assign" : "View"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
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
                            <div className="space-y-3 p-4 bg-muted/50 rounded">
                              <div>
                                <strong>Buyer:</strong> {request.buyerName} ({request.buyerCompany})
                              </div>
                              <div>
                                <strong>Load Type:</strong> {request.loadType}
                              </div>
                              <div>
                                <strong>Weight:</strong> {request.estimatedTons} tons
                              </div>
                              <div>
                                <strong>From:</strong> {request.fromLocation}
                              </div>
                              <div>
                                <strong>To:</strong> {request.toLocation}
                              </div>
                              <div>
                                <strong>Required Date:</strong> {request.requiredDate}
                              </div>
                              <div>
                                <strong>Submitted:</strong> {request.submittedAt}
                              </div>
                              {request.specialInstructions && (
                                <div>
                                  <strong>Special Instructions:</strong> {request.specialInstructions}
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
                                  <Label>Select Supplier</Label>
                                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Choose supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {suppliers
                                        .filter((s) => s.isVerified)
                                        .map((supplier) => (
                                          <SelectItem key={supplier.id} value={supplier.id}>
                                            <div className="flex items-center justify-between w-full">
                                              <span>{supplier.companyName}</span>
                                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Truck className="h-3 w-3" />
                                                {supplier.availableVehicles}
                                                <span>★ {supplier.rating}</span>
                                              </div>
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Admin Notes</Label>
                                  <Textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Enter assignment notes..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleAssignment(request.id, selectedSupplier, adminNotes)}
                                    disabled={!selectedSupplier || isProcessing}
                                    className="flex-1"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    {isProcessing ? "Assigning..." : "Assign Order"}
                                  </Button>
                                  <Button
                                    onClick={() => handleReject(request.id, adminNotes)}
                                    disabled={isProcessing}
                                    variant="destructive"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
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
