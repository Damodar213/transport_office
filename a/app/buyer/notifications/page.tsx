"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, CheckCircle, AlertTriangle, Info, Package, User, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BuyerNotification {
  id: string
  type: "success" | "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  isRead: boolean
  category: "order" | "payment" | "system"
  priority: "low" | "medium" | "high"
  orderId?: string
}

export default function BuyerNotificationsPage() {
  const [notifications, setNotifications] = useState<BuyerNotification[]>([])
  const [filter, setFilter] = useState<string>("all")
  const [priority, setPriority] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [buyerId, setBuyerId] = useState<string>("")

  // Get current buyer ID from auth
  useEffect(() => {
    const getCurrentBuyer = async () => {
      try {
        const response = await fetch("/api/auth/me")
        if (response.ok) {
          const data = await response.json()
          setBuyerId(data.user.id)
        } else {
          console.error("Failed to get current buyer")
        }
      } catch (error) {
        console.error("Error getting current buyer:", error)
      }
    }
    getCurrentBuyer()
  }, [])

  useEffect(() => {
    if (buyerId) {
      fetchNotifications()
    }
  }, [buyerId])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/buyer/notifications?buyerId=${buyerId}`)
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

  const generateMockNotifications = (): BuyerNotification[] => [
    {
      id: "1",
      type: "info",
      title: "Order Status Updated",
      message: "Your transport order ORD-6 status has been updated to: SUBMITTED. Load: Steel, Route: Mumbai → Delhi",
      timestamp: "2 minutes ago",
      isRead: false,
      category: "order",
      priority: "medium",
      orderId: "6"
    },
    {
      id: "2",
      type: "success",
      title: "Order Confirmed",
      message: "Your transport order ORD-5 has been confirmed by supplier. Driver details will be shared soon.",
      timestamp: "1 hour ago",
      isRead: true,
      category: "order",
      priority: "high",
      orderId: "5"
    }
  ]

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/buyer/notifications/${id}/read`, {
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
      const response = await fetch(`/api/buyer/notifications/mark-all-read?buyerId=${buyerId}`, {
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
      const response = await fetch(`/api/buyer/notifications/${id}`, {
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
      const response = await fetch(`/api/buyer/notifications/clear-all?buyerId=${buyerId}`, {
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

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case "error":
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "order":
        return <Package className="h-4 w-4" />
      case "payment":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default:
        return "bg-green-100 text-green-800 border-green-200"
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = filter === "all" || notif.category === filter
    const matchesPriority = priority === "all" || notif.priority === priority
    return matchesFilter && matchesPriority
  })

  const unreadCount = notifications.filter(notif => !notif.isRead).length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your order status</p>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-muted-foreground" />
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="all" onClick={() => setFilter("all")}>
                All ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="order" onClick={() => setFilter("order")}>
                Orders ({notifications.filter(n => n.category === "order").length})
              </TabsTrigger>
              <TabsTrigger value="payment" onClick={() => setFilter("payment")}>
                Payments ({notifications.filter(n => n.category === "payment").length})
              </TabsTrigger>
              <TabsTrigger value="system" onClick={() => setFilter("system")}>
                System ({notifications.filter(n => n.category === "system").length})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                Mark All Read
              </Button>
              <Button variant="outline" size="sm" onClick={clearAll}>
                Clear All
              </Button>
            </div>
          </div>

          <TabsContent value={filter} className="space-y-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                  <p className="text-muted-foreground text-center">
                    You're all caught up! New notifications will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredNotifications.map((notification) => (
                <Card key={notification.id} className={`transition-all duration-200 hover:shadow-md ${!notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {getIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {notification.title}
                            </h3>
                            <Badge variant="outline" className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {getCategoryIcon(notification.category)}
                              {notification.category}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-3 leading-relaxed">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{notification.timestamp}</span>
                            {notification.orderId && (
                              <span>Order ID: {notification.orderId}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        {!notification.isRead && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                          >
                            Mark Read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

