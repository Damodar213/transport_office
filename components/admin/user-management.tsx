"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Filter, Download, UserCheck, UserX, MessageCircle, FileSpreadsheet, FileText } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { config } from "@/lib/config"
import { exportToExcel, exportToPDF, exportToCSV, ExportableUser } from "@/lib/export-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface User {
  id: number
  userId: string
  name?: string
  email?: string
  mobile?: string
  role: "supplier" | "buyer" | "admin"
  companyName?: string
  isActive?: boolean
  isVerified?: boolean
  registrationDate?: string
  lastLogin?: string
  totalOrders?: number
  gstNumber?: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [whatsappDialog, setWhatsappDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })
  const [messageData, setMessageData] = useState({
    vehicleCount: "",
    district: "",
    customMessage: "",
  })

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setLoadError("")
      try {
        const res = await fetch("/api/users", { cache: "no-store" })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Failed to load users")
        const normalized: User[] = (data.users || []).map((u: any) => ({
          ...u,
          isActive: u.isActive ?? true,
          isVerified: u.isVerified ?? false,
        }))
        setUsers(normalized)
        setFilteredUsers(normalized)
      } catch (e: any) {
        setLoadError(e.message || "Failed to load users")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const [filteredUsers, setFilteredUsers] = useState(users)
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    verified: "all",
    search: "",
  })

  const applyFilters = () => {
    let filtered = users

    if (filters.role !== "all") {
      filtered = filtered.filter((user) => user.role === filters.role)
    }

    if (filters.status !== "all") {
      const isActive = filters.status === "active"
      filtered = filtered.filter((user) => user.isActive === isActive)
    }

    if (filters.verified !== "all") {
      const isVerified = filters.verified === "verified"
      filtered = filtered.filter((user) => user.isVerified === isVerified)
    }

    if (filters.search) {
      const q = filters.search.toLowerCase()
      filtered = filtered.filter((user) => {
        const name = user.name?.toLowerCase() || ""
        const company = user.companyName?.toLowerCase() || ""
        const uid = user.userId?.toLowerCase() || ""
        return name.includes(q) || company.includes(q) || uid.includes(q)
      })
    }

    setFilteredUsers(filtered)
  }

  const toggleUserStatus = (userId: number) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isActive: !user.isActive } : user)))
    applyFilters()
  }

  const toggleVerification = (userId: number) => {
    setUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isVerified: !user.isVerified } : user)))
    applyFilters()
  }

  const handleExportExcel = () => {
    const exportData: ExportableUser[] = filteredUsers.map(user => ({
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      companyName: user.companyName,
      isActive: user.isActive,
      isVerified: user.isVerified,
      registrationDate: user.registrationDate,
      lastLogin: user.lastLogin,
      totalOrders: user.totalOrders,
      gstNumber: user.gstNumber
    }))
    exportToExcel(exportData, 'users_export')
  }

  const handleExportPDF = () => {
    const exportData: ExportableUser[] = filteredUsers.map(user => ({
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      companyName: user.companyName,
      isActive: user.isActive,
      isVerified: user.isVerified,
      registrationDate: user.registrationDate,
      lastLogin: user.lastLogin,
      totalOrders: user.totalOrders,
      gstNumber: user.gstNumber
    }))
    exportToPDF(exportData, 'users_export')
  }

  const handleExportCSV = () => {
    const exportData: ExportableUser[] = filteredUsers.map(user => ({
      id: user.id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      companyName: user.companyName,
      isActive: user.isActive,
      isVerified: user.isVerified,
      registrationDate: user.registrationDate,
      lastLogin: user.lastLogin,
      totalOrders: user.totalOrders,
      gstNumber: user.gstNumber
    }))
    exportToCSV(exportData, 'users_export')
  }

  const openWhatsappDialog = (user: User) => {
    setWhatsappDialog({ open: true, user })
    setMessageData({
      vehicleCount: "",
      district: "",
      customMessage: "",
    })
  }

  const closeWhatsappDialog = () => {
    setWhatsappDialog({ open: false, user: null })
    setMessageData({
      vehicleCount: "",
      district: "",
      customMessage: "",
    })
  }

  const generateWhatsappMessage = () => {
    const { user } = whatsappDialog
    if (!user) return ""

    const baseMessage = config.whatsapp.defaultTemplate
      .replace("{name}", user.name || user.userId)
      .replace("{vehicleCount}", messageData.vehicleCount || "[NUMBER]")
      .replace("{district}", messageData.district || "[DISTRICT]")
      .replace("{customMessage}", messageData.customMessage)
      .replace("{websiteUrl}", config.websiteUrl)

    return baseMessage
  }

  const sendWhatsappMessage = () => {
    const { user } = whatsappDialog
    if (!user?.mobile) {
      alert("No mobile number available for this user")
      return
    }

    const message = generateWhatsappMessage()
    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = user.mobile.replace(/[^0-9]/g, "")
    
    // Remove leading country code if present (assuming Indian numbers)
    const cleanPhoneNumber = phoneNumber.startsWith("91") ? phoneNumber.substring(2) : phoneNumber
    
    const whatsappUrl = `https://wa.me/91${cleanPhoneNumber}?text=${encodedMessage}`
    window.open(whatsappUrl, "_blank")
    closeWhatsappDialog()
  }

  const getRoleBadge = (role: string) => {
    return (
      <Badge variant={role === "supplier" ? "default" : "secondary"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Inactive</Badge>
    }
    if (!isVerified) {
      return <Badge variant="secondary">Unverified</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage suppliers and buyers in the system</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export to Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export to PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="supplier">Suppliers</SelectItem>
                  <SelectItem value="buyer">Buyers</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification</label>
              <Select
                value={filters.verified}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, verified: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>System Users</CardTitle>
          <CardDescription>{loading ? "Loading..." : `${filteredUsers.length} users found`}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && <div className="text-sm text-destructive mb-4">{loadError}</div>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User Details</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.userId}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.companyName}</div>
                      {user.gstNumber && <div className="text-sm text-muted-foreground">GST: {user.gstNumber}</div>}
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getStatusBadge(user.isActive, user.isVerified)}</TableCell>
                  <TableCell className="font-medium">{user.totalOrders}</TableCell>
                  <TableCell className="text-sm">{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>User Details - {user.name}</DialogTitle>
                            <DialogDescription>Complete information for {user.userId}</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div>
                              <label className="text-sm font-medium">Name</label>
                              <p className="text-sm text-muted-foreground">{user.name}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">User ID</label>
                              <p className="text-sm text-muted-foreground">{user.userId}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Email</label>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Mobile</label>
                              <p className="text-sm text-muted-foreground">{user.mobile || "Not provided"}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Role</label>
                              <p className="text-sm text-muted-foreground">{user.role}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Company</label>
                              <p className="text-sm text-muted-foreground">{user.companyName}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Registration Date</label>
                              <p className="text-sm text-muted-foreground">{user.registrationDate}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Total Orders</label>
                              <p className="text-sm text-muted-foreground">{user.totalOrders}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Last Login</label>
                              <p className="text-sm text-muted-foreground">{user.lastLogin}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center justify-between">
                            <div className="flex gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch checked={user.isActive} onCheckedChange={() => toggleUserStatus(user.id)} />
                                <label className="text-sm">Active</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Switch checked={user.isVerified} onCheckedChange={() => toggleVerification(user.id)} />
                                <label className="text-sm">Verified</label>
                              </div>
                            </div>
                            {user.mobile && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  openWhatsappDialog(user)
                                  // Close the details dialog
                                  const dialogTrigger = document.querySelector('[data-state="open"]')
                                  if (dialogTrigger) {
                                    (dialogTrigger as HTMLElement).click()
                                  }
                                }}
                                className="text-green-600 hover:text-green-700"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                WhatsApp
                              </Button>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" onClick={() => toggleVerification(user.id)}>
                        {user.isVerified ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => toggleUserStatus(user.id)}>
                        {user.isActive ? "Disable" : "Enable"}
                      </Button>

                      {user.mobile && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openWhatsappDialog(user)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "supplier").length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u) => u.role === "supplier" && u.isVerified).length} verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Buyers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => u.role === "buyer").length}</div>
            <p className="text-xs text-muted-foreground">
              {users.filter((u) => u.role === "buyer" && u.isActive).length} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => !u.isVerified).length}</div>
            <p className="text-xs text-muted-foreground">Require review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.filter((u) => !u.isActive).length}</div>
            <p className="text-xs text-muted-foreground">Disabled accounts</p>
          </CardContent>
        </Card>
      </div>

      {/* WhatsApp Message Dialog */}
      <Dialog open={whatsappDialog.open} onOpenChange={(open) => !open && closeWhatsappDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send WhatsApp Message</DialogTitle>
            <DialogDescription>
              Send a message to {whatsappDialog.user?.name || whatsappDialog.user?.userId} via WhatsApp
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                                        <Label htmlFor="vehicleCount">Number of Wheels</Label>
                <Input
                  id="vehicleCount"
                  placeholder="e.g., 5"
                  value={messageData.vehicleCount}
                  onChange={(e) => setMessageData(prev => ({ ...prev, vehicleCount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Input
                  id="district"
                  placeholder="e.g., Mumbai"
                  value={messageData.district}
                  onChange={(e) => setMessageData(prev => ({ ...prev, district: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customMessage">Additional Message (Optional)</Label>
              <Textarea
                id="customMessage"
                placeholder="Add any additional details or instructions..."
                value={messageData.customMessage}
                onChange={(e) => setMessageData(prev => ({ ...prev, customMessage: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Message Preview</Label>
              <div className="p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap">
                {generateWhatsappMessage()}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeWhatsappDialog}>
              Cancel
            </Button>
            <Button 
              onClick={sendWhatsappMessage}
              className="bg-green-600 hover:bg-green-700"
              disabled={!whatsappDialog.user?.mobile}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Send WhatsApp Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
