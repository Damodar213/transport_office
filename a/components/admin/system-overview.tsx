"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock, Users, Package, Truck, Minus } from "lucide-react"

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

interface SystemOverviewProps {
  stats: DashboardStats | null
  isLoading: boolean
}

export function SystemOverview({ stats, isLoading }: SystemOverviewProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <Users className="h-4 w-4 text-blue-600" />
      case "order_assignment":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "document_verification":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "system_alert":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      info: "bg-blue-100 text-blue-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    }

    return <Badge className={colors[status as keyof typeof colors] || colors.info}>{status}</Badge>
  }

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

  const getAlertIcon = (iconName: string) => {
    switch (iconName) {
      case "AlertTriangle":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "CheckCircle":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "Clock":
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">System Overview</h2>
          <p className="text-muted-foreground">Loading system data...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse mb-2"></div>
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
      <div>
        <h2 className="text-2xl font-bold text-foreground">System Overview</h2>
        <p className="text-muted-foreground">Monitor system performance and recent activities</p>
      </div>

      {/* Dynamic Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                {stats.totalOrders.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders.count}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {stats.completedOrders.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedOrders.count}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>


        </div>
      )}



      <div className="grid grid-cols-1 gap-6">
        {/* Dynamic Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activities</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>


      </div>

      {/* Dynamic Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dynamic Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.todaySummary && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">New Registrations</span>
                  <span className="font-medium">{stats.todaySummary.newRegistrations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Orders Processed</span>
                  <span className="font-medium">{stats.todaySummary.ordersProcessed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Documents Verified</span>
                  <span className="font-medium">{stats.todaySummary.documentsVerified}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Issues Resolved</span>
                  <span className="font-medium">{stats.todaySummary.issuesResolved}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.pendingActions && (
              <>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Document Reviews</span>
                  <Badge variant="secondary">{stats.pendingActions.documentReviews}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Order Assignments</span>
                  <Badge variant="secondary">{stats.pendingActions.orderAssignments}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">User Verifications</span>
                  <Badge variant="secondary">{stats.pendingActions.userVerifications}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Support Tickets</span>
                  <Badge variant="secondary">{stats.pendingActions.supportTickets}</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Dynamic System Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats?.systemAlerts && stats.systemAlerts.length > 0 ? (
              stats.systemAlerts.map((alert, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {getAlertIcon(alert.icon)}
                  <span>{alert.message}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p>All systems operational</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
