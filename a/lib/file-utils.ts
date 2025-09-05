export interface UploadedFile {
  url: string
  filename: string
  size: number
  type: string
}

export const uploadFile = async (file: File, category = "general"): Promise<UploadedFile> => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("category", category)

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

export const deleteFile = async (filePath: string): Promise<void> => {
  const response = await fetch(`/api/upload?path=${encodeURIComponent(filePath)}`, {
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
