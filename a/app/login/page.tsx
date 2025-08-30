"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Truck, User, Building, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  
  // Password visibility states
  const [showSupplierPassword, setShowSupplierPassword] = useState(false)
  const [showBuyerPassword, setShowBuyerPassword] = useState(false)
  const [showAdminPassword, setShowAdminPassword] = useState(false)

  const handleLogin = async (formData: FormData, role: string) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: formData.get("userId"),
          password: formData.get("password"),
          role,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect based on role
        window.location.href = `/${role}/dashboard`
      } else {
        setError(data.error || "Login failed")
      }
    } catch (err) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Truck className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Transport Office</h1>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        {!showAdminLogin ? (
          <Tabs defaultValue="supplier" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="supplier" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Supplier
              </TabsTrigger>
              <TabsTrigger value="buyer" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Buyer
              </TabsTrigger>
            </TabsList>

            <TabsContent value="supplier">
              <Card>
                <CardHeader>
                  <CardTitle>Supplier Login</CardTitle>
                  <CardDescription>Enter your credentials to access your supplier dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={(formData) => handleLogin(formData, "supplier")} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplier-userId">User ID</Label>
                      <Input id="supplier-userId" name="userId" type="text" required placeholder="Enter your user ID" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="supplier-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="supplier-password"
                          name="password"
                          type={showSupplierPassword ? "text" : "password"}
                          required
                          placeholder="Enter your password"
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
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="buyer">
              <Card>
                <CardHeader>
                  <CardTitle>Buyer Login</CardTitle>
                  <CardDescription>Enter your credentials to access your buyer dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <form action={(formData) => handleLogin(formData, "buyer")} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="buyer-userId">User ID</Label>
                      <Input id="buyer-userId" name="userId" type="text" required placeholder="Enter your user ID" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buyer-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="buyer-password"
                          name="password"
                          type={showBuyerPassword ? "text" : "password"}
                          required
                          placeholder="Enter your password"
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
                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Login
              </CardTitle>
              <CardDescription>Administrative access only</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={(formData) => handleLogin(formData, "admin")} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-userId">Admin ID</Label>
                  <Input id="admin-userId" name="userId" type="text" required placeholder="Enter admin ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      name="password"
                      type={showAdminPassword ? "text" : "password"}
                      required
                      placeholder="Enter admin password"
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
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Admin Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => setShowAdminLogin(false)}
                >
                  Back to User Login
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:underline">
              Sign up here
            </Link>
          </p>
          {!showAdminLogin && (
            <button
              onClick={() => setShowAdminLogin(true)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Admin Access
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
