export interface UploadedFile {
  url: string
  key?: string
  filename: string
  size: number
  type: string
}

export const uploadFile = async (file: File, category = "general", userId?: string): Promise<UploadedFile> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("category", category)
  if (userId) {
    formData.append("userId", userId)
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Upload failed")
  }

  return response.json()
}

export const deleteFile = async (fileKey: string): Promise<void> => {
  const response = await fetch(`/api/upload?key=${encodeURIComponent(fileKey)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Delete failed")
  }
}

export const deleteFileByUrl = async (fileUrl: string): Promise<void> => {
  const response = await fetch(`/api/upload?url=${encodeURIComponent(fileUrl)}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Delete failed")
  }
}

export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || ""
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp"]
  const extension = getFileExtension(filename)
  return imageExtensions.includes(extension)
}

export const isPDFFile = (filename: string): boolean => {
  return getFileExtension(filename) === "pdf"
}

/**
 * Check if a URL is a Cloudflare R2 URL
 */
export const isCloudflareUrl = (url: string): boolean => {
  return url.includes('r2.cloudflarestorage.com') || url.includes('cloudflare')
}

/**
 * Extract file key from Cloudflare R2 URL
 */
export const extractFileKeyFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname.substring(1) // Remove leading slash
  } catch {
    return null
  }
}

/**
 * Get file category from URL or key
 */
export const getFileCategory = (urlOrKey: string): string => {
  const key = isCloudflareUrl(urlOrKey) ? extractFileKeyFromUrl(urlOrKey) : urlOrKey
  if (!key) return 'general'
  
  const parts = key.split('/')
  return parts[0] || 'general'
}

/**
 * Get a signed URL for viewing a file
 */
export const getSignedViewUrl = async (fileUrl: string): Promise<string> => {
  const response = await fetch(`/api/upload?url=${encodeURIComponent(fileUrl)}`)
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || "Failed to generate signed URL")
  }
  
  const data = await response.json()
  return data.signedUrl
}
