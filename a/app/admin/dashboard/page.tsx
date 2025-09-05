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
import { NotificationBar, useNotificationBar } from "@/components/admin/notification-bar"

interface DashboardStats {
  totalUsers: { count: number; change: string; trend: string }
  activeSuppliers: { count: number; change: string; trend: string }
  activeBuyers: { count: number; change: string; trend: string }
  pendingReviews: { count: number; change: string; trend: string }
  ordersToday: { count: number; change: string; trend: string }
  totalOrders: { count: number; label: string }
  completedOrders: { count: number; label: string }
  totalRevenue: { count: string; label: string }
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [notifications, setNotifications] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { notifications: notificationBars, showNotification, removeNotification } = useNotificationBar()

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
        if (newCount > notifications && notifications > 0) {
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

  // Fetch stats on component mount
  useEffect(() => {
    fetchDashboardStats()
    fetchNotificationCount()
  }, [])

  // Show initial notification if there are existing notifications
  useEffect(() => {
    if (notifications > 0) {
      showNotification(`You have ${notifications} unread transport request notifications.`, "info")
    }
  }, [notifications])

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
    }, 5000) // Check every 5 seconds for new notifications

    return () => clearInterval(interval)
  }, [notifications]) // Include notifications in dependency to detect changes

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
              <div className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Transport Office Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="relative bg-transparent"
                onClick={() => {
                  fetchNotificationCount()
                  window.location.href = '/admin/notifications'
                }}
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">{notifications}</Badge>
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
                onClick={() => showNotification("Test notification: New transport request received!", "info")}
              >
                Test Notification
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
          <TabsList className="grid w-full grid-cols-6">
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
        </Tabs>
      </div>
    </div>
  )
}
