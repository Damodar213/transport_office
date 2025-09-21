import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { uploadToR2, generateFileKey, deleteFromR2, extractKeyFromUrl, getSignedDownloadUrl } from "@/lib/cloudflare-r2"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// Fallback function for local file storage when Cloudflare R2 is not configured
async function uploadToLocal(file: Buffer, key: string, contentType: string): Promise<{ url: string; key: string; size: number; type: string }> {
  const uploadDir = join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })
  
  const filePath = join(uploadDir, key)
  await writeFile(filePath, file)
  
  const url = `/uploads/${key}`
  return {
    url,
    key,
    size: file.length,
    type: contentType



    }

    }

    }

  }

}

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = formData.get("category") as string
    const userId = formData.get("userId") as string

    console.log("Upload request received:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      category,
      userId
    })

    if (!file) {
      console.log("No file provided in request")
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      const response = NextResponse.json(
        { status: 400 },
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique key for file storage
    const key = generateFileKey(category || "general", file.name, userId)

    // Try to upload to Cloudflare R2, fallback to local storage if not configured
    let uploadResult
    try {
      uploadResult = await uploadToR2(buffer, key, file.type, {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        userId: userId || "anonymous",
      })
      console.log("File uploaded to Cloudflare R2 successfully")
    } catch (r2Error) {
      console.log("Cloudflare R2 not configured, falling back to local storage:", r2Error)
      uploadResult = await uploadToLocal(buffer, key, file.type)
      console.log("File uploaded to local storage successfully")
    }

    // If this is a vehicle or driver document, create a document submission for admin review
    if (category === 'vehicle-documents' || category === 'drivers') {
      try {
        const { dbQuery } = await import('@/lib/db')
        const now = new Date().toISOString()
        
        if (category === 'vehicle-documents') {
          // For vehicle documents, we need to get the vehicle info
          // This will be handled by the truck-information component after upload
          console.log("Vehicle document uploaded, will be processed by truck component")
        } else if (category === 'drivers') {
          // For driver documents, we need the driver ID
          const driverId = formData.get("driverId") as string
          console.log("Processing driver document upload for driver ID:", driverId)
          
          if (driverId) {
            try {
              // Get driver info from database
              const driverResult = await dbQuery(
                `SELECT d.supplier_id, d.driver_name, u.name as supplier_name, u.company_name 
                 FROM drivers d 
                 LEFT JOIN users u ON d.supplier_id = u.user_id 
                 WHERE d.id = $1`,
                [driverId]
              )
              
              console.log("Driver query result:", driverResult.rows)
              
              if (driverResult.rows.length > 0) {
                const driver = driverResult.rows[0]
                console.log("Found driver:", driver)
                
                await dbQuery(
                  `INSERT INTO driver_documents (driver_id, supplier_id, driver_name, document_type, document_url, submitted_at, status)
                   VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
                  [driverId, driver.supplier_id, driver.driver_name, 'license', uploadResult.url, now]
                )
                console.log("Driver document submission created for admin review")
              } else {
                console.error("Driver not found in database with ID:", driverId)
              }

            } catch (driverDocError) {
              console.error("Error creating driver document submission:", driverDocError)
            }

          } else {
            console.error("No driver ID provided in form data")
          }

        }

      } catch (docError) {
        console.error("Error creating document submission:", docError)
        // Don't fail the upload if document submission creation fails
      }

    }

    const response = NextResponse.json({
      message: "File uploaded successfully",
      url: uploadResult.url,
      key: uploadResult.key,
      filename: file.name,
      size: file.size,
      type: file.type,})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Upload error:", error)
    const response = NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error"
 
 
 
      }

      }

      }

  })
    return addCorsHeaders(response)
  }

// Handle file deletion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const url = searchParams.get("url")

    if (!key && !url) {
    }

    const fileKey = key || (url ? extractKeyFromUrl(url) : null)
    
    if (!fileKey) {
    }

    await deleteFromR2(fileKey)

    const response = NextResponse.json({
      message: "File deleted successfully",
      key: fileKey,})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Delete error:", error)
    const response = NextResponse.json({ 
      error: "Delete failed", 
      details: error instanceof Error ? error.message : "Unknown error"
 
 
 
      }

      }

      }

  })
    return addCorsHeaders(response)
  }

// Handle signed URL generation for viewing files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const url = searchParams.get("url")

    if (!key && !url) {
    }

    const fileKey = key || (url ? extractKeyFromUrl(url) : null)
    
    if (!fileKey) {
    }

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedDownloadUrl(fileKey, 3600)

    const response = NextResponse.json({
      signedUrl,
      key: fileKey,
      expiresIn: 3600})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Signed URL generation error:", error)
    const response = NextResponse.json({ 
      error: "Failed to generate signed URL", 
      details: error instanceof Error ? error.message : "Unknown error"
 
 
 
      }

      }

      }

  })
    return addCorsHeaders(response)
  }
