"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, MapPin, LogOut, Bell } from "lucide-react"
import { TransportRequests } from "@/components/buyer/transport-requests"
import { AcceptedRequests } from "@/components/buyer/accepted-requests"
import { Logo } from "@/components/ui/logo"
import { NotificationBar, useNotificationBar } from "@/components/admin/notification-bar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface DashboardStats {
  activeRequests: number
  confirmedOrders: number
  completedOrders: number
  acceptedRequests: number
}

export default function BuyerDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeRequests: 0,
    confirmedOrders: 0,
    completedOrders: 0,
    acceptedRequests: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [notifications, setNotifications] = useState(0)
  const [previousNotificationCount, setPreviousNotificationCount] = useState(0)
  const [hasShownInitialPopup, setHasShownInitialPopup] = useState(false)
  const { notifications: notificationBars, showNotification, removeNotification } = useNotificationBar()

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      // Get current buyer ID
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (!userResponse.ok) {
        console.error("Failed to get current buyer")
        return
      }
      
      const userData = await userResponse.json()
      const buyerId = userData.user.id
      
      const response = await fetch(`/api/buyer/notifications/count?buyerId=${buyerId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const newCount = data.unreadCount || 0
        
        // Show notification bar only if there are NEW notifications (count increased)
        if (newCount > previousNotificationCount && previousNotificationCount >= 0) {
          showNotification(`New order status update! You have ${newCount} unread notifications.`, "info")
        }
        
        setPreviousNotificationCount(notifications)
        setNotifications(newCount)
      }
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

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

        // Fetch accepted requests count
        const acceptedResponse = await fetch("/api/buyer/accepted-requests")
        let acceptedRequests = 0
        if (acceptedResponse.ok) {
          const acceptedData = await acceptedResponse.json()
          if (acceptedData.success) {
            acceptedRequests = acceptedData.requests.length
          }
        }

        setStats({
          activeRequests,
          confirmedOrders,
          completedOrders,
          acceptedRequests
        })
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        // Keep default values if API fails
      } finally {
        setIsLoadingStats(false)
      }
    }

    fetchDashboardStats()
    fetchNotificationCount()
  }, [])

  // Show initial notification only once when page loads and there are existing notifications
  useEffect(() => {
    if (notifications > 0 && !hasShownInitialPopup) {
      showNotification(`You have ${notifications} unread notifications. Click the bell icon to view them.`, "info")
      setHasShownInitialPopup(true)
    }
  }, [notifications, hasShownInitialPopup])

  // This useEffect is now handled by the notifications state change above

  // Refresh notification count periodically and check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount()
    }, 3000) // Check every 3 seconds for new notifications

    return () => clearInterval(interval)
  }, []) // Remove notifications dependency to prevent interval recreation

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
      {/* Notification Bars */}
      {notificationBars.map((notification) => (
        <NotificationBar
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Buyer Dashboard</h1>
                <p className="text-sm text-muted-foreground">Welcome back to Mahalaxmi Transport Co.</p>
              </div>
            </div>
            <div className="flex items-center justify-start ml-8">
              <Logo size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/buyer/notifications'}
                className="relative"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {notifications > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted Requests</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.acceptedRequests}
              </div>
              <p className="text-xs text-muted-foreground">By suppliers</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Content */}
        <div className="w-full mt-6">
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="requests">Transport Requests</TabsTrigger>
              <TabsTrigger value="accepted">Accepted Requests</TabsTrigger>
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

                    // Fetch accepted requests count
                    const acceptedResponse = await fetch("/api/buyer/accepted-requests")
                    let acceptedRequests = 0
                    if (acceptedResponse.ok) {
                      const acceptedData = await acceptedResponse.json()
                      if (acceptedData.success) {
                        acceptedRequests = acceptedData.requests.length
                      }
                    }

                    setStats({
                      activeRequests,
                      confirmedOrders,
                      completedOrders,
                      acceptedRequests
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
            
            <TabsContent value="accepted" className="mt-6">
              <AcceptedRequests />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
