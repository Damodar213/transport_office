import { type NextRequest, NextResponse } from "next/server"
import { uploadToR2, generateFileKey, deleteFromR2, extractKeyFromUrl, getSignedDownloadUrl } from "@/lib/cloudflare-r2"

export async function POST(request: NextRequest) {
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
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "File size too large. Maximum 5MB allowed." }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and PDF files are allowed." },
        { status: 400 },
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique key for Cloudflare R2
    const key = generateFileKey(category || "general", file.name, userId)

    // Upload to Cloudflare R2
    const uploadResult = await uploadToR2(buffer, key, file.type, {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      userId: userId || "anonymous",
    })

    return NextResponse.json({
      message: "File uploaded successfully",
      url: uploadResult.url,
      key: uploadResult.key,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ 
      error: "Upload failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Handle file deletion
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const url = searchParams.get("url")

    if (!key && !url) {
      return NextResponse.json({ error: "File key or URL is required" }, { status: 400 })
    }

    const fileKey = key || (url ? extractKeyFromUrl(url) : null)
    
    if (!fileKey) {
      return NextResponse.json({ error: "Invalid file key or URL" }, { status: 400 })
    }

    await deleteFromR2(fileKey)

    return NextResponse.json({
      message: "File deleted successfully",
      key: fileKey,
    })
  } catch (error) {
    console.error("Delete error:", error)
    return NextResponse.json({ 
      error: "Delete failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// Handle signed URL generation for viewing files
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get("key")
    const url = searchParams.get("url")

    if (!key && !url) {
      return NextResponse.json({ error: "File key or URL is required" }, { status: 400 })
    }

    const fileKey = key || (url ? extractKeyFromUrl(url) : null)
    
    if (!fileKey) {
      return NextResponse.json({ error: "Invalid file key or URL" }, { status: 400 })
    }

    // Generate signed URL valid for 1 hour
    const signedUrl = await getSignedDownloadUrl(fileKey, 3600)

    return NextResponse.json({
      signedUrl,
      key: fileKey,
      expiresIn: 3600
    })
  } catch (error) {
    console.error("Signed URL generation error:", error)
    return NextResponse.json({ 
      error: "Failed to generate signed URL", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
