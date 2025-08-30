"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Upload, X, File, Eye } from "lucide-react"

interface FileUploadProps {
  label: string
  name: string
  accept?: string
  required?: boolean
  maxSize?: number // in MB
  existingFile?: string
  onFileChange?: (file: File | null, url?: string) => void
  className?: string
}

export function FileUpload({
  label,
  name,
  accept = ".pdf,.jpg,.jpeg,.png",
  required = false,
  maxSize = 5,
  existingFile,
  onFileChange,
  className = "",
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingFile || null)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFile: File) => {
    setError("")

    // Validate file size
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`File size must be less than ${maxSize}MB`)
      return
    }

    // Validate file type
    const allowedTypes = accept.split(",").map((type) => type.trim())
    const fileExtension = "." + selectedFile.name.split(".").pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      setError(`File type not allowed. Accepted types: ${accept}`)
      return
    }

    setFile(selectedFile)
    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("category", name)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const data = await response.json()
        setUploadedUrl(data.url)
        onFileChange?.(selectedFile, data.url)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Upload failed")
      }
    } catch (err) {
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadedUrl(null)
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onFileChange?.(null)
  }

  const handleViewFile = () => {
    if (uploadedUrl) {
      window.open(uploadedUrl, "_blank")
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={name}>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>

      {!uploadedUrl ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={fileInputRef}
              id={name}
              name={name}
              type="file"
              accept={accept}
              required={required}
              onChange={handleFileChange}
              disabled={uploading}
              className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
            />
            <Upload className="h-4 w-4 text-muted-foreground" />
          </div>

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">Uploading... {uploadProgress}%</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{file?.name || "Uploaded file"}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={handleViewFile}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Accepted formats: {accept} • Max size: {maxSize}MB
      </p>
    </div>
  )
}
