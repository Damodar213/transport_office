import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: NextRequest) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("=== TESTING FORMDATA ALTERNATIVE ===")
    
    // Try different approaches to handle form data
    console.log("Content-Type:", request.headers.get("content-type"))
    
    // Approach 1: Try to get as array buffer
    console.log("Attempting to get as array buffer...")
    const arrayBuffer = await request.arrayBuffer()
    console.log("Array buffer size:", arrayBuffer.byteLength)
    
    // Approach 2: Try to get as blob
    console.log("Attempting to get as blob...")
    const blob = await request.blob()
    console.log("Blob size:", blob.size)
    console.log("Blob type:", blob.type)
    
    // Approach 3: Try to get as stream
    console.log("Attempting to get as stream...")
    const stream = request.body
    console.log("Stream available:", !!stream)
    
    // Approach 4: Try formData with error handling
    console.log("Attempting formData with try-catch...")
    try {
      const formData = await request.formData()
      console.log("FormData success!")
      const entries = Array.from(formData.entries())
      console.log("FormData entries:", entries)
    } catch (formDataError) {
      console.error("FormData error:", formDataError)
    }

    const response = NextResponse.json({
      success: true,
      message: "Form data alternative test completed",
      results: {



      }

      }

      }

        arrayBufferSize: arrayBuffer.byteLength,
        blobSize: blob.size,
        blobType: blob.type,
        streamAvailable: !!stream



        }

        }

        }

      })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("=== FORMDATA ALTERNATIVE ERROR ===", error)
    const response = NextResponse.json({ 
      error: "Form data alternative test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined



      }

      }

      }

  })
    return addCorsHeaders(response)
  }
