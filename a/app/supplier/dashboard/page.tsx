"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { User, Truck, FileText, CheckCircle, LogOut, Bell } from "lucide-react"
import { DriverInformation } from "@/components/supplier/driver-information"
import { TransportOrders } from "@/components/supplier/transport-orders"
import { TruckInformation } from "@/components/supplier/truck-information"
import { ConfirmedOrders } from "@/components/supplier/confirmed-orders"
import { RecentOrders } from "@/components/supplier/recent-orders"
import { PageHeader } from "@/components/ui/page-header"
import { Logo } from "@/components/ui/logo"
import { NotificationBar, useNotificationBar } from "@/components/admin/notification-bar"

export default function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState("trucks")
  const [notifications, setNotifications] = useState(0) // Dynamic notification count
  const { notifications: notificationBars, showNotification, removeNotification } = useNotificationBar()
  
  // Dynamic stats state
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    newOrders: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [supplierCompanyName, setSupplierCompanyName] = useState("")

  // Check authentication and role
  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true)
      console.log("Checking authentication for supplier dashboard...")
      
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      
      if (!userResponse.ok) {
        console.error("Failed to get current user, response status:", userResponse.status)
        window.location.href = "/login"
        return
      }
      
      const userData = await userResponse.json()
      console.log("User data received:", userData)
      
      const userRole = userData.user.role
      console.log("User role:", userRole)
      
      if (userRole !== 'supplier') {
        console.error("Access denied: supplier role required, current role:", userRole)
        console.log("Redirecting user to appropriate dashboard...")
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'admin') {
          console.log("Redirecting admin to admin dashboard")
          window.location.href = "/admin/dashboard"
        } else if (userRole === 'buyer') {
          console.log("Redirecting buyer to buyer dashboard")
          window.location.href = "/buyer/dashboard"
        } else {
          console.log("Redirecting unknown role to login")
          window.location.href = "/login"
        }
        return
      }
      
      console.log("Authentication successful for supplier:", userData.user.id)
      setSupplierCompanyName(userData.user.companyName || "Transport Company")
      setIsAuthorized(true)
    } catch (error) {
      console.error("Auth check error:", error)
      window.location.href = "/login"
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      
      // Get current supplier ID
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (!userResponse.ok) {
        console.error("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id

      // Fetch drivers count
      const driversResponse = await fetch(`/api/supplier-drivers?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      const driversData = await driversResponse.json()
      const totalDrivers = driversData.drivers?.length || 0

      // Fetch trucks count
      const trucksResponse = await fetch(`/api/supplier-trucks?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      const trucksData = await trucksResponse.json()
      const totalVehicles = trucksData.trucks?.length || 0

      // Fetch pending orders count (from suppliers_vehicle_location table)
      const ordersResponse = await fetch(`/api/supplier-orders?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      const ordersData = await ordersResponse.json()
      const pendingOrders = ordersData.orders?.length || 0 // Now only returns pending orders

      // Fetch confirmed orders count
      const confirmedResponse = await fetch(`/api/supplier-confirmed-orders?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      const confirmedData = await confirmedResponse.json()
      const confirmedOrders = confirmedData.confirmedOrders?.length || 0

      // Fetch new orders count (orders sent by admin but not yet confirmed)
      const newOrdersResponse = await fetch(`/api/supplier/orders`, {
        credentials: 'include'
      })
      const newOrdersData = newOrdersResponse.ok ? await newOrdersResponse.json() : { orders: [] }
      // Only count orders that are still pending (not confirmed yet)
      const newOrders = newOrdersData.orders?.filter((order: any) => 
        order.status === "submitted" || order.status === "pending" || order.status === "assigned"
      ).length || 0

      setStats({
        totalDrivers,
        totalVehicles,
        pendingOrders,
        confirmedOrders,
        newOrders
      })
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      // Get current supplier ID
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      if (!userResponse.ok) {
        console.error("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id
      
      const response = await fetch(`/api/supplier/notifications/count?supplierId=${supplierId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const newCount = data.unreadCount || 0
        
        // Show notification bar if there are new notifications
        if (newCount > notifications && notifications >= 0) {
          showNotification(`New transport order received! You have ${newCount} unread notifications.`, "info")
        }
        
        setNotifications(newCount)
      }
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  // Check authentication first, then fetch data
  useEffect(() => {
    checkAuth()
  }, [])

  // Fetch data after authentication is confirmed
  useEffect(() => {
    if (isAuthorized) {
      fetchDashboardStats()
      fetchNotificationCount()
    }
  }, [isAuthorized])

  // Show initial notification if there are existing notifications
  useEffect(() => {
    if (notifications > 0) {
      showNotification(`You have ${notifications} unread transport order notifications.`, "info")
    }
  }, [notifications])

  // Refresh stats when tab changes to keep data current
  useEffect(() => {
    if (activeTab) {
      fetchDashboardStats()
    }
  }, [activeTab])

  // Refresh notification count periodically and check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount()
    }, 3000) // Check every 3 seconds for new notifications

    return () => clearInterval(interval)
  }, []) // Remove notifications dependency to prevent interval recreation

  // Add a key to force re-render when supplier changes
  useEffect(() => {
    const handleStorageChange = () => {
      // Clear current data and refetch when storage changes (user login/logout)
      setStats({
        totalDrivers: 0,
        totalVehicles: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        newOrders: 0
      })
      setNotifications(0)
      fetchDashboardStats()
      fetchNotificationCount()
    }

    // Listen for storage changes (login/logout)
    window.addEventListener('storage', handleStorageChange)
    
    // Also refetch when component becomes visible (in case of tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchDashboardStats()
        fetchNotificationCount()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { 
        method: "POST",
        credentials: 'include'
      })
      // Clear all cached data and redirect to login page
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
      // Still redirect even if logout fails
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/login"
    }
  }

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Logo size="lg" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authorization...</p>
        </div>
      </div>
    )
  }

  // Show unauthorized state if not authorized
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <Logo size="lg" />
          </div>
          <p className="text-muted-foreground">Access denied. Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Notification Bars */}
      {notificationBars.map((notification) => (
        <NotificationBar
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={2000}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">{supplierCompanyName || "Supplier Dashboard"}</h1>
                <p className="text-sm text-muted-foreground">Welcome back to {supplierCompanyName || "your transport company"}</p>
              </div>
            </div>
            <div className="flex items-center justify-start ml-8">
              <Logo size="lg" />
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="relative bg-transparent"
                onClick={() => {
                  fetchNotificationCount()
                  window.location.href = '/supplier/notifications'
                }}
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white">{notifications}</Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchDashboardStats} disabled={isLoadingStats}>
                {isLoadingStats ? "Refreshing..." : "Refresh Stats"}
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.totalDrivers}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingStats ? "Loading..." : `${stats.totalDrivers > 0 ? "Active drivers" : "No drivers yet"}`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.totalVehicles}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingStats ? "Loading..." : `${stats.totalVehicles > 0 ? "Available for transport" : "No vehicles yet"}`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingStats ? "Loading..." : "Awaiting admin approval"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.confirmedOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingStats ? "Loading..." : "Ready for execution"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Orders</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats.newOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLoadingStats ? "Loading..." : "Sent by admin"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs - Only render when authorized */}
        {isAuthorized && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="trucks">Truck Info</TabsTrigger>
              <TabsTrigger value="drivers">Driver Info</TabsTrigger>
              <TabsTrigger value="orders">Suppliers Vehicle Location</TabsTrigger>
              <TabsTrigger value="new-orders">New Orders</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed Orders</TabsTrigger>
            </TabsList>

            <TabsContent value="trucks">
              <TruckInformation onDataChange={fetchDashboardStats} />
            </TabsContent>
            <TabsContent value="drivers">
              <DriverInformation onDataChange={fetchDashboardStats} />
            </TabsContent>
            <TabsContent value="orders">
              <TransportOrders onDataChange={fetchDashboardStats} />
            </TabsContent>
            <TabsContent value="new-orders">
              <RecentOrders />
            </TabsContent>
            <TabsContent value="confirmed">
              <ConfirmedOrders onDataChange={fetchDashboardStats} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
