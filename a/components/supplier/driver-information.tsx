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
  license_document_url?: string
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
  const [blockingOrders, setBlockingOrders] = useState<any[]>([])
  const [uploadingDriverId, setUploadingDriverId] = useState<number | null>(null)

  // Fetch drivers from database
  const fetchDrivers = async () => {
    try {
      setIsFetching(true)
      
      // Get current supplier ID from auth
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (!userResponse.ok) {
        setError("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id
      
      const response = await fetch(`/api/supplier-drivers?supplierId=${supplierId}`, {
        credentials: 'include'
      })
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

  // Add a key to force re-render when supplier changes
  useEffect(() => {
    const handleStorageChange = () => {
      // Clear current data and refetch when storage changes (user login/logout)
      setDrivers([])
      setError("")
      fetchDrivers()
    }

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', handleStorageChange)
    
    // Also refetch when component becomes visible (in case of tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDrivers()
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
      const driverName = formData.get("name") as string
      const mobile = formData.get("mobile") as string
      const licenseFile = formData.get("licenseDocument") as File

      // Validate required fields
      if (!driverName || !mobile) {
        setError("Driver Name and Mobile Number are required")
        setIsLoading(false)
        return
      }

      let licenseDocumentUrl: string | undefined

      // Handle file upload if a file was selected
      if (licenseFile && licenseFile.size > 0) {
        try {
          const uploadFormData = new FormData()
          uploadFormData.append("file", licenseFile)
          uploadFormData.append("category", "drivers")

          const uploadResponse = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          })

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json()
            licenseDocumentUrl = uploadResult.url
            console.log("File uploaded successfully:", licenseDocumentUrl)
          } else {
            console.error("File upload failed")
            setError("Failed to upload driving license document")
            setIsLoading(false)
            return
          }
        } catch (uploadError) {
          console.error("File upload error:", uploadError)
          setError("Failed to upload driving license document")
          setIsLoading(false)
          return
        }
      }

      // Get current supplier ID from auth
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        setError("Failed to get current supplier")
        setIsLoading(false)
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id

      const driverData = {
        supplierId: supplierId,
        driverName: driverName.trim(),
        mobile: mobile.trim(),
        licenseDocumentUrl: licenseDocumentUrl,
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

  const getBlockingOrders = async (driverId: number) => {
    try {
      const response = await fetch(`/api/driver-blocking-orders?driverId=${driverId}`)
      if (response.ok) {
        const data = await response.json()
        return data.blockingOrders
      }
    } catch (error) {
      console.error("Failed to get blocking orders:", error)
    }
    return { confirmedOrders: [], vehicleLocationOrders: [] }
  }

  const handleDelete = async (driverId: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return

    try {
      setError("")
      setBlockingOrders([])
      
      const response = await fetch(`/api/supplier-drivers?id=${driverId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchDrivers() // Refresh the list
        onDataChange?.() // Refresh dashboard stats
      } else {
        console.error("Delete failed with status:", response.status)
        console.error("Response headers:", response.headers)
        
        let errorData = {}
        try {
          const responseText = await response.text()
          console.error("Response text:", responseText)
          
          if (responseText) {
            errorData = JSON.parse(responseText)
          }
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
        }
        
        console.error("Parsed error data:", errorData)
        
        if (response.status === 400) {
          // Show specific error message for constraint violations
          const errorMessage = (errorData as any).error || "Cannot delete driver due to system constraints"
          setError(errorMessage)
          console.error("400 Error message:", errorMessage)
          
          // If it's a constraint violation, get more details about blocking orders
          if (errorMessage.includes("assigned to") || errorMessage.includes("referenced")) {
            console.log("Driver deletion blocked due to active orders")
            const blockingOrdersData = await getBlockingOrders(driverId)
            setBlockingOrders([
              ...blockingOrdersData.confirmedOrders,
              ...blockingOrdersData.vehicleLocationOrders
            ])
          }
        } else if (response.status === 503) {
          // Database connection error
          setError("Database connection error. Please try again in a moment.")
        } else {
          setError(`Failed to delete driver: ${(errorData as any).error || 'Unknown error'}`)
        }
      }
    } catch (err) {
      console.error("Delete error:", err)
      setError("Failed to delete driver due to network error")
    }
  }

  const handleDocumentUpload = async (driverId: number, file: File) => {
    try {
      setError("") // Clear any previous errors
      setUploadingDriverId(driverId) // Set loading state
      console.log("Starting document upload for driver:", driverId, "File:", file.name)
      
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", "drivers")
      formData.append("driverId", driverId.toString())

      console.log("Uploading file to /api/upload...")
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("Upload response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Upload successful, data:", data)
        
        // Update the driver's license document URL
        console.log("Updating driver with new document URL...")
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

        console.log("Update response status:", updateResponse.status)
        
        if (updateResponse.ok) {
          console.log("Driver updated successfully, refreshing list...")
          await fetchDrivers() // Refresh the list
          onDataChange?.() // Refresh dashboard stats
          console.log("Document upload completed successfully")
        } else {
          const updateError = await updateResponse.json()
          console.error("Failed to update driver:", updateError)
          setError("Failed to update driver with new document")
        }
      } else {
        const uploadError = await response.json()
        console.error("Upload failed:", uploadError)
        setError(`Upload failed: ${uploadError.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error("Document upload error:", err)
      setError("Failed to upload document due to network error")
    } finally {
      setUploadingDriverId(null) // Clear loading state
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, driverId: number) => {
    const file = e.target.files?.[0]
    console.log("File selected:", file)
    
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Only JPG, PNG, and PDF files are allowed.")
        return
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setError("File size too large. Maximum 5MB allowed.")
        return
      }
      
      console.log("File validation passed, starting upload...")
      handleDocumentUpload(driverId, file)
    } else {
      console.log("No file selected")
    }
    
    // Reset the input value so the same file can be selected again
    e.target.value = ""
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
                  <AlertDescription>
                    {error}
                    {blockingOrders.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Active orders preventing deletion:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {blockingOrders.map((order, index) => (
                            <li key={index} className="text-sm">
                              {order.state && order.district && order.place 
                                ? `${order.state} - ${order.district} - ${order.place} (${order.vehicle_number || 'N/A'})`
                                : `Order ID: ${order.id} (${order.status || 'Unknown status'})`
                              }
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm mt-2 text-muted-foreground">
                          Please complete or reassign these orders before deleting the driver.
                        </p>
                      </div>
                    )}
                  </AlertDescription>
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
                  <TableCell>
                    <div className="flex gap-2">
                      {driver.license_document_url ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(driver.license_document_url, '_blank')}
                        >
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
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileChange(e, driver.id)}
                          id={`file-input-${driver.id}`}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="relative"
                          disabled={uploadingDriverId === driver.id}
                          onClick={() => {
                            console.log("Upload button clicked for driver:", driver.id)
                            const fileInput = document.getElementById(`file-input-${driver.id}`)
                            console.log("File input element:", fileInput)
                            fileInput?.click()
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          {uploadingDriverId === driver.id ? "Uploading..." : "Upload"}
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
