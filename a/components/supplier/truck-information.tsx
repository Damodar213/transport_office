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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentSupplierId, setCurrentSupplierId] = useState<string>("")

  const bodyTypes = ["Half Body", "Full Body", "Container", "Open Body", "Closed Body", "Tanker", "Trailer"]

  // Get current supplier ID
  const getCurrentSupplier = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentSupplierId(data.user.id)
        return data.user.id
      } else {
        console.error("Failed to get current supplier")
        return null
      }
    } catch (err) {
      console.error("Error getting current supplier:", err)
      return null
    }
  }

  // Fetch trucks from database for current supplier
  const fetchTrucks = async () => {
    try {
      setIsFetching(true)
      const supplierId = await getCurrentSupplier()
      
      if (!supplierId) {
        setError("Failed to get supplier information")
        return
      }

      const response = await fetch(`/api/supplier-trucks?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setVehicles(data.trucks || [])
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

  // Add a key to force re-render when supplier changes
  useEffect(() => {
    const handleStorageChange = () => {
      // Clear current data and refetch when storage changes (user login/logout)
      setVehicles([])
      setError("")
      fetchTrucks()
    }

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', handleStorageChange)
    
    // Also refetch when component becomes visible (in case of tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchTrucks()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      let documentUrl = ""
      
      // Handle file upload if a file is selected
      if (selectedFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', selectedFile)
        uploadFormData.append('category', 'vehicle-documents')
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include'
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          documentUrl = uploadResult.url
        } else {
          setError("Failed to upload document")
          setIsLoading(false)
          return
        }
      }

      const vehicleData = {
        supplierId: currentSupplierId, // Use the current supplier ID
        vehicleNumber: formData.get("vehicleNumber") as string,
        bodyType: formData.get("bodyType") as string,
        capacityTons: parseFloat(formData.get("capacityTons") as string) || undefined,
        numberOfWheels: parseInt(formData.get("numberOfWheels") as string) || undefined,
        documentUrl: documentUrl,
      }

      console.log("Sending vehicle data:", vehicleData)

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
          credentials: 'include'
        })

        if (response.ok) {
          await fetchTrucks() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          setIsDialogOpen(false)
          setEditingVehicle(null)
        } else {
          const errorData = await response.json()
          setError(errorData.error || "Failed to update truck")
        }
      } else {
        // Add new truck
        const response = await fetch("/api/supplier-trucks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(vehicleData),
          credentials: 'include'
        })

        if (response.ok) {
          await fetchTrucks() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          setIsDialogOpen(false)
        } else {
          const errorData = await response.json()
          setError(errorData.error || "Failed to create truck")
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
    setSelectedFile(null)
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
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
            <Button onClick={() => {
              setEditingVehicle(null)
              setSelectedFile(null)
            }}>
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
                <Label htmlFor="numberOfWheels">Number of Wheels</Label>
                <Input
                  id="numberOfWheels"
                  name="numberOfWheels"
                  type="number"
                  min="2"
                  max="18"
                  defaultValue={editingVehicle?.number_of_wheels || ""}
                  placeholder="Enter number of wheels"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Vehicle Document</Label>
                <div className="flex items-center gap-2">
                <Input
                    id="document"
                    name="document"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="flex-1 file:bg-[#2196F3] file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-[#1976D2]"
                  />
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">
                      {selectedFile.name}
                    </span>
                  )}
              </div>
                <p className="text-xs text-muted-foreground">
                  Upload vehicle registration, insurance, or other relevant documents (Image or PDF)
                </p>
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
                <TableHead>Number of Wheels</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetching ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p>Loading trucks...</p>
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p>No trucks found. Add a new one!</p>
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">{vehicle.vehicle_number}</TableCell>
                    <TableCell>{vehicle.body_type}</TableCell>
                    <TableCell>{vehicle.capacity_tons || "N/A"}</TableCell>
                    <TableCell>{vehicle.number_of_wheels || "N/A"}</TableCell>
                    <TableCell>
                      {vehicle.document_url ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={vehicle.document_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                          <span className="text-xs text-muted-foreground">View</span>
                        </div>
                      ) : (
                        "No document"
                      )}
                    </TableCell>
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
