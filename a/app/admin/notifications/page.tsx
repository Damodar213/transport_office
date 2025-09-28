"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, AlertTriangle, Info, X, Trash2, Filter, RefreshCw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Notification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  category: "system" | "order" | "user" | "document" | "supplier_order"
  priority: "low" | "medium" | "high"
  // Additional fields for supplier vehicle location notifications
  vehicleLocationId?: number
  supplierId?: string
  supplierName?: string
  supplierCompany?: string
  location?: string
  vehicleNumber?: string
  bodyType?: string
  driverName?: string
  status?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    console.log("Component mounted, fetching notifications...")
    fetchNotifications(true) // Initial load with loading state
    
    // Set up periodic refresh every 30 seconds (less frequent to reduce blinking)
    const interval = setInterval(() => {
      console.log("Auto-refreshing notifications...")
      fetchNotifications(false) // Auto-refresh without loading state
    }, 30000)
    
    // Set up a global function that can be called to refresh notifications
    // This allows other parts of the app to trigger a refresh
    ;(window as any).refreshAdminNotifications = () => {
      console.log("Manual refresh triggered")
      fetchNotifications(false) // Manual refresh without loading state
    }
    
    return () => {
      clearInterval(interval)
      delete (window as any).refreshAdminNotifications
    }
  }, [])

  // Debug effect to log when notifications state changes
  useEffect(() => {
    console.log("Notifications state changed:", notifications.length, "notifications")
  }, [notifications])

  const fetchNotifications = async (showLoading = false) => {
    try {
      if (showLoading) {
        setIsLoading(true)
      } else {
        setIsRefreshing(true)
      }
      console.log("Fetching notifications from API...")
      
      // Fetch all notification types: transport request, supplier vehicle location, and main notifications
      const [transportResponse, supplierResponse, mainNotificationsResponse] = await Promise.all([
        fetch("/api/admin/transport-request-notifications?" + new Date().getTime(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch("/api/admin/supplier-vehicle-location-notifications?" + new Date().getTime(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch("/api/admin/notifications?" + new Date().getTime(), {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ])
      
      console.log("Transport API response status:", transportResponse.status)
      console.log("Supplier API response status:", supplierResponse.status)
      console.log("Main notifications API response status:", mainNotificationsResponse.status)
      
      let allNotifications: Notification[] = []
      
      // Process transport request notifications
      if (transportResponse.ok) {
        const transportData = await transportResponse.json()
        console.log("Transport notifications data received:", transportData)
        
        if (transportData.notifications && Array.isArray(transportData.notifications)) {
          allNotifications = [...allNotifications, ...transportData.notifications]
          console.log(`Added ${transportData.notifications.length} transport notifications`)
        }
      } else {
        console.error("Transport API failed with status:", transportResponse.status)
      }
      
      // Process supplier vehicle location notifications
      if (supplierResponse.ok) {
        const supplierData = await supplierResponse.json()
        console.log("Supplier notifications data received:", supplierData)
        
        if (supplierData.notifications && Array.isArray(supplierData.notifications)) {
          allNotifications = [...allNotifications, ...supplierData.notifications]
          console.log(`Added ${supplierData.notifications.length} supplier notifications`)
        }
      } else {
        console.error("Supplier API failed with status:", supplierResponse.status)
      }
      
      // Process main notifications (manual order confirmations, etc.)
      if (mainNotificationsResponse.ok) {
        const mainData = await mainNotificationsResponse.json()
        console.log("Main notifications data received:", mainData)
        
        if (mainData.notifications && Array.isArray(mainData.notifications)) {
          allNotifications = [...allNotifications, ...mainData.notifications]
          console.log(`Added ${mainData.notifications.length} main notifications`)
        }
      } else {
        console.error("Main notifications API failed with status:", mainNotificationsResponse.status)
      }
      
      // Remove duplicate notifications based on ID and title
      const uniqueNotifications = allNotifications.filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id && n.title === notification.title)
      )
      console.log(`Removed ${allNotifications.length - uniqueNotifications.length} duplicate notifications`)
      
      // Sort notifications by timestamp (newest first)
      uniqueNotifications.sort((a, b) => {
        // Convert timestamp strings to dates for comparison
        const getTimeValue = (timestamp: string) => {
          if (timestamp.includes('seconds ago')) return Date.now() - parseInt(timestamp) * 1000
          if (timestamp.includes('minutes ago')) return Date.now() - parseInt(timestamp) * 60 * 1000
          if (timestamp.includes('hours ago')) return Date.now() - parseInt(timestamp) * 60 * 60 * 1000
          if (timestamp.includes('days ago')) return Date.now() - parseInt(timestamp) * 24 * 60 * 60 * 1000
          return new Date(timestamp).getTime()
        }
        return getTimeValue(b.timestamp) - getTimeValue(a.timestamp)
      })
      
      setNotifications(uniqueNotifications)
      setLastRefresh(new Date())
      console.log(`Successfully set ${uniqueNotifications.length} total notifications`)
      
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      setNotifications([])
    } finally {
      if (showLoading) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  const generateMockNotifications = (): Notification[] => [
    {
      id: "1",
      type: "info",
      title: "New Transport Request",
      message: "New transport request ORD-7 for Cotton has been created by buyer arun",
      timestamp: "5 hours ago",
      isRead: false,
      category: "order",
      priority: "medium"
    },
    {
      id: "2",
      type: "success",
      title: "Order Confirmed",
      message: "Transport order #123 has been successfully confirmed by supplier",
      timestamp: "2 minutes ago",
      isRead: false,
      category: "order",
      priority: "high"
    },
    {
      id: "3",
      type: "warning",
      title: "Document Review Required",
      message: "5 supplier documents are pending review and approval",
      timestamp: "15 minutes ago",
      isRead: false,
      category: "document",
      priority: "medium"
    },
    {
      id: "4",
      type: "info",
      title: "New User Registration",
      message: "New supplier 'Kumar Transport Co.' has registered",
      timestamp: "1 hour ago",
      isRead: true,
      category: "user",
      priority: "low"
    },
    {
      id: "5",
      type: "error",
      title: "System Alert",
      message: "Database connection timeout detected, investigating...",
      timestamp: "2 hours ago",
      isRead: false,
      category: "system",
      priority: "high"
    }
  ]

  const markAsRead = async (id: string) => {
    try {
      // Find the notification to determine its type
      const notification = notifications.find(n => n.id === id)
      if (!notification) {
        console.error("Notification not found:", id)
        return
      }

      // Determine the API endpoint based on notification category
      let apiEndpoint
      if (notification.category === 'supplier_order') {
        apiEndpoint = `/api/admin/supplier-vehicle-location-notifications/${id}/read`
      } else if (notification.category === 'order') {
        apiEndpoint = `/api/admin/transport-request-notifications/${id}/read`
      } else if (notification.category === 'order_management') {
        // Main notifications (including manual order confirmations)
        apiEndpoint = `/api/admin/notifications/${id}/read`
      } else {
        // Fallback: mark locally without hitting API
        setNotifications(prev => 
          prev.map(notif => notif.id === id ? { ...notif, isRead: true } : notif)
        )
        return
      }

      const response = await fetch(apiEndpoint, {
        method: "PUT"
      })
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, isRead: true } : notif
          )
        )
        console.log(`Successfully marked notification ${id} as read`)
      } else {
        console.error("Failed to mark notification as read:", response.status, response.statusText)
        // Update locally if API fails
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, isRead: true } : notif
          )
        )
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      // Update locally if API fails
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      )
    }
  }



  const markAllAsRead = async () => {
    try {
      // Mark all notifications as read based on their category
      const promises = notifications
        .filter(n => !n.isRead && (n.category === 'supplier_order' || n.category === 'order' || n.category === 'order_management'))
        .map(n => {
          let apiEndpoint
          if (n.category === 'supplier_order') {
            apiEndpoint = `/api/admin/supplier-vehicle-location-notifications/${n.id}/read`
          } else if (n.category === 'order') {
            apiEndpoint = `/api/admin/transport-request-notifications/${n.id}/read`
          } else if (n.category === 'order_management') {
            apiEndpoint = `/api/admin/notifications/${n.id}/read`
          } else {
            // Skip other categories
            return null
          }
          return fetch(apiEndpoint, { method: "PUT" })
        })
      
      await Promise.all(promises)
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      )
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      // Update locally if API fails
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      )
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      // Find the notification to determine its type
      const notification = notifications.find(n => n.id === id)
      if (!notification) {
        console.error("Notification not found:", id)
        return
      }

      // Determine the API endpoint based on notification category
      let apiEndpoint
      if (notification.category === 'supplier_order') {
        apiEndpoint = `/api/admin/supplier-vehicle-location-notifications/${id}`
      } else if (notification.category === 'order') {
        apiEndpoint = `/api/admin/transport-request-notifications/${id}`
      } else {
        // For other categories, just remove locally
        setNotifications(prev => prev.filter(notif => notif.id !== id))
        return
      }

      const response = await fetch(apiEndpoint, {
        method: "DELETE"
      })
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete notification:", error)
      // Remove locally if API fails
      setNotifications(prev => prev.filter(notif => notif.id !== id))
    }
  }

  const clearAll = async () => {
    try {
      console.log("Clearing all notifications...")
      
      // Clear all notification types using their respective clear-all endpoints
      const promises = [
        // Clear main notifications
        fetch("/api/admin/notifications/clear-all", { method: "DELETE" }),
        // Clear transport request notifications
        fetch("/api/admin/transport-request-notifications/clear-all", { method: "DELETE" }),
        // Clear supplier vehicle location notifications
        fetch("/api/admin/supplier-vehicle-location-notifications/clear-all", { method: "DELETE" })
      ]
      
      console.log(`Clearing all notification types...`)
      const results = await Promise.all(promises)
      
      // Log the results
      results.forEach(async (result, index) => {
        const data = await result.json()
        console.log(`Clear result ${index + 1}:`, data)
      })
      
      // Clear the local state
      setNotifications([])
      console.log("All notifications cleared successfully")
      
      // Show success message
      alert("All notifications have been cleared successfully!")
      
    } catch (error) {
      console.error("Failed to clear all notifications:", error)
      // Clear locally if API fails
      setNotifications([])
      alert("Notifications cleared locally (some API calls may have failed)")
    }
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: Notification["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryColor = (category: Notification["category"]) => {
    switch (category) {
      case "system":
        return "bg-purple-100 text-purple-800"
      case "order":
        return "bg-blue-100 text-blue-800"
      case "user":
        return "bg-green-100 text-green-800"
      case "document":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === "all" || notif.category === filter
    const matchesPriority = priority === "all" || notif.priority === priority
    return matchesFilter && matchesPriority
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Manage system notifications and alerts</p>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" key={`notifications-${notifications.length}-${lastRefresh.getTime()}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Manage system notifications and alerts</p>
          <p className="text-xs text-muted-foreground mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
            {isRefreshing && <span className="ml-2 text-blue-500">🔄 Updating...</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            Debug: {notifications.length} notifications loaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Button onClick={() => fetchNotifications()} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            Mark All Read
          </Button>
          <Button onClick={clearAll} variant="outline" size="sm">
            Clear All
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="order">Buyer Orders</SelectItem>
            <SelectItem value="supplier_order">Supplier Orders</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="low">Low Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({isLoading ? "..." : notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({isLoading ? "..." : unreadCount})
          </TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="order">
            Orders ({isLoading ? "..." : notifications.filter(n => n.category === "order").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mb-2">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <Card key={`notification-${notification.id}-${index}`} className={notification.isRead ? "opacity-75" : ""}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-foreground">
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={getCategoryColor(notification.category)}>
                            {notification.category}
                          </Badge>
                          <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp}
                        </span>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                            >
                              Mark Read
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {notifications.filter(n => !n.isRead).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                <p className="text-muted-foreground">No unread notifications</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter(n => !n.isRead)
              .map((notification, index) => (
                <Card key={`unread-${notification.id}-${index}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={getCategoryColor(notification.category)}>
                              {notification.category}
                            </Badge>
                            <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                            >
                              Mark Read
                            </Button>
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          {notifications.filter(n => n.category === "system").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Info className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <h3 className="text-lg font-medium mb-2">No system notifications</h3>
                <p className="text-muted-foreground">All systems are running smoothly</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter(n => n.category === "system")
              .map((notification, index) => (
                <Card key={`system-${notification.id}-${index}`} className={notification.isRead ? "opacity-75" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="order" className="space-y-4">
          {notifications.filter(n => n.category === "order").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">No order notifications</h3>
                <p className="text-muted-foreground">All orders are being processed normally</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter(n => n.category === "order")
              .map((notification, index) => (
                <Card key={`order-${notification.id}-${index}`} className={notification.isRead ? "opacity-75" : ""}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium text-foreground">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          <Badge variant="secondary" className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                          <div className="flex items-center gap-2">
                            {!notification.isRead && (
                              <Button
                                onClick={() => markAsRead(notification.id)}
                                variant="ghost"
                                size="sm"
                              >
                                Mark Read
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}





