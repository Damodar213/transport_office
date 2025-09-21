import { NextRequest, NextResponse } from "next/server"
import { withAuth, withDatabase, createApiResponse, createApiError } from "@/lib/api-utils"
import { dbQuery } from "@/lib/db"
import { deleteFromR2, isR2Url, extractKeyFromUrl, listR2Files } from "@/lib/cloudflare-r2"

// GET - List orphaned files (files in R2 that don't exist in database)
export async function GET(request: NextRequest) {
  return withAuth(async (session) => {
    return withDatabase(async () => {
      try {
        // Get all document URLs from all document tables
        const [supplierDocs, vehicleDocs, driverDocs] = await Promise.all([
          dbQuery(`SELECT document_url FROM supplier_documents WHERE document_url IS NOT NULL`),
          dbQuery(`SELECT document_url FROM vehicle_documents WHERE document_url IS NOT NULL`),
          dbQuery(`SELECT document_url FROM driver_documents WHERE document_url IS NOT NULL`)
        ])

        // Combine all URLs from database
        const allDbUrls = new Set([
          ...supplierDocs.rows.map(row => row.document_url),
          ...vehicleDocs.rows.map(row => row.document_url),
          ...driverDocs.rows.map(row => row.document_url)
        ])

        // List all files from R2
        const r2Files = await listR2Files()
        
        // Find orphaned files (files in R2 that are not in database)
        const orphanedFiles = r2Files.filter(file => !allDbUrls.has(file.url))
        // Find database URLs that don't exist in R2
        const missingFiles = Array.from(allDbUrls).filter(url => 
          isR2Url(url) && !r2Files.some(file => file.url === url))
        return createApiResponse({
          totalDbDocuments: allDbUrls.size,
          supplierDocuments: supplierDocs.rows.length,
          vehicleDocuments: vehicleDocs.rows.length,
          driverDocuments: driverDocs.rows.length,
          totalR2Files: r2Files.length,
          orphanedFiles: orphanedFiles.map(file => ({

}
            key: file.key,
            url: file.url,
            size: file.size,
            lastModified: file.lastModified

)
})),
          missingFiles,
          databaseUrls: Array.from(allDbUrls),
          r2Files: r2Files.map(file => ({

}
            key: file.key,
            url: file.url,
            size: file.size,
            lastModified: file.lastModified

)
})
        })
      } catch (error) {
        console.error("Error listing documents:", error)
        return createApiError("Failed to list documents", error, 500)
      }

    })
  }, ["admin"])
}

// POST - Cleanup orphaned files
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  return withAuth(async (session) => {
    return withDatabase(async () => {
      try {
        const body = await request.json()
        const { urlsToDelete } = body

        if (!urlsToDelete || !Array.isArray(urlsToDelete)) {
          return createApiError("urlsToDelete array is required", null, 400)
        }

        const results = {
          successful: [] as string[],
          failed: [] as { url: string, error: string }[],
          skipped: [] as string[]
}
        for (const url of urlsToDelete) {
          try {
            // Check if it's an R2 URL
            if (!isR2Url(url)) {
              results.skipped.push(url)
              continue
            }

            // Extract key and delete from R2
            const key = extractKeyFromUrl(url)
            await deleteFromR2(key)
            results.successful.push(url)
            console.log(`Successfully deleted orphaned file: ${key}`)
          } catch (error) {
            results.failed.push({
              url,
              error: error instanceof Error ? error.message : "Unknown error"

)
})
            console.error(`Failed to delete file ${url}:`, error)
  }
        return createApiResponse({
          ...results,
          summary: {

}
            total: urlsToDelete.length,
            successful: results.successful.length,
            failed: results.failed.length,
            skipped: results.skipped.length


})
        }, "Cleanup completed")
      } catch (error) {
        console.error("Error during cleanup:", error)
        return createApiError("Failed to cleanup files", error, 500)
      }

    })
  }, ["admin"])
}
