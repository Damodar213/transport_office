"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface CleanupData {
  totalDbDocuments: number
  supplierDocuments: number
  vehicleDocuments: number
  driverDocuments: number
  totalR2Files: number
  orphanedFiles: Array<{
    key: string
    url: string
    size: number
    lastModified: string
  }>
  missingFiles: string[]
  databaseUrls: string[]
  r2Files: Array<{
    key: string
    url: string
    size: number
    lastModified: string
  }>
}

interface CleanupResult {
  successful: string[]
  failed: { url: string, error: string }[]
  skipped: string[]
  summary: {
    total: number
    successful: number
    failed: number
    skipped: number
  }
}

export default function CleanupPage() {
  const [data, setData] = useState<CleanupData | null>(null)
  const [loading, setLoading] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [isCleaning, setIsCleaning] = useState(false)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/cleanup-orphaned-files")
      if (response.ok) {
        const result = await response.json()
        setData(result.data)
      } else {
        throw new Error("Failed to fetch data")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch cleanup data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCleanup = async () => {
    if (!data?.orphanedFiles) return

    setIsCleaning(true)
    try {
      // Clean up all orphaned files
      const urlsToDelete = data.orphanedFiles.map(file => file.url)

      if (urlsToDelete.length === 0) {
        toast({
          title: "No files to cleanup",
          description: "No orphaned files found",
        })
        return
      }

      const response = await fetch("/api/admin/cleanup-orphaned-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urlsToDelete }),
      })

      if (response.ok) {
        const result = await response.json()
        setCleanupResult(result.data)
        toast({
          title: "Cleanup completed",
          description: `Successfully deleted ${result.data.summary.successful} files`,
        })
        // Refresh data after cleanup
        await fetchData()
      } else {
        throw new Error("Failed to cleanup files")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup files",
        variant: "destructive",
      })
    } finally {
      setIsCleaning(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">File Cleanup</h1>
        <p className="text-muted-foreground">Clean up orphaned files in Cloudflare R2 storage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total DB Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.totalDbDocuments || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total R2 Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data?.totalR2Files || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Orphaned Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data?.orphanedFiles?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Missing Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data?.missingFiles?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Vehicle Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data?.vehicleDocuments || 0}</div>
          </CardContent>
        </Card>
      </div>

      {data?.orphanedFiles && data.orphanedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Orphaned Files in R2</CardTitle>
            <CardDescription>
              These files exist in Cloudflare R2 but are not referenced in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.orphanedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                  <Badge variant="destructive">{index + 1}</Badge>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{file.key}</div>
                    <div className="text-xs text-muted-foreground">
                      Size: {(file.size / 1024).toFixed(1)} KB | 
                      Modified: {new Date(file.lastModified).toLocaleDateString()}
                    </div>
                    <code className="text-xs text-red-600 break-all">{file.url}</code>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Database Document URLs</CardTitle>
          <CardDescription>
            These are the document URLs currently referenced in the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : data?.databaseUrls.length ? (
              data.databaseUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded">
                  <Badge variant="outline">{index + 1}</Badge>
                  <code className="text-sm flex-1 break-all">{url}</code>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">No documents found</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Warning:</strong> The cleanup process will permanently delete orphaned files from Cloudflare R2 storage. 
          Make sure you have backups if needed. This will delete all files that exist in R2 but are not referenced in the database.
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button onClick={fetchData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
        <Button 
          onClick={handleCleanup} 
          disabled={isCleaning || !data?.orphanedFiles?.length}
          variant="destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isCleaning ? "Cleaning..." : `Cleanup ${data?.orphanedFiles?.length || 0} Orphaned Files`}
        </Button>
      </div>

      {cleanupResult && (
        <Card>
          <CardHeader>
            <CardTitle>Cleanup Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{cleanupResult.summary.successful}</div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{cleanupResult.summary.failed}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{cleanupResult.summary.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{cleanupResult.summary.total}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>

            {cleanupResult.successful.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Successfully Deleted
                </h4>
                {cleanupResult.successful.map((url, index) => (
                  <div key={index} className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    {url}
                  </div>
                ))}
              </div>
            )}

            {cleanupResult.failed.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  Failed to Delete
                </h4>
                {cleanupResult.failed.map((item, index) => (
                  <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    <div>{item.url}</div>
                    <div className="text-xs text-red-500">{item.error}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
