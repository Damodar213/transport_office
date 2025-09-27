"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Truck, Building, Upload, Shield, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("supplier")
  
  // Password visibility states
  const [showSupplierPassword, setShowSupplierPassword] = useState(false)
  const [showBuyerPassword, setShowBuyerPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [showAdminKey, setShowAdminKey] = useState(false)

  useEffect(() => {
    const role = searchParams.get("role")
    if (role === "buyer" || role === "supplier" || role === "admin") {
      setActiveTab(role)
    }
  }, [searchParams])

  const handleSignup = async (formData: FormData, role: string) => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Account created successfully! Please login to continue.")
      } else {
        setError(data.error || "Signup failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Logo size="lg" />
          </div>
          <p className="text-muted-foreground">Create your account</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="supplier" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Supplier
            </TabsTrigger>
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Buyer
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="supplier">
            <Card>
              <CardHeader>
                <CardTitle>Supplier Registration</CardTitle>
                <CardDescription>Register as a transport supplier to offer your services</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={(formData) => {
                    formData.append("role", "supplier")
                    handleSignup(formData, "supplier")
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier-name">Full Name *</Label>
                      <Input id="supplier-name" name="name" type="text" required placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier-mobile">Mobile Number *</Label>
                      <Input 
                        id="supplier-mobile" 
                        name="mobile" 
                        type="tel" 
                        required 
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="Enter 10-digit mobile number"
                        onChange={(e) => {
                          // Only allow digits and limit to 10 characters
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          e.target.value = value
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter exactly 10 digits (numbers only)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier-company">Company Name *</Label>
                      <Input
                        id="supplier-company"
                        name="companyName"
                        type="text"
                        required
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier-gst">GST Number</Label>
                      <Input id="supplier-gst" name="gstNumber" type="text" placeholder="Enter GST number" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier-userId">User ID *</Label>
                      <Input
                        id="supplier-userId"
                        name="userId"
                        type="text"
                        required
                        placeholder="Choose a unique user ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier-email">Email ID</Label>
                      <Input id="supplier-email" name="email" type="email" placeholder="Enter email address" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="supplier-password"
                          name="password"
                          type={showSupplierPassword ? "text" : "password"}
                          required
                          placeholder="Create a password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSupplierPassword(!showSupplierPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showSupplierPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier-vehicles">Number of Vehicles</Label>
                      <Input
                        id="supplier-vehicles"
                        name="numberOfVehicles"
                        type="number"
                        min="1"
                        max="100"
                        placeholder="Enter number of vehicles"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Document Uploads</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pan">PAN Card</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="pan"
                            name="pan"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gst-cert">GST Certificate</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="gst-cert"
                            name="gstCertificate"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                          />
                          <Upload className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Supplier Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="buyer">
            <Card>
              <CardHeader>
                <CardTitle>Buyer Registration</CardTitle>
                <CardDescription>Register as a buyer to request transport services</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={(formData) => {
                    formData.append("role", "buyer")
                    handleSignup(formData, "buyer")
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyer-company">Company Name *</Label>
                      <Input
                        id="buyer-company"
                        name="companyName"
                        type="text"
                        required
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-gst">GST Number</Label>
                      <Input id="buyer-gst" name="gstNumber" type="text" placeholder="Enter GST number" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyer-userId">User ID *</Label>
                      <Input
                        id="buyer-userId"
                        name="userId"
                        type="text"
                        required
                        placeholder="Choose a unique user ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="buyer-password"
                          name="password"
                          type={showBuyerPassword ? "text" : "password"}
                          required
                          placeholder="Create a password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowBuyerPassword(!showBuyerPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showBuyerPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Buyer Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin">
            <Card>
              <CardHeader>
                <CardTitle>Admin Registration</CardTitle>
                <CardDescription>Register as an administrator to manage the transport office system</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  action={(formData) => {
                    formData.append("role", "admin")
                    handleSignup(formData, "admin")
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name *</Label>
                      <Input id="admin-name" name="name" type="text" required placeholder="Enter your full name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-mobile">Mobile Number *</Label>
                      <Input 
                        id="admin-mobile" 
                        name="mobile" 
                        type="tel" 
                        required 
                        maxLength={10}
                        pattern="[0-9]{10}"
                        placeholder="Enter 10-digit mobile number"
                        onChange={(e) => {
                          // Only allow digits and limit to 10 characters
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                          e.target.value = value
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter exactly 10 digits (numbers only)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-userId">User ID *</Label>
                      <Input
                        id="admin-userId"
                        name="userId"
                        type="text"
                        required
                        placeholder="Choose a unique admin ID"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email ID *</Label>
                      <Input id="admin-email" name="email" type="email" required placeholder="Enter email address" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="admin-password"
                          name="password"
                          type={showAdminPassword ? "text" : "password"}
                          required
                          placeholder="Create a secure password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showAdminPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-key">Admin Authorization Key *</Label>
                      <div className="relative">
                        <Input
                          id="admin-key"
                          name="adminKey"
                          type={showAdminKey ? "text" : "password"}
                          required
                          placeholder="Enter admin authorization key"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminKey(!showAdminKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          {showAdminKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Admin registration requires a valid authorization key. Contact your system administrator for the
                      key.
                    </AlertDescription>
                  </Alert>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert>
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Create Admin Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
