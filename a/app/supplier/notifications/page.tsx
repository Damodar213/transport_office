"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, AlertTriangle, Info, Truck, User, Package, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SupplierNotification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  category: "order" | "driver" | "vehicle" | "payment" | "system"
  priority: "low" | "medium" | "high"
  orderId?: string
  driverId?: string
  vehicleId?: string
}

export default function SupplierNotificationsPage() {
  const [notifications, setNotifications] = useState<SupplierNotification[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [supplierId, setSupplierId] = useState<string>("")

  // Get current supplier ID from auth
  useEffect(() => {
    const getCurrentSupplier = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setSupplierId(data.user.id)
        } else {
          console.error("Failed to get current supplier")
        }
      } catch (error) {
        console.error("Error getting current supplier:", error)
      }
    }
    getCurrentSupplier()
  }, [])

  useEffect(() => {
    if (supplierId) {
      fetchNotifications()
    }
  }, [supplierId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/supplier/notifications?supplierId=${supplierId}`)
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
      // Fallback to mock data
      setNotifications(generateMockNotifications())
    } finally {
      setIsLoading(false)
    }
  }

  const generateMockNotifications = (): SupplierNotification[] => [
    {
      id: "1",
      type: "success",
      title: "Order Confirmed",
      message: "Transport order #123 has been confirmed by admin. Please prepare for pickup.",
      timestamp: "2 minutes ago",
      isRead: false,
      category: "order",
      priority: "high",
      orderId: "123"
    },
    {
      id: "2",
      type: "warning",
      title: "Driver License Expiring",
      message: "Driver John Doe's license expires in 15 days. Please renew soon.",
      timestamp: "1 hour ago",
      isRead: false,
      category: "driver",
      priority: "medium",
      driverId: "driver_001"
    },
    {
      id: "3",
      type: "info",
      title: "Vehicle Maintenance Due",
      message: "Truck KA-01-AB-1234 is due for maintenance in 3 days.",
      timestamp: "3 hours ago",
      isRead: true,
      category: "vehicle",
      priority: "low",
      vehicleId: "truck_001"
    },
    {
      id: "4",
      type: "success",
      title: "Payment Received",
      message: "Payment of ₹2,500 received for order #120. Thank you!",
      timestamp: "1 day ago",
      isRead: true,
      category: "payment",
      priority: "medium",
      orderId: "120"
    },
    {
      id: "5",
      type: "error",
      title: "Order Rejected",
      message: "Transport order #125 was rejected due to incomplete documentation.",
      timestamp: "2 days ago",
      isRead: false,
      category: "order",
      priority: "high",
      orderId: "125"
    }
  ]

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/supplier/notifications/${id}/read`, {
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
      const response = await fetch(`/api/supplier/notifications/mark-all-read?supplierId=${supplierId}`, {
        method: "PUT"
      })
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        )
      }
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
      const response = await fetch(`/api/supplier/notifications/${id}`, {
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
      const response = await fetch(`/api/supplier/notifications/clear-all?supplierId=${supplierId}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setNotifications([])
      }
    } catch (error) {
      console.error("Failed to clear all notifications:", error)
      // Clear locally if API fails
      setNotifications([])
    }
  }

  const getNotificationIcon = (type: SupplierNotification["type"]) => {
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

  const getCategoryIcon = (category: SupplierNotification["category"]) => {
    switch (category) {
      case "order":
        return <Package className="h-4 w-4 text-blue-600" />
      case "driver":
        return <User className="h-4 w-4 text-green-600" />
      case "vehicle":
        return <Truck className="h-4 w-4 text-purple-600" />
      case "payment":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "system":
        return <Info className="h-4 w-4 text-gray-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: SupplierNotification["priority"]) => {
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

  const getCategoryColor = (category: SupplierNotification["category"]) => {
    switch (category) {
      case "order":
        return "bg-blue-100 text-blue-800"
      case "driver":
        return "bg-green-100 text-green-800"
      case "vehicle":
        return "bg-purple-100 text-purple-800"
      case "payment":
        return "bg-green-100 text-green-800"
      case "system":
        return "bg-gray-100 text-gray-800"
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
            <p className="text-muted-foreground">Stay updated with your transport operations</p>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your transport operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {unreadCount} unread
          </Badge>
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
            <SelectItem value="order">Orders</SelectItem>
            <SelectItem value="driver">Drivers</SelectItem>
            <SelectItem value="vehicle">Vehicles</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="system">System</SelectItem>
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
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
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
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(notification.category)}
                            <Badge variant="secondary" className={getCategoryColor(notification.category)}>
                              {notification.category}
                            </Badge>
                          </div>
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
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(notification.category)}
                              <Badge variant="secondary" className={getCategoryColor(notification.category)}>
                                {notification.category}
                              </Badge>
                            </div>
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

        <TabsContent value="orders" className="space-y-4">
          {notifications.filter(n => n.category === "order").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-blue-600" />
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

        <TabsContent value="drivers" className="space-y-4">
          {notifications.filter(n => n.category === "driver").length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <User className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium mb-2">No driver notifications</h3>
                <p className="text-muted-foreground">All driver information is up to date</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter(n => n.category === "driver")
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
