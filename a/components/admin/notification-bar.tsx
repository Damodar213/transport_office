"use client"

import { useState, useEffect } from "react"
import { Bell, X, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationBarProps {
  message: string
  type?: "success" | "warning" | "info" | "error"
  duration?: number
  onClose?: () => void
}

export function NotificationBar({ 
  message, 
  type = "info", 
  duration = 2000, 
  onClose 
}: NotificationBarProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      if (onClose) {
        setTimeout(onClose, 300) // Wait for animation to complete
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
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

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200"
      case "warning":
        return "bg-yellow-50 border-yellow-200"
      case "error":
        return "bg-red-50 border-red-200"
      default:
        return "bg-blue-50 border-blue-200"
    }
  }

  const getTextColor = () => {
    switch (type) {
      case "success":
        return "text-green-800"
      case "warning":
        return "text-yellow-800"
      case "error":
        return "text-red-800"
      default:
        return "text-blue-800"
    }
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 ease-in-out",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className={cn(
        "border-b px-4 py-3 shadow-sm",
        getBgColor()
      )}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-gray-600" />
            {getIcon()}
            <p className={cn("text-sm font-medium", getTextColor())}>
              {message}
            </p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false)
              if (onClose) {
                setTimeout(onClose, 300)
              }
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook to manage notifications
export function useNotificationBar() {
  const [notifications, setNotifications] = useState<Array<{
    id: string
    message: string
    type: "success" | "warning" | "info" | "error"
  }>>([])

  const showNotification = (message: string, type: "success" | "warning" | "info" | "error" = "info") => {
    const id = Math.random().toString(36).substr(2, 9)
    setNotifications(prev => [...prev, { id, message, type }])
    
    // Auto remove after 2 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 2000)
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return {
    notifications,
    showNotification,
    removeNotification
  }
}
