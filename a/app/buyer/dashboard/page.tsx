"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Package, MapPin, LogOut } from "lucide-react"
import { TransportRequests } from "@/components/buyer/transport-requests"
import { OrderTracking } from "@/components/buyer/order-tracking"
import { Logo } from "@/components/ui/logo"

interface DashboardStats {
  activeRequests: number
  confirmedOrders: number
  completedOrders: number
}

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState("requests")
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    confirmedOrders: 0,
    completedOrders: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoadingStats(true)
        
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
        
        // Fetch transport requests (active requests)
        const requestsResponse = await fetch("/api/buyer-requests")
        let activeRequests = 0
        if (requestsResponse.ok) {
          const requestsData = await requestsResponse.json()
          if (requestsData.success) {
            activeRequests = requestsData.data.filter((req: any) => 
              req.status === "submitted" || req.status === "draft"
            ).length
          }
        }

        // Fetch orders for confirmed and completed counts
        const ordersResponse = await fetch("/api/orders")
        let confirmedOrders = 0
        let completedOrders = 0
        
        if (ordersResponse.ok) {
          const ordersData = await ordersResponse.json()
          if (ordersData.orders) {
            confirmedOrders = ordersData.orders.filter((order: any) => 
              order.status === "confirmed" || order.status === "picked_up" || order.status === "in_transit"
            ).length
            
            completedOrders = ordersData.orders.filter((order: any) => 
              order.status === "delivered"
            ).length
          }
        }

        setStats({
          activeRequests,
          confirmedOrders,
          completedOrders
        })
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        // Keep default values if API fails
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchDashboardStats()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Logo size="md" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Buyer Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome back to Mahalaxmi Transport Co.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.activeRequests}
              </div>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.confirmedOrders}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.completedOrders}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Transport Requests
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Order Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6">
            <TransportRequests onDataChange={() => {
              // Refresh stats when transport requests change
              const refreshStats = async () => {
                try {
                  setIsLoadingStats(true)
                  
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
                  
                  // Fetch transport requests (active requests)
                  const requestsResponse = await fetch("/api/buyer-requests")
                  let activeRequests = 0
                  if (requestsResponse.ok) {
                    const requestsData = await requestsResponse.json()
                    if (requestsData.success) {
                      activeRequests = requestsData.data.filter((req: any) => 
                        req.status === "submitted" || req.status === "draft"
                      ).length
                    }
                  }

                  // Fetch orders for confirmed and completed counts
                  const ordersResponse = await fetch("/api/orders")
                  let confirmedOrders = 0
                  let completedOrders = 0
                  
                  if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json()
                    if (ordersData.orders) {
                      confirmedOrders = ordersData.orders.filter((order: any) => 
                        order.status === "confirmed" || order.status === "picked_up" || order.status === "in_transit"
                      ).length
                      
                      completedOrders = ordersData.orders.filter((order: any) => 
                        order.status === "delivered"
                      ).length
                    }
                  }

                  setStats({
                    activeRequests,
                    confirmedOrders,
                    completedOrders
                  })
                } catch (error) {
                  console.error("Failed to refresh dashboard stats:", error)
                } finally {
                  setIsLoadingStats(false)
                }
              }
              refreshStats()
            }} />
          </TabsContent>

          <TabsContent value="tracking" className="mt-6">
            <OrderTracking onDataChange={() => {
              // Refresh stats when orders change
              const refreshStats = async () => {
                try {
                  setIsLoadingStats(true)
                  
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
                  
                  // Fetch transport requests (active requests)
                  const requestsResponse = await fetch("/api/buyer-requests")
                  let activeRequests = 0
                  if (requestsResponse.ok) {
                    const requestsData = await requestsResponse.json()
                    if (requestsData.success) {
                      activeRequests = requestsData.data.filter((req: any) => 
                        req.status === "submitted" || req.status === "draft"
                      ).length
                    }
                  }

                  // Fetch orders for confirmed and completed counts
                  const ordersResponse = await fetch("/api/orders")
                  let confirmedOrders = 0
                  let completedOrders = 0
                  
                  if (ordersResponse.ok) {
                    const ordersData = await ordersResponse.json()
                    if (ordersData.orders) {
                      confirmedOrders = ordersData.orders.filter((order: any) => 
                        order.status === "confirmed" || order.status === "picked_up" || order.status === "in_transit"
                      ).length
                      
                      completedOrders = ordersData.orders.filter((order: any) => 
                        order.status === "delivered"
                      ).length
                    }
                  }

                  setStats({
                    activeRequests,
                    confirmedOrders,
                    completedOrders
                  })
                } catch (error) {
                  console.error("Failed to refresh dashboard stats:", error)
                } finally {
                  setIsLoadingStats(false)
                }
              }
              refreshStats()
            }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
