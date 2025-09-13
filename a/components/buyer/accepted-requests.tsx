"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, RefreshCw, MapPin, Package, User, Truck, Calendar, CheckCircle, Clock, Truck as TruckIcon, Phone } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AcceptedRequest {
  id: number
  buyer_request_id: number
  order_submission_id: number
  order_number: string
  load_type: string
  from_state: string
  from_district: string
  from_place: string
  to_state: string
  to_district: string
  to_place: string
  estimated_tons: number
  rate: number
  distance_km: number
  driver_name: string
  driver_mobile: string
  vehicle_number: string
  vehicle_type: string
  supplier_company: string
  status: string
  accepted_at: string
  created_at: string
  updated_at: string
}

export function AcceptedRequests() {
  const [requests, setRequests] = useState<AcceptedRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<AcceptedRequest[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState("")
  const [selectedRequest, setSelectedRequest] = useState<AcceptedRequest | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch accepted requests
  const fetchAcceptedRequests = async () => {
    try {
      setIsFetching(true)
      setError("")
      
      const response = await fetch("/api/buyer/accepted-requests")
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        setFilteredRequests(data.requests)
      } else {
        setError("Failed to fetch accepted requests")
      }
    } catch (err) {
      setError("Failed to fetch accepted requests")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchAcceptedRequests()
  }, [])

  // Filter requests based on search and filters
  useEffect(() => {
    let filtered = requests

    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter)
    }

    if (searchTerm) {
      filtered = filtered.filter((request) =>
        request.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.driver_mobile?.includes(searchTerm)
      )
    }

    setFilteredRequests(filtered)
  }, [requests, statusFilter, searchTerm])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      accepted: { label: "Accepted", variant: "default" as const, icon: CheckCircle },
      confirmed: { label: "Confirmed", variant: "secondary" as const, icon: CheckCircle },
      in_transit: { label: "In Transit", variant: "outline" as const, icon: TruckIcon },
      delivered: { label: "Delivered", variant: "default" as const, icon: CheckCircle },
      cancelled: { label: "Cancelled", variant: "destructive" as const, icon: Clock }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.accepted
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const handleViewRequest = (request: AcceptedRequest) => {
    setSelectedRequest(request)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Accepted Requests</h2>
          <p className="text-muted-foreground">Orders accepted by suppliers with driver and vehicle assignments</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAcceptedRequests}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by order number, driver, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Requests List */}
      {isFetching ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h4 className="text-lg font-medium mb-2">Loading Requests...</h4>
            <p className="text-muted-foreground">Please wait while we fetch your accepted requests.</p>
          </CardContent>
        </Card>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Accepted Requests</h4>
            <p className="text-muted-foreground">No suppliers have accepted your orders yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-lg">{request.order_number}</h4>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{request.driver_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{request.vehicle_number}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{request.driver_mobile}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Load: {request.load_type} • Route: {request.from_place} → {request.to_place}</p>
                      <p>Accepted: {new Date(request.accepted_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewRequest(request)}
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

      {/* Request Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Details - {selectedRequest?.order_number}</DialogTitle>
            <DialogDescription>
              Complete information about the accepted request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-3">Order Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Order Number:</span> {selectedRequest.order_number}</p>
                    <p><span className="font-medium">Load Type:</span> {selectedRequest.load_type}</p>
                    <p><span className="font-medium">Route:</span> {selectedRequest.from_place} → {selectedRequest.to_place}</p>
                    <p><span className="font-medium">Status:</span> {getStatusBadge(selectedRequest.status)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Driver & Vehicle Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Driver Name:</span> {selectedRequest.driver_name}</p>
                    <p><span className="font-medium">Driver Mobile:</span> {selectedRequest.driver_mobile || 'N/A'}</p>
                    <p><span className="font-medium">Vehicle Number:</span> {selectedRequest.vehicle_number}</p>
                    <p><span className="font-medium">Accepted:</span> {new Date(selectedRequest.accepted_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
