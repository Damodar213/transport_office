"use client"

import { useEffect, useState } from "react"
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
import { Eye, Check, X, Clock, FileText, Upload, User, Truck } from "lucide-react"

interface DocumentSubmission {
  id: number | string
  userId: string
  supplierName: string
  companyName: string
  documentType: "aadhaar" | "pan" | "gst" | "rc" | "insurance" | "license" | "puc" | "fitness" | "Multiple Documents"
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

export function DocumentVerification() {
  const [documents, setDocuments] = useState<DocumentSubmission[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string>("")

  const [selectedDocument, setSelectedDocument] = useState<DocumentSubmission | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")
  const [isReviewing, setIsReviewing] = useState(false)

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
      
      // Transform supplier documents - keep them grouped by supplier
      if (supplierRes.status === 'fulfilled' && supplierRes.value.ok && supplierData?.data?.documents) {
        const supplierDocs = supplierData.data.documents.map((supplier: any) => ({
          id: `supplier-${supplier.userId}`,
          userId: supplier.userId,
          supplierName: supplier.supplierName,
          companyName: supplier.companyName,
          documentType: "Multiple Documents",
          documentUrl: "",
          submittedAt: supplier.documents[0]?.submittedAt || new Date().toISOString(),
          status: supplier.documents.some((doc: any) => doc.status === 'pending') ? 'pending' : 
                  supplier.documents.every((doc: any) => doc.status === 'approved') ? 'approved' : 'mixed',
          reviewNotes: "",
          reviewedBy: "",
          reviewedAt: "",
          category: "supplier" as const,
          documents: supplier.documents // Store all documents for this supplier
        }))
        allDocuments = [...allDocuments, ...supplierDocs]
      }
      
      // Transform vehicle documents
      if (vehicleRes.status === 'fulfilled' && vehicleRes.value.ok && vehicleData?.documents) {
        const vehicleDocs = vehicleData.documents.map((doc: any) => ({
          id: doc.id,
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
      
      // Transform driver documents
      if (driverRes.status === 'fulfilled' && driverRes.value.ok && driverData?.documents) {
        const driverDocs = driverData.documents.map((doc: any) => ({
          id: doc.id,
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
      setDocuments(allDocuments)
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
      // Handle grouped supplier documents
      if (category === "supplier" && typeof documentId === "string" && documentId.startsWith("supplier-")) {
        const selectedDoc = documents.find(doc => doc.id === documentId)
        if (selectedDoc?.documents) {
          // Review all documents for this supplier
          const promises = selectedDoc.documents.map((doc: any) => 
            fetch("/api/admin/supplier-documents", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: doc.id, status, reviewNotes: notes, reviewer: "Admin" }),
            })
          )
          await Promise.all(promises)
        }
      } else {
        // Handle individual documents
        let apiEndpoint = "/api/admin/supplier-documents"
        if (category === "vehicle") {
          apiEndpoint = "/api/admin/vehicle-documents"
        } else if (category === "driver") {
          apiEndpoint = "/api/admin/driver-documents"
        }

        const res = await fetch(apiEndpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: documentId, status, reviewNotes: notes, reviewer: "Admin" }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update document")
      }
      
      await fetchDocuments()
      setSelectedDocument(null)
      setReviewNotes("")
    } catch (error) {
      console.error("Review error:", error)
    } finally {
      setIsReviewing(false)
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

  const pendingCount = documents.filter((doc) => doc.status === "pending").length
  const approvedCount = documents.filter((doc) => doc.status === "approved").length
  const rejectedCount = documents.filter((doc) => doc.status === "rejected").length

  // Filter documents by category
  const supplierDocuments = documents.filter((doc) => doc.category === "supplier")
  const driverDocuments = documents.filter((doc) => doc.category === "driver")
  const vehicleDocuments = documents.filter((doc) => doc.category === "vehicle")
  
  console.log("Total documents:", documents.length)
  console.log("Supplier documents:", supplierDocuments.length)
  console.log("All documents:", documents)

  const renderDocumentTable = (documents: DocumentSubmission[], title: string, description: string) => (
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
              <TableHead>Supplier/Driver</TableHead>
              <TableHead>Document Type</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reviewed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{document.supplierName}</div>
                    <div className="text-sm text-muted-foreground">{document.companyName}</div>
                    <div className="text-sm text-muted-foreground">{document.userId}</div>
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
                    {document.documentType === "Multiple Documents" ? (
                      <div>
                        <div className="font-medium">Multiple Documents</div>
                        <div className="text-sm text-muted-foreground">
                          {document.documents?.map((doc: any) => getDocumentTypeLabel(doc.documentType)).join(", ")}
                        </div>
                      </div>
                    ) : (
                      getDocumentTypeLabel(document.documentType)
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">{document.submittedAt}</TableCell>
                <TableCell>{getStatusBadge(document.status)}</TableCell>
                <TableCell className="text-sm">
                  {document.reviewedAt ? (
                    <div>
                      <div>{document.reviewedAt}</div>
                      <div className="text-muted-foreground">by {document.reviewedBy}</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not reviewed</span>
                  )}
                </TableCell>
                <TableCell>
                  <Dialog>
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
                          {document.documentType === "Multiple Documents" ? (
                            <div className="space-y-4">
                              {document.documents?.map((doc: any, index: number) => (
                                <div key={index} className="border rounded-lg p-4 bg-muted/50">
                                  <div className="mb-2">
                                    <h4 className="font-medium">{getDocumentTypeLabel(doc.documentType)}</h4>
                                    <Badge className={`mt-1 ${doc.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                                      doc.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                                      'bg-red-100 text-red-800'}`}>
                                      {doc.status}
                                    </Badge>
                                  </div>
                                  <img
                                    src={doc.documentUrl || "/placeholder.svg"}
                                    alt={`${doc.documentType} document`}
                                    className="w-full h-auto max-h-64 object-contain rounded"
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="border rounded-lg p-4 bg-muted/50">
                              <img
                                src={document.documentUrl || "/placeholder.svg"}
                                alt={`${document.documentType} document`}
                                className="w-full h-auto max-h-96 object-contain rounded"
                              />
                            </div>
                          )}
                          <Button variant="outline" className="w-full bg-transparent">
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
                            {document.documentType === "Multiple Documents" ? (
                              <div className="w-full space-y-2">
                                <div className="text-sm font-medium">Review All Documents:</div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleReview(document.id, "approved", reviewNotes, document.category)}
                                    disabled={isReviewing}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    {isReviewing ? "Processing..." : "Approve All"}
                                  </Button>
                                  <Button
                                    onClick={() => handleReview(document.id, "rejected", reviewNotes, document.category)}
                                    disabled={isReviewing}
                                    variant="destructive"
                                    className="flex-1"
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    {isReviewing ? "Processing..." : "Reject All"}
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  This will approve/reject all documents for this supplier
                                </div>
                              </div>
                            ) : (
                              <>
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
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )

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

      {/* Document Categories Tabs */}
      <Tabs defaultValue="supplier" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="supplier" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Supplier Documents
          </TabsTrigger>
          <TabsTrigger value="driver" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Driver Documents
          </TabsTrigger>
          <TabsTrigger value="vehicle" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Vehicle Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="supplier" className="space-y-4">
          {renderDocumentTable(
            supplierDocuments,
            "Supplier Document Submissions",
            "Review and verify supplier company documents (GST, PAN, etc.)"
          )}
        </TabsContent>

        <TabsContent value="driver" className="space-y-4">
          {renderDocumentTable(
            driverDocuments,
            "Driver Document Submissions", 
            "Review and verify driver personal documents (Aadhaar, PAN, Driving License, etc.)"
          )}
        </TabsContent>

        <TabsContent value="vehicle" className="space-y-4">
          {renderDocumentTable(
            vehicleDocuments,
            "Vehicle Document Submissions",
            "Review and verify vehicle documents (RC Card, Insurance, PUC, Fitness Certificate, etc.)"
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
