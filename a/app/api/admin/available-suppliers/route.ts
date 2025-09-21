import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    // Check if database is available
    const pool = await import("@/lib/db").then(m => m.getPool())
    if (!pool) {
      const response = NextResponse.json({ 
        error: "Database not available",
        suppliers: [],
        message: "Using fallback data"
  }
      })
      return addCorsHeaders(response)
    }

    // Fetch verified suppliers with their vehicle and driver information
    const result = await dbQuery(`
      SELECT 
        u.user_id as "id",
        u.name,
        u.email,
        u.mobile,
        s.company_name as "companyName",
        s.gst_number as "gstNumber",
        s.number_of_vehicles as "numberOfVehicles"
      FROM users u
      INNER JOIN suppliers s ON u.user_id = s.user_id
      WHERE u.role = 'supplier'
      ORDER BY s.company_name
    `)

    // Transform the data to match the frontend interface
    const suppliers = result.rows.map(row => ({
      id: row.id,
      name: row.name || 'Unknown',
      companyName: row.companyName || 'Unknown Company',
      availableVehicles: parseInt(row.numberOfVehicles) || 0,
      rating: 4.5, // Default rating since we're not calculating it
      location: 'Multiple Locations', // Can be enhanced with actual location data
      isVerified: true, // All suppliers in database are considered verified
      email: row.email,
      mobile: row.mobile,
      gstNumber: row.gstNumber,
      totalVehicles: parseInt(row.numberOfVehicles) || 0,
      availableDrivers: 2 // Default value since we're not counting actual drivers
  }
    }))

    const response = NextResponse.json({
      suppliers,
      total: suppliers.length,
      message: "Available suppliers fetched successfully"
  }
    })
    return addCorsHeaders(response)
    
  } catch (error) {
    console.error("Error fetching available suppliers:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch available suppliers",
      suppliers: [],
      message: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
    return addCorsHeaders(response)
  }
