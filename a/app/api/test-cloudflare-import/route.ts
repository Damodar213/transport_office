import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

export async function GET() {
  try {
    console.log("=== TESTING CLOUDFLARE IMPORT ===")
    
    // Test Cloudflare import
    try {
      const cloudflareModule = await import("@/lib/cloudflare-r2")
      console.log("Cloudflare module imported successfully")
      console.log("Available exports:", Object.keys(cloudflareModule))
      
      const response = NextResponse.json({
        success: true,
        message: "Cloudflare import successful",
        exports: Object.keys(cloudflareModule)
    
      })
    } catch (importError) {
      console.error("Cloudflare import error:", importError)
      const response = NextResponse.json({ 
        success: false,
        error: "Cloudflare import failed",
        details: importError instanceof Error ? importError.message : "Unknown error",
        stack: importError instanceof Error ? importError.stack : undefined
      }, { status: 500 })
    }

  } catch (error) {
    console.error("Cloudflare import test error:", error)
    const response = NextResponse.json({ 
      error: "Cloudflare import test failed",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}


