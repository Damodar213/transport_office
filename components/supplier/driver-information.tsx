"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Edit, Trash2, Upload, Eye } from "lucide-react"

interface Driver {
  id: number
  supplier_id: number
  driver_name: string
  mobile: string
  license_number: string
  license_document_url?: string
  aadhaar_number?: string
  experience_years?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface DriverInformationProps {
  onDataChange?: () => void
}

export function DriverInformation({ onDataChange }: DriverInformationProps) {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState("")

  // Fetch drivers from database
  const fetchDrivers = async () => {
    try {
      setIsFetching(true)
      const response = await fetch("/api/supplier-drivers?supplierId=111111") // Use the actual supplier ID from your existing data
      if (response.ok) {
        const data = await response.json()
        setDrivers(data.drivers)
      } else {
        setError("Failed to fetch drivers")
      }
    } catch (err) {
      setError("Failed to fetch drivers")
    } finally {
      setIsFetching(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true)
    setError("")

    try {
      // Debug: Log all form data
      console.log("Form data entries:")
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`)
      }

      // Get and validate required fields
      const driverName = formData.get("name") as string
      const mobile = formData.get("mobile") as string
      const licenseNumber = formData.get("licenseNumber") as string

      // Validate required fields
      if (!driverName || !mobile || !licenseNumber) {
        setError("Driver Name, Mobile Number, and License Number are required")
        setIsLoading(false)
        return
      }

      // Handle optional fields properly
      const aadhaarNumber = formData.get("aadhaarNumber") as string
      const experienceYearsStr = formData.get("experienceYears") as string
      
      let experienceYears: number | undefined
      if (experienceYearsStr && experienceYearsStr.trim() !== "") {
        const parsed = parseInt(experienceYearsStr)
        if (!isNaN(parsed) && parsed >= 0) {
          experienceYears = parsed
        }
      }

      const driverData = {
        supplierId: "111111", // Use the actual supplier ID from your existing data
        driverName: driverName.trim(),
        mobile: mobile.trim(),
        licenseNumber: licenseNumber.trim(),
        aadhaarNumber: aadhaarNumber ? aadhaarNumber.trim() : undefined,
        experienceYears: experienceYears,
      }

      console.log("Driver data being sent:", driverData)

      if (editingDriver) {
        // Update existing driver
        const response = await fetch("/api/supplier-drivers", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingDriver.id,
            ...driverData,
          }),
        })

        if (response.ok) {
          await fetchDrivers() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          setIsDialogOpen(false)
          setEditingDriver(null)
        } else {
          const errorData = await response.json()
          console.error("Update failed:", errorData)
          setError(`Failed to update driver: ${errorData.error || 'Unknown error'}`)
        }
      } else {
        // Add new driver
        console.log("Sending POST request to /api/supplier-drivers")
        const response = await fetch("/api/supplier-drivers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(driverData),
        })

        console.log("Response status:", response.status)
        
        if (response.ok) {
          const result = await response.json()
          console.log("Driver created successfully:", result)
          await fetchDrivers() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          setIsDialogOpen(false)
        } else {
          const errorData = await response.json()
          console.error("Creation failed:", errorData)
          setError(`Failed to create driver: ${errorData.error || 'Unknown error'}`)
        }
      }
    } catch (err) {
      console.error("Form submission error:", err)
      setError("Failed to save driver information")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (driver: Driver) => {
    setEditingDriver(driver)
    setIsDialogOpen(true)
  }

  const handleDelete = async (driverId: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return

    try {
      const response = await fetch(`/api/supplier-drivers?id=${driverId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchDrivers() // Refresh the list
        onDataChange?.() // Refresh dashboard stats
      } else {
        setError("Failed to delete driver")
      }
    } catch (err) {
      setError("Failed to delete driver")
    }
  }

  const handleDocumentUpload = async (driverId: number, file: File) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "drivers")
      formData.append("driverId", driverId.toString())

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        // Update the driver's license document URL
        const updateResponse = await fetch("/api/supplier-drivers", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: driverId,
            licenseDocumentUrl: data.url,
          }),
        })

        if (updateResponse.ok) {
          await fetchDrivers() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
        }
      }
    } catch (err) {
      setError("Failed to upload document")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, driverId: number) => {
    const file = e.target.files?.[0]
    if (file) {
      handleDocumentUpload(driverId, file)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Driver Information</h2>
          <p className="text-muted-foreground">Manage your driver details and documentation</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingDriver(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Driver
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
              <DialogDescription>Enter the driver's information and upload their driving license</DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Driver Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  defaultValue={editingDriver?.driver_name || ""}
                  placeholder="Enter driver's full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  required
                  defaultValue={editingDriver?.mobile || ""}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">Driving License Number *</Label>
                <Input
                  id="licenseNumber"
                  name="licenseNumber"
                  type="text"
                  required
                  defaultValue={editingDriver?.license_number || ""}
                  placeholder="Enter license number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aadhaarNumber">Aadhaar Number</Label>
                <Input
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  type="text"
                  defaultValue={editingDriver?.aadhaar_number || ""}
                  placeholder="Enter Aadhaar number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceYears">Experience (Years)</Label>
                <Input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="50"
                  defaultValue={editingDriver?.experience_years || ""}
                  placeholder="Enter years of experience"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseDocument">Driving License Photo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="licenseDocument"
                    name="licenseDocument"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="file:mr-2 file:py-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                  />
                  <Upload className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Saving..." : editingDriver ? "Update Driver" : "Add Driver"}
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
          <CardTitle>Registered Drivers</CardTitle>
          <CardDescription>All drivers registered under your transport company</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>License Document</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.driver_name}</TableCell>
                  <TableCell>{driver.mobile}</TableCell>
                  <TableCell>{driver.license_number}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {driver.license_document_url ? (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not uploaded</span>
                      )}
                      <div className="relative">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleFileChange(e, driver.id)}
                        />
                        <Button variant="outline" size="sm" className="relative">
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{driver.created_at}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(driver)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(driver.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
