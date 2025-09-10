"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Eye, Filter, Download, UserCheck, UserX, FileSpreadsheet, FileText, Trash2 } from "lucide-react"
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
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)

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

  // Auto-apply filters when users array changes
  useEffect(() => {
    applyFilters()
  }, [users, filters])

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


  const openDeleteDialog = (user: User) => {
    setDeleteDialog({ open: true, user })
  }

  const closeDeleteDialog = () => {
    setDeleteDialog({ open: false, user: null })
  }

  const deleteUser = async () => {
    const { user } = deleteDialog
    if (!user) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${user.userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      // Remove user from local state
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setFilteredUsers((prev) => prev.filter((u) => u.id !== user.id))
      
      closeDeleteDialog()
      
      // Show success message (you can replace this with a toast notification)
      alert(`User ${user.name || user.userId} has been deleted successfully`)
    } catch (error: any) {
      console.error('Error deleting user:', error)
      alert(`Failed to delete user: ${error.message}`)
    } finally {
      setIsDeleting(false)
    }
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
      gstNumber: user.gstNumber
    }))
    exportToCSV(exportData, 'users_export')
  }





  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          {role.charAt(0).toUpperCase() + role.slice(1)}
        </Badge>
      )
    }
    return (
      <Badge variant={role === "supplier" ? "default" : "secondary"}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
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
                          </div>
                        </DialogContent>
                      </Dialog>


                      {user.role !== 'admin' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openDeleteDialog(user)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && closeDeleteDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteDialog.user && (
            <div className="py-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div><strong>Name:</strong> {deleteDialog.user.name || deleteDialog.user.userId}</div>
                  <div><strong>Email:</strong> {deleteDialog.user.email || 'N/A'}</div>
                  <div><strong>Role:</strong> {deleteDialog.user.role}</div>
                  <div><strong>Company:</strong> {deleteDialog.user.companyName || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={deleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete User
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
