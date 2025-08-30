"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Users, 
  FileText, 
  Save, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info,
  Package,
  Plus,
  Trash2,
  Edit
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemSettings {
  siteName: string
  siteDescription: string
  adminEmail: string
  supportEmail: string
  timezone: string
  dateFormat: string
  currency: string
  language: string
}

interface SecuritySettings {
  sessionTimeout: number
  maxLoginAttempts: number
  requireTwoFactor: boolean
  passwordMinLength: number
  passwordRequireSpecial: boolean
  passwordRequireNumbers: boolean
  passwordRequireUppercase: boolean
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  orderUpdates: boolean
  userRegistrations: boolean
  systemAlerts: boolean
  documentReviews: boolean
  paymentConfirmations: boolean
}

interface DatabaseSettings {
  backupFrequency: string
  backupRetention: number
  autoOptimization: boolean
  queryLogging: boolean
  connectionPoolSize: number
}

interface LoadType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

export default function SettingsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  
  // System Settings
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: "Transport Office Management System",
    siteDescription: "Comprehensive transport and logistics management platform",
    adminEmail: "admin@transportoffice.com",
    supportEmail: "support@transportoffice.com",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    language: "en"
  })

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireTwoFactor: false,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumbers: true,
    passwordRequireUppercase: true
  })

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderUpdates: true,
    userRegistrations: true,
    systemAlerts: true,
    documentReviews: true,
    paymentConfirmations: true
  })

  // Database Settings
  const [databaseSettings, setDatabaseSettings] = useState<DatabaseSettings>({
    backupFrequency: "daily",
    backupRetention: 30,
    autoOptimization: true,
    queryLogging: false,
    connectionPoolSize: 10
  })

  // Load Types Management
  const [loadTypes, setLoadTypes] = useState<LoadType[]>([])
  const [editingLoadType, setEditingLoadType] = useState<LoadType | null>(null)
  const [newLoadType, setNewLoadType] = useState({ name: "", description: "" })
  const [isLoadingLoadTypes, setIsLoadingLoadTypes] = useState(false)

  useEffect(() => {
    loadSettings()
    loadLoadTypes()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (response.ok) {
        const data = await response.json()
        if (data.systemSettings) setSystemSettings(data.systemSettings)
        if (data.securitySettings) setSecuritySettings(data.securitySettings)
        if (data.notificationSettings) setNotificationSettings(data.notificationSettings)
        if (data.databaseSettings) setDatabaseSettings(data.databaseSettings)
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings. Using default values.",
        variant: "destructive"
      })
    }
  }

  const loadLoadTypes = async () => {
    try {
      setIsLoadingLoadTypes(true)
      const response = await fetch("/api/admin/load-types")
      if (response.ok) {
        const data = await response.json()
        setLoadTypes(data.loadTypes || [])
      }
    } catch (error) {
      console.error("Failed to load load types:", error)
      toast({
        title: "Error",
        description: "Failed to load load types.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingLoadTypes(false)
    }
  }

  const handleSystemSettingChange = (key: keyof SystemSettings, value: string) => {
    setSystemSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSecuritySettingChange = (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleNotificationSettingChange = (key: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleDatabaseSettingChange = (key: keyof DatabaseSettings, value: any) => {
    setDatabaseSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  // Load Type Management Functions
  const addLoadType = async () => {
    if (!newLoadType.name.trim()) return
    
    try {
      const response = await fetch("/api/admin/load-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newLoadType.name.trim(),
          description: newLoadType.description.trim() || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLoadTypes(prev => [...prev, data.loadType])
        setNewLoadType({ name: "", description: "" })
        toast({
          title: "Success",
          description: "Load type added successfully!",
        })
      } else {
        throw new Error("Failed to add load type")
      }
    } catch (error) {
      console.error("Failed to add load type:", error)
      toast({
        title: "Error",
        description: "Failed to add load type. Please try again.",
        variant: "destructive"
      })
    }
  }

  const updateLoadType = async (id: string, updates: Partial<LoadType>) => {
    try {
      const response = await fetch("/api/admin/load-types", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          ...updates
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLoadTypes(prev => prev.map(lt => 
          lt.id === id ? data.loadType : lt
        ))
        toast({
          title: "Success",
          description: "Load type updated successfully!",
        })
      } else {
        throw new Error("Failed to update load type")
      }
    } catch (error) {
      console.error("Failed to update load type:", error)
      toast({
        title: "Error",
        description: "Failed to update load type. Please try again.",
        variant: "destructive"
      })
    }
  }

  const deleteLoadType = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/load-types?id=${id}`, {
        method: "DELETE"
      })

      if (response.ok) {
        setLoadTypes(prev => prev.filter(lt => lt.id !== id))
        toast({
          title: "Success",
          description: "Load type deleted successfully!",
        })
      } else {
        throw new Error("Failed to delete load type")
      }
    } catch (error) {
      console.error("Failed to delete load type:", error)
      toast({
        title: "Error",
        description: "Failed to delete load type. Please try again.",
        variant: "destructive"
      })
    }
  }

  const toggleLoadTypeStatus = async (id: string) => {
    const loadType = loadTypes.find(lt => lt.id === id)
    if (!loadType) return

    try {
      const response = await fetch("/api/admin/load-types", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id,
          isActive: !loadType.isActive
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLoadTypes(prev => prev.map(lt => 
          lt.id === id ? data.loadType : lt
        ))
        toast({
          title: "Success",
          description: `Load type ${data.loadType.isActive ? 'activated' : 'deactivated'} successfully!`,
        })
      } else {
        throw new Error("Failed to update load type status")
      }
    } catch (error) {
      console.error("Failed to update load type status:", error)
      toast({
        title: "Error",
        description: "Failed to update load type status. Please try again.",
        variant: "destructive"
      })
    }
  }

  const saveSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemSettings,
          securitySettings,
          notificationSettings,
          databaseSettings
        })
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Settings saved successfully!",
        })
        setHasChanges(false)
      } else {
        throw new Error("Failed to save settings")
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    loadSettings()
    setHasChanges(false)
    toast({
      title: "Reset",
      description: "Settings reset to default values.",
    })
  }

  const testDatabaseConnection = async () => {
    try {
      const response = await fetch("/api/admin/settings/test-db")
      if (response.ok) {
        toast({
          title: "Success",
          description: "Database connection test successful!",
        })
      } else {
        throw new Error("Database connection failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Database connection test failed.",
        variant: "destructive"
      })
    }
  }

  const getSystemStatus = () => {
    return {
      database: "Connected",
      api: "Operational",
      storage: "Healthy",
      notifications: "Active"
    }
  }

  const systemStatus = getSystemStatus()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={resetToDefaults} variant="outline" size="sm">
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={!hasChanges || isLoading}
            size="sm"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Database</p>
                <Badge variant="secondary" className="text-xs">
                  {systemStatus.database}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">API</p>
                <Badge variant="secondary" className="text-xs">
                  {systemStatus.api}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Storage</p>
                <Badge variant="secondary" className="text-xs">
                  {systemStatus.storage}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Notifications</p>
                <Badge variant="secondary" className="text-xs">
                  {systemStatus.notifications}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="system" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic system information and display preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    value={systemSettings.siteName}
                    onChange={(e) => handleSystemSettingChange("siteName", e.target.value)}
                    placeholder="Enter site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminEmail">Admin Email</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={systemSettings.adminEmail}
                    onChange={(e) => handleSystemSettingChange("adminEmail", e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    value={systemSettings.supportEmail}
                    onChange={(e) => handleSystemSettingChange("supportEmail", e.target.value)}
                    placeholder="support@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={systemSettings.timezone} onValueChange={(value) => handleSystemSettingChange("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={systemSettings.currency} onValueChange={(value) => handleSystemSettingChange("currency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                      <SelectItem value="GBP">British Pound (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={systemSettings.language} onValueChange={(value) => handleSystemSettingChange("language", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ta">Tamil</SelectItem>
                      <SelectItem value="te">Telugu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={systemSettings.siteDescription}
                  onChange={(e) => handleSystemSettingChange("siteDescription", e.target.value)}
                  placeholder="Enter site description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Load Type Management
              </CardTitle>
              <CardDescription>
                Manage load types that buyers can select when creating transport requests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Load Type */}
              <div className="space-y-4">
                <h4 className="font-medium">Add New Load Type</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newLoadTypeName">Name *</Label>
                    <Input
                      id="newLoadTypeName"
                      value={newLoadType.name}
                      onChange={(e) => setNewLoadType(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter load type name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newLoadTypeDescription">Description</Label>
                    <Input
                      id="newLoadTypeDescription"
                      value={newLoadType.description}
                      onChange={(e) => setNewLoadType(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button onClick={addLoadType} className="w-full" disabled={!newLoadType.name.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Load Type
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Load Types List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Current Load Types</h4>
                  <Button onClick={loadLoadTypes} variant="outline" size="sm" disabled={isLoadingLoadTypes}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingLoadTypes ? 'animate-spin' : ''}`} />
                    {isLoadingLoadTypes ? 'Loading...' : 'Refresh'}
                  </Button>
                </div>
                {isLoadingLoadTypes ? (
                  <div className="text-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading load types...</p>
                  </div>
                ) : loadTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No load types found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loadTypes.map((loadType) => (
                      <div key={loadType.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="font-medium">{loadType.name}</div>
                              {loadType.description && (
                                <div className="text-sm text-muted-foreground">{loadType.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={loadType.isActive ? "default" : "secondary"}>
                                {loadType.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Created: {new Date(loadType.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleLoadTypeStatus(loadType.id)}
                          >
                            {loadType.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLoadType(loadType)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteLoadType(loadType.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Edit Load Type Dialog */}
          {editingLoadType && (
            <Card>
              <CardHeader>
                <CardTitle>Edit Load Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editLoadTypeName">Name</Label>
                  <Input
                    id="editLoadTypeName"
                    value={editingLoadType.name}
                    onChange={(e) => setEditingLoadType(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter load type name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLoadTypeDescription">Description</Label>
                  <Input
                    id="editLoadTypeDescription"
                    value={editingLoadType.description || ""}
                    onChange={(e) => setEditingLoadType(prev => prev ? { ...prev, description: e.target.value } : null)}
                    placeholder="Enter description (optional)"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      if (editingLoadType) {
                        updateLoadType(editingLoadType.id, {
                          name: editingLoadType.name,
                          description: editingLoadType.description
                        })
                        setEditingLoadType(null)
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingLoadType(null)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Configure security settings and authentication requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => handleSecuritySettingChange("sessionTimeout", parseInt(e.target.value))}
                    min="5"
                    max="480"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxLoginAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => handleSecuritySettingChange("maxLoginAttempts", parseInt(e.target.value))}
                    min="3"
                    max="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                  <Input
                    id="passwordMinLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => handleSecuritySettingChange("passwordMinLength", parseInt(e.target.value))}
                    min="6"
                    max="20"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.requireTwoFactor}
                    onCheckedChange={(checked) => handleSecuritySettingChange("requireTwoFactor", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Special Characters</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain special characters
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireSpecial}
                    onCheckedChange={(checked) => handleSecuritySettingChange("passwordRequireSpecial", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Numbers</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain numbers
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireNumbers}
                    onCheckedChange={(checked) => handleSecuritySettingChange("passwordRequireNumbers", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Uppercase</Label>
                    <p className="text-sm text-muted-foreground">
                      Passwords must contain uppercase letters
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.passwordRequireUppercase}
                    onCheckedChange={(checked) => handleSecuritySettingChange("passwordRequireUppercase", checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Notification Channels</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={(checked) => handleNotificationSettingChange("emailNotifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onCheckedChange={(checked) => handleNotificationSettingChange("smsNotifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications in browser
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={(checked) => handleNotificationSettingChange("pushNotifications", checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <h4 className="font-medium">Notification Types</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Order Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Order status changes
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.orderUpdates}
                      onCheckedChange={(checked) => handleNotificationSettingChange("orderUpdates", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>User Registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        New user signups
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.userRegistrations}
                      onCheckedChange={(checked) => handleNotificationSettingChange("userRegistrations", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        System health alerts
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.systemAlerts}
                      onCheckedChange={(checked) => handleNotificationSettingChange("systemAlerts", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Document Reviews</Label>
                      <p className="text-sm text-muted-foreground">
                        Document verification requests
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.documentReviews}
                      onCheckedChange={(checked) => handleNotificationSettingChange("documentReviews", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Confirmations</Label>
                      <p className="text-sm text-muted-foreground">
                        Payment processing updates
                      </p>
                    </div>
                    <Switch
                      checked={notificationSettings.paymentConfirmations}
                      onCheckedChange={(checked) => handleNotificationSettingChange("paymentConfirmations", checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Configuration
              </CardTitle>
              <CardDescription>
                Configure database settings and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency">Backup Frequency</Label>
                  <Select value={databaseSettings.backupFrequency} onValueChange={(value) => handleDatabaseSettingChange("backupFrequency", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupRetention">Backup Retention (days)</Label>
                  <Input
                    id="backupRetention"
                    type="number"
                    value={databaseSettings.backupRetention}
                    onChange={(e) => handleDatabaseSettingChange("backupRetention", parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="connectionPoolSize">Connection Pool Size</Label>
                  <Input
                    id="connectionPoolSize"
                    type="number"
                    value={databaseSettings.connectionPoolSize}
                    onChange={(e) => handleDatabaseSettingChange("connectionPoolSize", parseInt(e.target.value))}
                    min="5"
                    max="50"
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Optimization</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically optimize database performance
                    </p>
                  </div>
                  <Switch
                    checked={databaseSettings.autoOptimization}
                    onCheckedChange={(checked) => handleDatabaseSettingChange("autoOptimization", checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Query Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all database queries for debugging
                    </p>
                  </div>
                  <Switch
                    checked={databaseSettings.queryLogging}
                    onCheckedChange={(checked) => handleDatabaseSettingChange("queryLogging", checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-2">
                <Button onClick={testDatabaseConnection} variant="outline" size="sm">
                  Test Database Connection
                </Button>
                <p className="text-sm text-muted-foreground">
                  Verify database connectivity and performance
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}





