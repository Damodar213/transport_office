import { NextResponse } from "next/server"

export async function GET() {
  try {
    // For demo purposes, return a default supplier
    // In production, you'd get this from the authenticated session
    return NextResponse.json({
      success: true,
      user: {
        id: "anush", // Use a supplier ID that exists in your database
        companyName: "abcd",
        contactPerson: "Contact Person",
        email: "contact@abcd.com",
        mobile: "+91-9876543210",
        whatsapp: "+91-9876543210",
        role: 'supplier'
      }
    })

  } catch (error) {
    console.error("Error getting current user:", error)
    return NextResponse.json({ 
      error: "Failed to get current user",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
