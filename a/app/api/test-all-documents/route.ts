import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Get counts for all document types
    const [supplierCount, vehicleCount, driverCount] = await Promise.all([
      dbQuery("SELECT COUNT(*) as count FROM supplier_documents"),
      dbQuery("SELECT COUNT(*) as count FROM vehicle_documents"),
      dbQuery("SELECT COUNT(*) as count FROM driver_documents")
    ])

    // Get sample documents from each table
    const [supplierDocs, vehicleDocs, driverDocs] = await Promise.all([
      dbQuery("SELECT id, user_id, document_type, status FROM supplier_documents ORDER BY submitted_at DESC LIMIT 3"),
      dbQuery("SELECT id, vehicle_id, supplier_id, vehicle_number, document_type, status FROM vehicle_documents ORDER BY submitted_at DESC LIMIT 3"),
      dbQuery("SELECT id, driver_id, supplier_id, driver_name, document_type, status FROM driver_documents ORDER BY submitted_at DESC LIMIT 3")
    ])

    const response = NextResponse.json({
      success: true,
      counts: {
        supplierDocuments: parseInt(supplierCount.rows[0].count)    
    ,
        vehicleDocuments: parseInt(vehicleCount.rows[0].count),
        driverDocuments: parseInt(driverCount.rows[0].count)
      },
      samples: {



      }

      }

      }

        supplierDocuments: supplierDocs.rows,
        vehicleDocuments: vehicleDocs.rows,
        driverDocuments: driverDocs.rows



        }

        }

        }

      },
      message: "All document types checked successfully"



      }

      }

      }

  } catch (error) {
    console.error("All documents test error:", error)
    const response = NextResponse.json({ 
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }
