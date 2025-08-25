"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Truck, MapPin, Phone, Star, Filter, RefreshCw } from "lucide-react"

interface NearbyVehicle {
  id: number
  vehicleNumber: string
  supplierName: string
  supplierCompany: string
  contactNumber: string
  wheelType: string
  bodyType: string
  location: string
  district: string
  state: string
  distanceKm: number
  isAvailable: boolean
  rating: number
  completedTrips: number
  lastActive: string
}

export function NearbyVehicles() {
  const [vehicles] = useState<NearbyVehicle[]>([
    {
      id: 1,
      vehicleNumber: "KA01AB1234",
      supplierName: "Rajesh Kumar",
      supplierCompany: "Kumar Transport",
      contactNumber: "+91 9876543210",
      wheelType: "10",
      bodyType: "Full Body",
      location: "Electronic City",
      district: "Bangalore",
      state: "Karnataka",
      distanceKm: 5.2,
      isAvailable: true,
      rating: 4.5,
      completedTrips: 156,
      lastActive: "2 hours ago",
    },
    {
      id: 2,
      vehicleNumber: "KA02CD5678",
      supplierName: "Suresh Patel",
      supplierCompany: "Patel Logistics",
      contactNumber: "+91 9876543211",
      wheelType: "12",
      bodyType: "Container",
      location: "Whitefield",
      district: "Bangalore",
      state: "Karnataka",
      distanceKm: 8.7,
      isAvailable: true,
      rating: 4.8,
      completedTrips: 203,
      lastActive: "1 hour ago",
    },
    {
      id: 3,
      vehicleNumber: "KA03EF9012",
      supplierName: "Mohan Singh",
      supplierCompany: "Singh Transport Co.",
      contactNumber: "+91 9876543212",
      wheelType: "14",
      bodyType: "Open Body",
      location: "Hebbal",
      district: "Bangalore",
      state: "Karnataka",
      distanceKm: 12.3,
      isAvailable: false,
      rating: 4.2,
      completedTrips: 89,
      lastActive: "30 minutes ago",
    },
  ])

  const [filteredVehicles, setFilteredVehicles] = useState(vehicles)
  const [filters, setFilters] = useState({
    wheelType: "all",
    bodyType: "all",
    maxDistance: "50",
    availableOnly: true,
  })
  const [isAdminEnabled] = useState(true) // Mock admin setting

  const wheelTypes = ["6", "8", "10", "12", "14", "16", "18"]
  const bodyTypes = ["Half Body", "Full Body", "Container", "Open Body", "Closed Body", "Tanker"]

  const applyFilters = () => {
    let filtered = vehicles

    if (filters.availableOnly) {
      filtered = filtered.filter((vehicle) => vehicle.isAvailable)
    }

    if (filters.wheelType !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.wheelType === filters.wheelType)
    }

    if (filters.bodyType !== "all") {
      filtered = filtered.filter((vehicle) => vehicle.bodyType === filters.bodyType)
    }

    const maxDist = Number.parseInt(filters.maxDistance)
    filtered = filtered.filter((vehicle) => vehicle.distanceKm <= maxDist)

    // Sort by distance
    filtered.sort((a, b) => a.distanceKm - b.distanceKm)

    setFilteredVehicles(filtered)
  }

  const handleRefresh = () => {
    // Mock refresh functionality
    console.log("Refreshing vehicle data...")
  }

  const handleContact = (vehicle: NearbyVehicle) => {
    // Mock contact functionality
    window.open(`tel:${vehicle.contactNumber}`)
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
      />
    ))
  }

  if (!isAdminEnabled) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Nearby Vehicles</h2>
          <p className="text-muted-foreground">View available vehicles in your area</p>
        </div>
        <Alert>
          <AlertDescription>
            Vehicle tracking is currently disabled by the administrator. Please contact support for more information.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Nearby Vehicles</h2>
          <p className="text-muted-foreground">Find available vehicles in your district</p>
        </div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Wheel Type</Label>
              <Select
                value={filters.wheelType}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, wheelType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {wheelTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} Wheeler
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Body Type</Label>
              <Select
                value={filters.bodyType}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, bodyType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {bodyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Distance (km)</Label>
              <Input
                type="number"
                value={filters.maxDistance}
                onChange={(e) => setFilters((prev) => ({ ...prev, maxDistance: e.target.value }))}
                placeholder="Enter max distance"
              />
            </div>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
          <div className="mt-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.availableOnly}
                onChange={(e) => setFilters((prev) => ({ ...prev, availableOnly: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Show only available vehicles</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">In your district</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available Now</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.filter((v) => v.isAvailable).length}</div>
            <p className="text-xs text-muted-foreground">Ready for booking</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Distance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(vehicles.reduce((sum, v) => sum + v.distanceKm, 0) / vehicles.length).toFixed(1)} km
            </div>
            <p className="text-xs text-muted-foreground">From your location</p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Vehicles</CardTitle>
          <CardDescription>{filteredVehicles.length} vehicles found matching your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Details</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        {vehicle.vehicleNumber}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle.wheelType} Wheeler • {vehicle.bodyType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vehicle.supplierName}</div>
                      <div className="text-sm text-muted-foreground">{vehicle.supplierCompany}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm">{vehicle.location}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.district}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{vehicle.distanceKm} km</div>
                    <div className="text-xs text-muted-foreground">Last active: {vehicle.lastActive}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {renderStars(vehicle.rating)}
                      <span className="text-sm ml-1">({vehicle.completedTrips})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={vehicle.isAvailable ? "default" : "secondary"}
                      className={vehicle.isAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {vehicle.isAvailable ? "Available" : "Busy"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContact(vehicle)}
                      disabled={!vehicle.isAvailable}
                    >
                      <Phone className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredVehicles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No vehicles found matching your criteria. Try adjusting your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
