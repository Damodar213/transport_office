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
  category: "system" | "order" | "user" | "document"
  priority: "low" | "medium" | "high"
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    console.log("Component mounted, fetching notifications...")
    fetchNotifications()
    
    // Set up periodic refresh every 10 seconds to get new notifications more frequently
    const interval = setInterval(() => {
      console.log("Auto-refreshing notifications...")
      fetchNotifications()
    }, 10000)
    
    // Set up a global function that can be called to refresh notifications
    // This allows other parts of the app to trigger a refresh
    ;(window as any).refreshAdminNotifications = () => {
      console.log("Manual refresh triggered")
      fetchNotifications()
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

  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      console.log("Fetching notifications from API...")
      
      // Fetch transport request notifications from the dedicated API with cache busting
      const response = await fetch("/api/admin/transport-request-notifications?" + new Date().getTime(), {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      console.log("API response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("API data received:", data)
        console.log("Number of notifications:", data.notifications?.length || 0)
        
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications)
          setLastRefresh(new Date())
          console.log(`Successfully set ${data.notifications.length} notifications`)
        } else {
          console.error("Invalid notifications data format:", data)
          setNotifications([])
        }
      } else {
        console.error("API failed with status:", response.status)
        // Don't fallback to mock data, just show empty
        setNotifications([])
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      // Don't fallback to mock data, just show empty
      setNotifications([])
    } finally {
      setIsLoading(false)
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
      const response = await fetch(`/api/admin/transport-request-notifications/${id}/read`, {
        method: "PUT"
      })
      if (response.ok) {
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
      // Mark all transport request notifications as read
      const promises = notifications
        .filter(n => !n.isRead)
        .map(n => fetch(`/api/admin/transport-request-notifications/${n.id}/read`, { method: "PUT" }))
      
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
      const response = await fetch(`/api/admin/transport-request-notifications/${id}`, {
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
      // Delete all transport request notifications
      const promises = notifications.map(n => 
        fetch(`/api/admin/transport-request-notifications/${n.id}`, { method: "DELETE" })
      )
      
      await Promise.all(promises)
      setNotifications([])
    } catch (error) {
      console.error("Failed to clear all notifications:", error)
      // Clear locally if API fails
      setNotifications([])
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
          </p>
          <p className="text-xs text-muted-foreground">
            Debug: {notifications.length} notifications loaded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
          <Button onClick={fetchNotifications} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button 
            onClick={() => {
              console.log("Test button clicked")
              console.log("Current notifications:", notifications)
              console.log("Current count:", notifications.length)
            }} 
            variant="outline" 
            size="sm"
          >
            Test
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
            <SelectItem value="order">Orders</SelectItem>
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
            filteredNotifications.map((notification) => (
              <Card key={notification.id} className={notification.isRead ? "opacity-75" : ""}>
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
              .map((notification) => (
                <Card key={notification.id}>
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
              .map((notification) => (
                <Card key={notification.id} className={notification.isRead ? "opacity-75" : ""}>
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
              .map((notification) => (
                <Card key={notification.id} className={notification.isRead ? "opacity-75" : ""}>
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





