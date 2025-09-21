import { type NextRequest, NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"

// GET - Get order statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const role = searchParams.get("role")

    // Mock statistics - replace with actual database queries
    const mockStats = {
      total: 156,
      pending: 23,
      confirmed: 45,
      inTransit: 12,
      delivered: 76,
      cancelled: 0,
      totalRevenue: 2450000,
      avgDeliveryTime: 2.3,
      completionRate: 98.7,
    }

    // Filter stats based on user role and ID
    if (role === "supplier" && userId) {
      const response = NextResponse.json({
        ...mockStats,
        total: 45,
        pending: 8,
        confirmed: 15,
        inTransit: 5,
        delivered: 17,
    }

    if (role === "buyer" && userId) {
      const response = NextResponse.json({
        ...mockStats,
        total: 32,
        pending: 5,
        confirmed: 12,
        inTransit: 3,
        delivered: 12,
    }

    console.error("Statistics error:", error)
  }
}
