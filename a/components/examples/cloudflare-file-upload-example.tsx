"use client"

import { useState } from "react"
import { FileUpload } from "@/components/ui/file-upload"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

/**
 * Example component showing how to use FileUpload with Cloudflare R2
 * This demonstrates the integration for document uploads like Aadhaar, RC, etc.
 */
export function CloudflareFileUploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({})
  const [userId] = useState("example-user-123") // In real app, get from auth context

  const handleFileChange = (file: File | null, url?: string, documentType?: string) => {
    if (file && url && documentType) {
      setUploadedFiles(prev => ({
        ...prev,
        [documentType]: url
      }))
    }
  }

  const handleSubmit = async () => {
    // Example of how to submit the form with uploaded file URLs
    const formData = {
      userId,
      documents: uploadedFiles,
      // ... other form data
    }
    
    console.log("Submitting form with files:", formData)
    
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        console.log("Form submitted successfully")
      } else {
        console.error("Form submission failed")
      }
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Upload Example</CardTitle>
          <CardDescription>
            This example shows how to use the FileUpload component with Cloudflare R2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              Files will be uploaded to Cloudflare R2 and organized by user ID and document type.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="Aadhaar Card"
              name="aadhaar"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              userId={userId}
              onFileChange={(file, url) => handleFileChange(file, url, "aadhaar")}
            />

            <FileUpload
              label="PAN Card"
              name="pan"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              userId={userId}
              onFileChange={(file, url) => handleFileChange(file, url, "pan")}
            />

            <FileUpload
              label="RC Document"
              name="rc"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              userId={userId}
              onFileChange={(file, url) => handleFileChange(file, url, "rc")}
            />

            <FileUpload
              label="Insurance Document"
              name="insurance"
              accept=".pdf,.jpg,.jpeg,.png"
              required
              userId={userId}
              onFileChange={(file, url) => handleFileChange(file, url, "insurance")}
            />
          </div>

          {Object.keys(uploadedFiles).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Uploaded Files:</h4>
              <div className="space-y-1">
                {Object.entries(uploadedFiles).map(([type, url]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="capitalize">{type}</span>
                    <a 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm"
                    >
                      View File
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full">
            Submit Documents
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">File Organization in Cloudflare R2:</h4>
            <code className="block p-2 bg-muted rounded text-sm">
              {`your-bucket/
├── aadhaar/
│   └── ${userId}/
│       └── 1703123456789_aadhaar.pdf
├── pan/
│   └── ${userId}/
│       └── 1703123456790_pan.pdf
└── rc/
    └── ${userId}/
        └── 1703123456791_rc.pdf`}
            </code>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Environment Variables Required:</h4>
            <ul className="text-sm space-y-1">
              <li>• CLOUDFLARE_ACCOUNT_ID</li>
              <li>• CLOUDFLARE_ACCESS_KEY_ID</li>
              <li>• CLOUDFLARE_SECRET_ACCESS_KEY</li>
              <li>• CLOUDFLARE_R2_BUCKET_NAME</li>
              <li>• CLOUDFLARE_R2_PUBLIC_URL</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Features:</h4>
            <ul className="text-sm space-y-1">
              <li>• Automatic file validation (type, size)</li>
              <li>• Progress indicators during upload</li>
              <li>• Organized file structure by user and type</li>
              <li>• Secure file access with signed URLs</li>
              <li>• Easy file deletion and management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

