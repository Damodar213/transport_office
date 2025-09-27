"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Settings, 
  Users, 
  FileText,
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
import { capitalizeWords, capitalizeFirst, formatStatus } from "@/lib/name-utils"





interface LoadType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}


export default function SettingsPage() {
  const { toast } = useToast()
  




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
        // Refresh the load types from server to ensure we have the latest data
        await loadLoadTypes()
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
        // Refresh the load types from server to ensure we have the latest data
        await loadLoadTypes()
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
        // Refresh the load types from server to ensure we have the latest data
        await loadLoadTypes()
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
        // Refresh the load types from server to ensure we have the latest data
        await loadLoadTypes()
        toast({
          title: "Success",
          description: `Load type ${!loadType.isActive ? 'activated' : 'deactivated'} successfully!`,
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
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
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
              <CheckCircle className="h-5 w-5 text-green-600" />
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
              <Info className="h-5 w-5 text-orange-600" />
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

      {/* Business Settings */}
      <div className="space-y-4">
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
                              <div className="font-medium">{capitalizeWords(loadType.name)}</div>
                              {loadType.description && (
                                <div className="text-sm text-muted-foreground">{loadType.description}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={loadType.isActive ? "default" : "secondary"}>
                                {formatStatus(loadType.isActive ? "active" : "inactive")}
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


      </div>
    </div>
  )
}





