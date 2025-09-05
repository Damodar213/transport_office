"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, Check, X, Clock, FileText, Upload } from "lucide-react"

interface DocumentSubmission {
  id: number
  userId: string
  supplierName: string
  companyName: string
  documentType: "aadhaar" | "pan" | "gst" | "rc" | "insurance" | "license"
  documentUrl: string
  submittedAt: string
  status: "pending" | "approved" | "rejected"
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
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
      const res = await fetch("/api/documents", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to fetch documents")
      setDocuments(data.documents || [])
    } catch (e: any) {
      setError(e.message || "Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const handleReview = async (documentId: number, status: "approved" | "rejected", notes: string) => {
    setIsReviewing(true)

    try {
      const res = await fetch("/api/documents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: documentId, status, reviewNotes: notes, reviewer: "Admin" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update document")
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Document Verification</h2>
        <p className="text-muted-foreground">Review and verify supplier documents</p>
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

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Submissions</CardTitle>
          <CardDescription>Review supplier documents and verify authenticity</CardDescription>
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
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{document.supplierName}</div>
                      <div className="text-sm text-muted-foreground">{document.companyName}</div>
                      <div className="text-sm text-muted-foreground">{document.userId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {getDocumentTypeLabel(document.documentType)}
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
                            <div className="border rounded-lg p-4 bg-muted/50">
                              <img
                                src={document.documentUrl || "/placeholder.svg"}
                                alt={`${document.documentType} document`}
                                className="w-full h-auto max-h-96 object-contain rounded"
                              />
                            </div>
                            <Button variant="outline" className="w-full bg-transparent">
                              <Upload className="h-4 w-4 mr-2" />
                              Download Original
                            </Button>
                          </div>

                          {/* Review Form */}
                          <div className="space-y-4">
                            <h3 className="font-semibold">Review Details</h3>

                            <div className="space-y-2">
                              <label className="text-sm font-medium">Supplier Information</label>
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
                                onClick={() => handleReview(document.id, "approved", reviewNotes)}
                                disabled={isReviewing}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                {isReviewing ? "Processing..." : "Approve"}
                              </Button>
                              <Button
                                onClick={() => handleReview(document.id, "rejected", reviewNotes)}
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
