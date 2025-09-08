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
import { PageHeader } from "@/components/ui/page-header"
import { Logo } from "@/components/ui/logo"

export default function SupplierDashboard() {
  const [activeTab, setActiveTab] = useState("trucks")
  const [notifications, setNotifications] = useState(0) // Dynamic notification count
  
  // Dynamic stats state
  const [stats, setStats] = useState({
    totalDrivers: 0,
    totalVehicles: 0,
    pendingOrders: 0,
    confirmedOrders: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      
      // Get current supplier ID
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        console.error("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id

      // Fetch drivers count
      const driversResponse = await fetch(`/api/supplier-drivers?supplierId=${supplierId}`)
      const driversData = await driversResponse.json()
      const totalDrivers = driversData.drivers?.length || 0

      // Fetch trucks count
      const trucksResponse = await fetch(`/api/supplier-trucks?supplierId=${supplierId}`)
      const trucksData = await trucksResponse.json()
      const totalVehicles = trucksData.trucks?.length || 0

      // Fetch pending orders count
      const ordersResponse = await fetch(`/api/supplier-orders?supplierId=${supplierId}`)
      const ordersData = await ordersResponse.json()
      const pendingOrders = ordersData.orders?.filter((order: any) => order.status === "pending").length || 0

      // Fetch confirmed orders count
      const confirmedResponse = await fetch(`/api/supplier-confirmed-orders?supplierId=${supplierId}`)
      const confirmedData = await confirmedResponse.json()
      const confirmedOrders = confirmedData.confirmedOrders?.length || 0

      setStats({
        totalDrivers,
        totalVehicles,
        pendingOrders,
        confirmedOrders
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
      const userResponse = await fetch("/api/auth/me")
      if (!userResponse.ok) {
        console.error("Failed to get current supplier")
        return
      }
      
      const userData = await userResponse.json()
      const supplierId = userData.user.id
      
      const response = await fetch(`/api/supplier/notifications/count?supplierId=${supplierId}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
    fetchNotificationCount()
  }, [])

  // Refresh stats when tab changes to keep data current
  useEffect(() => {
    if (activeTab) {
      fetchDashboardStats()
    }
  }, [activeTab])

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
                  <h1 className="text-2xl font-bold text-foreground">Supplier Dashboard</h1>
                  <p className="text-sm text-muted-foreground">Welcome back to Mahalaxmi Transport Co.</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="relative bg-transparent"
                onClick={() => window.location.href = '/supplier/notifications'}
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">{notifications}</Badge>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trucks">Truck Info</TabsTrigger>
            <TabsTrigger value="drivers">Driver Info</TabsTrigger>
            <TabsTrigger value="orders">Suppliers Vehicle Location</TabsTrigger>
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
          <TabsContent value="confirmed">
            <ConfirmedOrders onDataChange={fetchDashboardStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
