"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, FileCheck, Truck, Package, LogOut, Bell, Settings, ClipboardList, TrendingUp, TrendingDown, Minus, ShoppingCart } from "lucide-react"
import { UserManagement } from "@/components/admin/user-management"
import { DocumentVerification } from "@/components/admin/document-verification"
import { OrderAssignment } from "@/components/admin/order-assignment"
import { SystemOverview } from "@/components/admin/system-overview"
import { SupplierOrderManagement } from "@/components/admin/supplier-order-management"
import { BuyersOrders } from "@/components/admin/buyers-orders"
import { SuppliersConfirmed } from "@/components/admin/suppliers-confirmed"
import { NotificationBar, useNotificationBar } from "@/components/admin/notification-bar"
import { Logo } from "@/components/ui/logo"

interface DashboardStats {
  totalUsers: { count: number; change: string; trend: string }
  activeSuppliers: { count: number; change: string; trend: string }
  activeBuyers: { count: number; change: string; trend: string }
  pendingReviews: { count: number; change: string; trend: string }
  ordersToday: { count: number; change: string; trend: string }
  totalOrders: { count: number; label: string }
  completedOrders: { count: number; label: string }
  totalRevenue: { count: string; label: string }
  systemUptime: { value: number; change: string; trend: string; description: string }
  averageResponseTime: { value: string; change: string; trend: string; description: string }
  userSatisfaction: { value: string; change: string; trend: string; description: string }
  orderSuccessRate: { value: string; change: string; trend: string; description: string }
  systemHealth: {
    databasePerformance: { value: number; label: string }
    apiResponseTime: { value: number; label: string }
    storageUsage: { value: number; label: string }
    userActivity: { value: number; label: string }
  }
  recentActivities: Array<{
    id: string
    type: string
    message: string
    timestamp: string
    status: string
  }>
  todaySummary: {
    newRegistrations: number
    ordersProcessed: number
    documentsVerified: number
    issuesResolved: number
  }
  pendingActions: {
    documentReviews: number
    orderAssignments: number
    userVerifications: number
    supportTickets: number
  }
  systemAlerts: Array<{
    type: string
    message: string
    icon: string
  }>
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [notifications, setNotifications] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { notifications: notificationBars, showNotification, removeNotification } = useNotificationBar()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check authentication and role
  const checkAuth = async () => {
    try {
      setIsCheckingAuth(true)
      console.log("Checking authentication for admin dashboard...")
      
      const userResponse = await fetch("/api/auth/me", {
        credentials: 'include'
      })
      
      if (!userResponse.ok) {
        console.error("Failed to get current user, response status:", userResponse.status)
        window.location.href = "/login"
        return
      }
      
      const userData = await userResponse.json()
      console.log("Admin user data received:", userData)
      
      const userRole = userData.user.role
      console.log("Admin user role:", userRole)
      
      if (userRole !== 'admin') {
        console.error("Access denied: admin role required, current role:", userRole)
        console.log("Redirecting user to appropriate dashboard...")
        
        // Redirect to appropriate dashboard based on role
        if (userRole === 'supplier') {
          console.log("Redirecting supplier to supplier dashboard")
          window.location.href = "/supplier/dashboard"
        } else if (userRole === 'buyer') {
          console.log("Redirecting buyer to buyer dashboard")
          window.location.href = "/buyer/dashboard"
        } else {
          console.log("Redirecting unknown role to login")
          window.location.href = "/login"
        }
        return
      }
      
      console.log("Authentication successful for admin:", userData.user.id)
      setIsAuthorized(true)
    } catch (error) {
      console.error("Auth check error:", error)
      window.location.href = "/login"
    } finally {
      setIsCheckingAuth(false)
    }
  }

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      setError(null)
      
      const response = await fetch("/api/admin/dashboard-stats")
      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats")
      }
      
      const data = await response.json()
      setStats(data.stats)
    } catch (err) {
      console.error("Error fetching dashboard stats:", err)
      setError(err instanceof Error ? err.message : "Failed to load stats")
    } finally {
      setIsLoadingStats(false)
    }
  }

  // Fetch notification count
  const fetchNotificationCount = async () => {
    try {
      const response = await fetch("/api/admin/notifications/count")
      if (response.ok) {
        const data = await response.json()
        const newCount = data.count || 0
        
        // Show notification bar if there are new notifications
        if (newCount > notifications && notifications >= 0) {
          showNotification(`New transport request received! You have ${newCount} unread notifications.`, "info")
        }
        
        setNotifications(newCount)
      } else {
        console.error("Failed to fetch notification count")
        setNotifications(0)
      }
    } catch (error) {
      console.error("Error fetching notification count:", error)
      setNotifications(0)
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
      showNotification(`You have ${notifications} unread transport request notifications.`, "info")
    }
  }, [notifications])

  // Show popup for unread notifications on page load
  useEffect(() => {
    const checkInitialNotifications = async () => {
      try {
        const response = await fetch("/api/admin/notifications/count")
        if (response.ok) {
          const data = await response.json()
          const unreadCount = data.count || 0
          
          if (unreadCount > 0) {
            showNotification(`You have ${unreadCount} unread notifications. Click the bell icon to view them.`, "info")
          }
        }
      } catch (error) {
        console.error("Error checking initial notifications:", error)
      }
    }
    
    checkInitialNotifications()
  }, [])

  // Add manual refresh function for notifications
  const refreshNotifications = () => {
    fetchNotificationCount()
  }

  // Refresh stats when tab changes
  useEffect(() => {
    if (activeTab === "overview") {
      fetchDashboardStats()
    }
  }, [activeTab])

  // Refresh notification count periodically and check for new notifications
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotificationCount()
    }, 3000) // Check every 3 seconds for new notifications

    return () => clearInterval(interval)
  }, [])


  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/login"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }


  // Helper function to render trend icon
  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      case "attention":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
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
                <h1 className="text-2xl font-bold text-foreground">Mahalaxmi Transport</h1>
                <p className="text-sm text-muted-foreground">Management System</p>
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
                  refreshNotifications()
                  window.location.href = '/admin/notifications'
                }}
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white">{notifications}</Badge>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                fetchDashboardStats()
                fetchNotificationCount()
              }} disabled={isLoadingStats}>
                {isLoadingStats ? "Refreshing..." : "Refresh Stats"}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/admin/settings'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
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
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.totalUsers.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "Loading..." : stats?.totalUsers.change || "No data"}
                </p>
                {stats?.totalUsers.trend && renderTrendIcon(stats.totalUsers.trend)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.activeSuppliers.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "Loading..." : stats?.activeSuppliers.change || "No data"}
                </p>
                {stats?.activeSuppliers.trend && renderTrendIcon(stats.activeSuppliers.trend)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Buyers</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.activeBuyers.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "Loading..." : stats?.activeBuyers.change || "No data"}
                </p>
                {stats?.activeBuyers.trend && renderTrendIcon(stats.activeBuyers.trend)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.pendingReviews.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "Loading..." : stats?.pendingReviews.change || "No data"}
                </p>
                {stats?.pendingReviews.trend && renderTrendIcon(stats.pendingReviews.trend)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Orders Today</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? "..." : stats?.ordersToday.count || 0}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats ? "Loading..." : stats?.ordersToday.change || "No data"}
                </p>
                {stats?.ordersToday.trend && renderTrendIcon(stats.ordersToday.trend)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              Error loading dashboard stats: {error}
              <Button 
                variant="link" 
                size="sm" 
                className="ml-2 p-0 h-auto text-red-800 underline"
                onClick={fetchDashboardStats}
              >
                Retry
              </Button>
            </p>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileCheck className="h-4 w-4" />
              Document Review
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Order Assignment
            </TabsTrigger>
            <TabsTrigger value="buyers-orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Buyers Orders
            </TabsTrigger>
            <TabsTrigger value="supplier-orders" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Supplier Orders
            </TabsTrigger>
            <TabsTrigger value="suppliers-confirmed" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Suppliers Confirmed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <SystemOverview stats={stats} isLoading={isLoadingStats} />
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <DocumentVerification />
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <OrderAssignment />
          </TabsContent>

          <TabsContent value="buyers-orders" className="mt-6">
            <BuyersOrders />
          </TabsContent>

          <TabsContent value="supplier-orders" className="mt-6">
            <SupplierOrderManagement />
          </TabsContent>

          <TabsContent value="suppliers-confirmed" className="mt-6">
            <SuppliersConfirmed />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}