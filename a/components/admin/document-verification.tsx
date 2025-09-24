"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Check, X, Clock, FileText, Upload, User, Truck, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface DocumentSubmission {
  id: number | string
  userId: string
  supplierName: string
  companyName: string
  documentType: "aadhaar" | "pan" | "gst" | "rc" | "insurance" | "license" | "puc" | "fitness"
  documentUrl: string
  submittedAt: string
  status: "pending" | "approved" | "rejected" | "mixed"
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  category: "supplier" | "driver" | "vehicle"
  documents?: any[] // For grouped supplier documents
  vehicleNumber?: string
  driverName?: string
}

interface DriverDocumentSubmission extends DocumentSubmission {
  driverName: string
  driverPhone: string
  driverLicense: string
  category: "driver"
}

interface VehicleDocumentSubmission extends DocumentSubmission {
  vehicleNumber: string
  vehicleType: string
  category: "vehicle"
}

interface SupplierGroup {
  supplierId: string
  supplierName: string
  companyName: string
  documents: DocumentSubmission[]
}

export function DocumentVerification() {
  const [documents, setDocuments] = useState<DocumentSubmission[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const [selectedDocument, setSelectedDocument] = useState<DocumentSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentSubmission | null>(null)
  const { toast } = useToast()

  const fetchSupplierInfo = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/suppliers?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        const supplier = data.data
        if (supplier && (supplier.contact_person || supplier.company_name)) {
          return {
            name: supplier.contact_person,
            company_name: supplier.company_name
          }
        }
      }
    } catch (error) {
      console.error("Error fetching supplier info:", error)
    }
    return null
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError("")
      console.log("Fetching all documents from API...")
      
      // Fetch all three types of documents in parallel
      const [supplierRes, vehicleRes, driverRes] = await Promise.allSettled([
        fetch("/api/admin/supplier-documents-test", { cache: "no-store" }),
        fetch("/api/admin/vehicle-documents-simple", { cache: "no-store" }),
        fetch("/api/admin/driver-documents-simple", { cache: "no-store" })
      ])
      
      // Handle responses safely
      const supplierData = supplierRes.status === 'fulfilled' ? await supplierRes.value.json() : null
      const vehicleData = vehicleRes.status === 'fulfilled' ? await vehicleRes.value.json() : null
      const driverData = driverRes.status === 'fulfilled' ? await driverRes.value.json() : null
      
      console.log("Supplier documents:", supplierData)
      console.log("Vehicle documents:", vehicleData)
      console.log("Driver documents:", driverData)
      
      let allDocuments: DocumentSubmission[] = []
      
      // Transform supplier documents - show only PAN and GST documents individually
      if (supplierRes.status === 'fulfilled' && supplierRes.value.ok && supplierData?.data?.documents) {
        const supplierDocs: DocumentSubmission[] = []
        
        supplierData.data.documents.forEach((supplier: any) => {
          // Filter only PAN and GST documents for suppliers
          const relevantDocs = supplier.documents.filter((doc: any) => 
            doc.documentType === 'pan' || doc.documentType === 'gst'
          )
          
          // Create individual entries for each PAN and GST document
          relevantDocs.forEach((doc: any) => {
            supplierDocs.push({
              id: `supplier-${doc.id}`,
              userId: supplier.userId,
              supplierName: supplier.supplierName,
              companyName: supplier.companyName,
              documentType: doc.documentType,
              documentUrl: doc.documentUrl,
              submittedAt: doc.submittedAt,
              status: doc.status,
              reviewNotes: doc.reviewNotes,
              reviewedBy: doc.reviewedBy,
              reviewedAt: doc.reviewedAt,
              category: "supplier" as const
            })
          })
        })
        
        allDocuments = [...allDocuments, ...supplierDocs]
      }
      
      // Transform vehicle documents - show only RC cards
      if (vehicleRes.status === 'fulfilled' && vehicleRes.value.ok && vehicleData?.documents) {
        const vehicleDocs = vehicleData.documents
          .filter((doc: any) => doc.document_type === 'rc') // Only RC cards
          .map((doc: any) => ({
            id: `vehicle-${doc.id}`,
            userId: doc.supplier_id,
            supplierName: doc.supplier_name || "Unknown Supplier",
            companyName: doc.company_name || "Unknown Company",
            documentType: doc.document_type,
            documentUrl: doc.document_url,
            submittedAt: doc.submitted_at,
            status: doc.status,
            reviewNotes: doc.review_notes,
            reviewedBy: doc.reviewed_by,
            reviewedAt: doc.reviewed_at,
            category: "vehicle" as const,
            vehicleNumber: doc.vehicle_number
          }))
        allDocuments = [...allDocuments, ...vehicleDocs]
      }
      
      // Transform driver documents - show only driving licenses
      if (driverRes.status === 'fulfilled' && driverRes.value.ok && driverData?.documents) {
        const driverDocs = driverData.documents
          .filter((doc: any) => doc.document_type === 'license') // Only driving licenses
          .map((doc: any) => ({
            id: `driver-${doc.id}`,
            userId: doc.supplier_id,
            supplierName: doc.supplier_name || "Unknown Supplier",
            companyName: doc.company_name || "Unknown Company",
            documentType: doc.document_type,
            documentUrl: doc.document_url,
            submittedAt: doc.submitted_at,
            status: doc.status,
            reviewNotes: doc.review_notes,
            reviewedBy: doc.reviewed_by,
            reviewedAt: doc.reviewed_at,
            category: "driver" as const,
            driverName: doc.driver_name
          }))
        allDocuments = [...allDocuments, ...driverDocs]
      }
      
      console.log("All documents combined:", allDocuments)
      
      // Fetch supplier information for documents with missing supplier names
      const documentsWithSupplierInfo = await Promise.all(
        allDocuments.map(async (doc) => {
          if (doc.supplierName === "Unknown Supplier" || doc.companyName === "Unknown Company") {
            const supplierInfo = await fetchSupplierInfo(doc.userId)
            if (supplierInfo) {
              return {
                ...doc,
                supplierName: supplierInfo.name || doc.supplierName,
                companyName: supplierInfo.company_name || doc.companyName
              }
            }
          }
          return doc
        })
      )
      
      // Group documents by supplier for better organization
      const groupedDocuments = documentsWithSupplierInfo.sort((a, b) => {
        // First sort by supplier name
        if (a.supplierName !== b.supplierName) {
          return a.supplierName.localeCompare(b.supplierName)
        }
        // Then sort by category (supplier, driver, vehicle)
        const categoryOrder = { supplier: 0, driver: 1, vehicle: 2 }
        return categoryOrder[a.category] - categoryOrder[b.category]
      })
      
      setDocuments(groupedDocuments)
    } catch (e: any) {
      console.error("Error fetching documents:", e)
      setError(e.message || "Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleReview = async (documentId: number | string, status: "approved" | "rejected", notes: string, category: string) => {
    setIsReviewing(true)

    try {
      // Handle individual documents (no more grouped documents)
      let apiEndpoint = "/api/admin/supplier-documents"
      if (category === "vehicle") {
        apiEndpoint = "/api/admin/vehicle-documents"
      } else if (category === "driver") {
        apiEndpoint = "/api/admin/driver-documents"
      }

      // Extract the original ID from the prefixed ID
      const originalId = typeof documentId === 'string' ? documentId.split('-')[1] : documentId

      const res = await fetch(apiEndpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: originalId, status, reviewNotes: notes, reviewer: "Admin" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update document")
      
      // Update local state immediately instead of refetching all documents
      const now = new Date().toISOString()
      setDocuments(prevDocuments => 
        prevDocuments.map(doc => 
          doc.id === documentId 
            ? {
                ...doc,
                status,
                reviewNotes: notes,
                reviewedBy: "Admin",
                reviewedAt: now
              }
            : doc
        )
      )
      
      setSelectedDocument(null)
      setReviewNotes("")
      
      // Show success toast
      toast({
        title: "Document Updated",
        description: `Document ${status === "approved" ? "approved" : "rejected"} successfully`,
      })
    } catch (error) {
      console.error("Review error:", error)
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      })
    } finally {
      setIsReviewing(false)
    }
  }

  const handleDelete = async (document: DocumentSubmission) => {
    setIsDeleting(true)

    try {
      // Determine the correct API endpoint based on document category
      let apiEndpoint = "/api/admin/supplier-documents"
      if (document.category === "vehicle") {
        apiEndpoint = "/api/admin/vehicle-documents"
      } else if (document.category === "driver") {
        apiEndpoint = "/api/admin/driver-documents"
      }

      // Extract the original ID from the prefixed ID
      const originalId = typeof document.id === 'string' ? document.id.split('-')[1] : document.id

      const res = await fetch(`${apiEndpoint}?id=${originalId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })
      
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete document")
      }
      
      // Update local state immediately instead of refetching all documents
      setDocuments(prevDocuments => prevDocuments.filter(doc => doc.id !== document.id))
      
      setDeleteConfirmOpen(false)
      setDocumentToDelete(null)
    } catch (error) {
      console.error("Delete error:", error)
      setError(error instanceof Error ? error.message : "Failed to delete document")
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmDelete = async (document: DocumentSubmission) => {
    // If the document has unknown supplier info, try to fetch it before showing the dialog
    if (document.supplierName === "Unknown Supplier" || document.companyName === "Unknown Company") {
      try {
        const supplierInfo = await fetchSupplierInfo(document.userId)
        if (supplierInfo) {
          const updatedDocument = {
            ...document,
            supplierName: supplierInfo.name || document.supplierName,
            companyName: supplierInfo.company_name || document.companyName
          }
          setDocumentToDelete(updatedDocument)
        } else {
          setDocumentToDelete(document)
        }
      } catch (error) {
        console.error("Error fetching supplier info for delete:", error)
        setDocumentToDelete(document)
      }
    } else {
      setDocumentToDelete(document)
    }
    setDeleteConfirmOpen(true)
  }

  const handleDownload = async (doc: DocumentSubmission) => {
    try {
      if (!doc.documentUrl) {
        toast({
          title: "Download Error",
          description: "No document URL available",
          variant: "destructive",
        })
        return
      }

      // Create a temporary link element to trigger download
      const link = document.createElement('a')
      link.href = doc.documentUrl
      
      // Generate a meaningful filename
      const fileExtension = doc.documentUrl.split('.').pop() || 'jpg'
      const filename = `${doc.supplierName}_${doc.documentType}_${doc.userId}.${fileExtension}`
      link.download = filename
      
      // Append to body, click, and remove
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Download Started",
        description: `Downloading ${getDocumentTypeLabel(doc.documentType)} for ${doc.supplierName}`,
      })
    } catch (error) {
      console.error("Download error:", error)
      toast({
        title: "Download Error",
        description: "Failed to download document",
        variant: "destructive",
      })
    }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels = {
      aadhaar: "Aadhaar Card",
      pan: "PAN Card",
      gst: "GST Certificate",
      rc: "RC Card",
      insurance: "Insurance",
      license: "Driving License",
      puc: "PUC Certificate",
      fitness: "Fitness Certificate",
    }
    return labels[type as keyof typeof labels] || type
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    }

    const icons = {
      pending: <Clock className="h-3 w-3" />,
      approved: <Check className="h-3 w-3" />,
      rejected: <X className="h-3 w-3" />,
    }

    return (
      <Badge className={`${colors[status as keyof typeof colors]} flex items-center gap-1`}>
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const toggleSupplierExpansion = (supplierId: string) => {
    const newExpanded = new Set(expandedSuppliers)
    if (newExpanded.has(supplierId)) {
      newExpanded.delete(supplierId)
    } else {
      newExpanded.add(supplierId)
    }
    setExpandedSuppliers(newExpanded)
  }

  const groupDocumentsBySupplier = (docs: DocumentSubmission[]): SupplierGroup[] => {
    const grouped = docs.reduce((acc, doc) => {
      const key = doc.userId
      if (!acc[key]) {
        acc[key] = {
          supplierId: doc.userId,
          supplierName: doc.supplierName !== "Unknown Supplier" ? doc.supplierName : `Supplier ${doc.userId}`,
          companyName: doc.companyName !== "Unknown Company" ? doc.companyName : `Company ${doc.userId}`,
          documents: []
        }
      }
      acc[key].documents.push(doc)
      return acc
    }, {} as Record<string, SupplierGroup>)

    return Object.values(grouped).sort((a, b) => a.supplierName.localeCompare(b.supplierName))
  }

  const pendingCount = documents.filter((doc) => doc.status === "pending").length
  const approvedCount = documents.filter((doc) => doc.status === "approved").length
  const rejectedCount = documents.filter((doc) => doc.status === "rejected").length

  console.log("Total documents:", documents.length)
  console.log("All documents:", documents)

  const renderDocumentTable = (documents: DocumentSubmission[], title: string, description: string) => {
    const supplierGroups = groupDocumentsBySupplier(documents)
    
    return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {loading && <div className="text-sm text-muted-foreground">Loading documents...</div>}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplierGroups.map((supplier) => (
              <React.Fragment key={`supplier-group-${supplier.supplierId}`}>
                {/* Supplier Header Row */}
                <TableRow 
                  key={`supplier-${supplier.supplierId}`}
                  className="bg-muted/50 cursor-pointer hover:bg-muted/70"
                  onClick={() => toggleSupplierExpansion(supplier.supplierId)}
                >
                  <TableCell colSpan={6}>
                    <div className="flex items-center gap-2">
                      {expandedSuppliers.has(supplier.supplierId) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div>
                        <div className="font-medium text-lg">{supplier.supplierName}</div>
                        <div className="text-sm text-muted-foreground">{supplier.companyName}</div>
                        <div className="text-sm text-muted-foreground">ID: {supplier.supplierId}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {supplier.documents.length} document(s) - Click to {expandedSuppliers.has(supplier.supplierId) ? 'collapse' : 'expand'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Document Rows (shown when expanded) */}
                {expandedSuppliers.has(supplier.supplierId) && supplier.documents.map((document) => (
                  <TableRow key={document.id} className="bg-background/50">
                    <TableCell>
                      <div className="pl-6">
                        <div className="text-sm text-muted-foreground">
                          Category: <span className="capitalize font-medium">{document.category}</span>
                        </div>
                        {document.driverName && (
                          <div className="text-sm text-blue-600">Driver: {document.driverName}</div>
                        )}
                        {document.vehicleNumber && (
                          <div className="text-sm text-green-600">Vehicle: {document.vehicleNumber}</div>
                        )}
                      </div>
                    </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{getDocumentTypeLabel(document.documentType)}</div>
                      <div className="text-sm text-muted-foreground">
                        {document.documentUrl ? "Document uploaded" : "No document"}
                      </div>
                    </div>
                  </div>
                </TableCell>
                    <TableCell className="text-sm">{new Date(document.submittedAt).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(document.status)}</TableCell>
                    <TableCell className="text-sm">
                      {document.reviewedAt ? (
                        <div>
                          <div className="font-medium">{document.reviewedBy}</div>
                          <div className="text-muted-foreground">{new Date(document.reviewedAt).toLocaleDateString()}</div>
                        </div>
                      ) : (
                        "Not reviewed"
                      )}
                    </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Dialog open={selectedDocument?.id === document.id} onOpenChange={(open) => {
                      if (!open) {
                        setSelectedDocument(null)
                        setReviewNotes("")
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDocument(document)}>
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Document Review - {getDocumentTypeLabel(document.documentType)}</DialogTitle>
                        <DialogDescription>Review document submitted by {document.supplierName}</DialogDescription>
                      </DialogHeader>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Document Preview */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Document Preview</h3>
                          <div className="border rounded-lg p-4 bg-muted/50">
                            <img
                              src={document.documentUrl || "/placeholder.svg"}
                              alt={`${document.documentType} document`}
                              className="w-full h-auto max-h-96 object-contain rounded"
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            className="w-full bg-transparent"
                            onClick={() => handleDownload(document)}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Download Original
                          </Button>
                        </div>

                        {/* Review Form */}
                        <div className="space-y-4">
                          <h3 className="font-semibold">Review Details</h3>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Information</label>
                            <div className="p-3 bg-muted/50 rounded">
                              <div className="text-sm">
                                <div>
                                  <strong>Name:</strong> {document.supplierName}
                                </div>
                                <div>
                                  <strong>Company:</strong> {document.companyName}
                                </div>
                                <div>
                                  <strong>User ID:</strong> {document.userId}
                                </div>
                                <div>
                                  <strong>Submitted:</strong> {document.submittedAt}
                                </div>
                              </div>
                            </div>
                          </div>

                          {document.reviewNotes && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Previous Review Notes</label>
                              <Alert>
                                <AlertDescription>{document.reviewNotes}</AlertDescription>
                              </Alert>
                            </div>
                          )}

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Review Notes</label>
                            <Textarea
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Enter your review comments..."
                              rows={4}
                            />
                          </div>

                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleReview(document.id, "approved", reviewNotes, document.category)}
                              disabled={isReviewing}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              {isReviewing ? "Processing..." : "Approve"}
                            </Button>
                            <Button
                              onClick={() => handleReview(document.id, "rejected", reviewNotes, document.category)}
                              disabled={isReviewing}
                              variant="destructive"
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-2" />
                              {isReviewing ? "Processing..." : "Reject"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => confirmDelete(document)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Document Verification</h2>
        <p className="text-muted-foreground">Review and verify supplier, driver, and vehicle documents</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting verification</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Verified documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Need resubmission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">All documents</p>
          </CardContent>
        </Card>
      </div>

      {/* All Documents by Supplier */}
      {renderDocumentTable(
        documents,
        "All Document Submissions",
        "Review and verify all documents organized by supplier (Supplier, Driver, and Vehicle documents)"
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {documentToDelete && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="text-sm">
                  <div><strong>Supplier:</strong> {documentToDelete.supplierName === "Unknown Supplier" ? `Supplier ${documentToDelete.userId}` : documentToDelete.supplierName}</div>
                  <div><strong>Company:</strong> {documentToDelete.companyName === "Unknown Company" ? `Company ${documentToDelete.userId}` : documentToDelete.companyName}</div>
                  <div><strong>User ID:</strong> {documentToDelete.userId}</div>
                  <div><strong>Document Type:</strong> {getDocumentTypeLabel(documentToDelete.documentType)}</div>
                  <div><strong>Category:</strong> {documentToDelete.category}</div>
                  {documentToDelete.driverName && (
                    <div><strong>Driver:</strong> {documentToDelete.driverName}</div>
                  )}
                  {documentToDelete.vehicleNumber && (
                    <div><strong>Vehicle:</strong> {documentToDelete.vehicleNumber}</div>
                  )}
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(documentToDelete)}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Document"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
