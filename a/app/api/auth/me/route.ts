import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { getSession } from "@/lib/auth"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    // Get the current authenticated session
    const session = await getSession()
    
    if (!session) {
      const response = NextResponse.json({ 
        error: "Not authenticated"})
    return addCorsHeaders(response)
  }

    // Get additional user details from database
    let userDetails = {
      id: session.userIdString,
      role: session.role,
      email: session.email,
      name: session.name,
      companyName: session.companyName



      }

      }

      }

    }

    // If user is a supplier, get supplier-specific details
    if (session.role === 'supplier') {
      try {
        const supplierResult = await dbQuery(
          "SELECT company_name, gst_number, number_of_vehicles FROM suppliers WHERE user_id = $1",
          [session.userIdString]
        )
        
        if (supplierResult.rows.length > 0) {
          const supplier = supplierResult.rows[0]
          userDetails = {
            ...userDetails,
            companyName: supplier.company_name || userDetails.companyName,
            gstNumber: supplier.gst_number,
            numberOfVehicles: supplier.number_of_vehicles



            }

            }

            }

          } as any
        }

      } catch (error) {
        console.error("Error fetching supplier details:", error)
        // Continue with basic user details if supplier lookup fails
      }

    }

    // If user is a buyer, get buyer-specific details
    if (session.role === 'buyer') {
      try {
        const buyerResult = await dbQuery(
          "SELECT company_name, gst_number FROM buyers WHERE user_id = $1",
          [session.userIdString]
        )
        
        if (buyerResult.rows.length > 0) {
          const buyer = buyerResult.rows[0]
          userDetails = {
            ...userDetails,
            companyName: buyer.company_name || userDetails.companyName,
            gstNumber: buyer.gst_number



            }

            }

            }

          } as any
        }

      } catch (error) {
        console.error("Error fetching buyer details:", error)
        // Continue with basic user details if buyer lookup fails
      }

    }

    const response = NextResponse.json({
      success: true,
      user: userDetails})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error getting current user:", error)
    const response = NextResponse.json({ 
      error: "Failed to get current user",
      message: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }
