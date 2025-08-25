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
import { Plus, Edit, Trash2, Upload, Eye } from "lucide-react"

interface Vehicle {
  id: number
  supplier_id: number
  vehicle_number: string
  body_type: string
  capacity_tons?: number
  fuel_type?: string
  registration_number?: string
  insurance_expiry?: string
  fitness_expiry?: string
  permit_expiry?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface TruckInformationProps {
  onDataChange?: () => void
}

export function TruckInformation({ onDataChange }: TruckInformationProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState("")

  const bodyTypes = ["Half Body", "Full Body", "Container", "Open Body", "Closed Body", "Tanker", "Trailer"]
  const fuelTypes = ["Diesel", "Petrol", "CNG", "Electric", "Hybrid"]

  // Fetch trucks from database
  const fetchTrucks = async () => {
    try {
      setIsFetching(true)
      const response = await fetch("/api/supplier-trucks?supplierId=111111") // Use the actual supplier ID from your existing data
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.trucks)
      } else {
        setError("Failed to fetch trucks")
      }
    } catch (err) {
      setError("Failed to fetch trucks")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchTrucks()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      const vehicleData = {
        supplierId: "111111", // Use the actual supplier ID from your existing data
        vehicleNumber: formData.get("vehicleNumber") as string,
        bodyType: formData.get("bodyType") as string,
        capacityTons: parseFloat(formData.get("capacityTons") as string) || undefined,
        fuelType: formData.get("fuelType") as string,
        registrationNumber: formData.get("registrationNumber") as string,
        insuranceExpiry: formData.get("insuranceExpiry") as string,
        fitnessExpiry: formData.get("fitnessExpiry") as string,
        permitExpiry: formData.get("permitExpiry") as string,
      }

      if (editingVehicle) {
        // Update existing truck
        const response = await fetch("/api/supplier-trucks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingVehicle.id,
            ...vehicleData,
          }),
        })

        if (response.ok) {
          await fetchTrucks() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          setIsDialogOpen(false)
          setEditingVehicle(null)
        } else {
          setError("Failed to update truck")
        }
      } else {
        // Add new truck
        const response = await fetch("/api/supplier-trucks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vehicleData),
        })

        if (response.ok) {
          await fetchTrucks() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          setIsDialogOpen(false)
        } else {
          setError("Failed to create truck")
        }
      }
    } catch (err) {
      setError("Failed to save truck information")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setIsDialogOpen(true)
  }

  const handleDelete = async (vehicleId: number) => {
    if (!confirm("Are you sure you want to delete this truck?")) return

    try {
      const response = await fetch(`/api/supplier-trucks?id=${vehicleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTrucks() // Refresh the list
        onDataChange?.() // Refresh dashboard stats
      } else {
        setError("Failed to delete truck")
      }
    } catch (err) {
      setError("Failed to delete truck")
    }
  }

  const toggleAvailability = (vehicleId: number) => {
    setVehicles((prev) =>
      prev.map((vehicle) => (vehicle.id === vehicleId ? { ...vehicle, is_active: !vehicle.is_active } : vehicle)),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Truck Information</h2>
          <p className="text-muted-foreground">Manage your vehicle fleet and documentation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingVehicle(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}</DialogTitle>
              <DialogDescription>Enter vehicle details and upload required documents</DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    type="text"
                    required
                    defaultValue={editingVehicle?.vehicle_number || ""}
                    placeholder="Enter vehicle number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Body Type *</Label>
                  <Select name="bodyType" defaultValue={editingVehicle?.body_type || ""} required>
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
                <Label htmlFor="capacityTons">Capacity (Tons)</Label>
                <Input
                  id="capacityTons"
                  name="capacityTons"
                  type="number"
                  step="0.1"
                  defaultValue={editingVehicle?.capacity_tons || ""}
                  placeholder="Enter capacity in tons"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select name="fuelType" defaultValue={editingVehicle?.fuel_type || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fuel type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fuelTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Registration Number</Label>
                <Input
                  id="registrationNumber"
                  name="registrationNumber"
                  type="text"
                  defaultValue={editingVehicle?.registration_number || ""}
                  placeholder="Enter registration number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
                <Input
                  id="insuranceExpiry"
                  name="insuranceExpiry"
                  type="date"
                  defaultValue={editingVehicle?.insurance_expiry || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fitnessExpiry">Fitness Expiry</Label>
                <Input
                  id="fitnessExpiry"
                  name="fitnessExpiry"
                  type="date"
                  defaultValue={editingVehicle?.fitness_expiry || ""}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="permitExpiry">Permit Expiry</Label>
                <Input
                  id="permitExpiry"
                  name="permitExpiry"
                  type="date"
                  defaultValue={editingVehicle?.permit_expiry || ""}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingVehicle ? "Update Vehicle" : "Add Vehicle"}
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
          <CardTitle>Your Vehicle Fleet</CardTitle>
          <CardDescription>Manage your registered vehicles and their documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Number</TableHead>
                <TableHead>Body Type</TableHead>
                <TableHead>Capacity (Tons)</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>Fitness</TableHead>
                <TableHead>Permit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <p>Loading trucks...</p>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    <p>No trucks found. Add a new one!</p>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                    <TableCell>{vehicle.body_type}</TableCell>
                    <TableCell>{vehicle.capacity_tons || "N/A"}</TableCell>
                    <TableCell>{vehicle.fuel_type || "N/A"}</TableCell>
                    <TableCell>{vehicle.registration_number || "N/A"}</TableCell>
                    <TableCell>{vehicle.insurance_expiry || "N/A"}</TableCell>
                    <TableCell>{vehicle.fitness_expiry || "N/A"}</TableCell>
                    <TableCell>{vehicle.permit_expiry || "N/A"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={vehicle.is_active ? "default" : "secondary"}
                        className={vehicle.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {vehicle.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehicle.created_at}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(vehicle)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => toggleAvailability(vehicle.id)}>
                          {vehicle.is_active ? "Mark Inactive" : "Mark Active"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(vehicle.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
