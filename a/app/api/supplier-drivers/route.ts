import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"

export interface Driver {
  id: number
  supplier_id: number
  driver_name: string
  mobile: string
  license_document_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// GET - Fetch drivers for a specific supplier
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    if (!supplierId) {
      const response = NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    return addCorsHeaders(response)
    }

    // Get supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    if (supplierResult.rows.length === 0) {
      const response = NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    return addCorsHeaders(response)
    }

    const supplierDbId = supplierResult.rows[0].user_id

    const sql = `
      SELECT 
        d.id,
        d.supplier_id,
        d.driver_name,
        d.mobile,
        d.license_document_url,
        d.is_active,
        d.created_at,
        d.updated_at
      FROM drivers d
      WHERE d.supplier_id = $1
      ORDER BY d.created_at DESC
    `

    const result = await dbQuery<Driver>(sql, [supplierDbId])
    const response = NextResponse.json({ drivers: result.rows })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Get drivers error:", error)
    const response = NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// POST - Create new driver
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const body = await request.json()
    console.log("Received driver data:", body)

    // Get supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      const response = NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    return addCorsHeaders(response)
    }

    const supplierId = supplierResult.rows[0].user_id
    console.log("Found supplier ID:", supplierId)

    const sql = `
      INSERT INTO drivers (
        supplier_id, driver_name, mobile, 
        license_document_url
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const params = [
      supplierId,
      body.driverName,
      body.mobile,
      body.licenseDocumentUrl || null
    ]

    console.log("SQL params:", params)

    const result = await dbQuery(sql, params)
    console.log("Driver created successfully:", result.rows[0])
    
    // If there's a license document URL, create a driver document submission for admin review
    if (body.licenseDocumentUrl) {
      try {
        const now = new Date().toISOString()
        await dbQuery(
          `INSERT INTO driver_documents (driver_id, supplier_id, driver_name, document_type, document_url, submitted_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [result.rows[0].id, supplierId, body.driverName, 'license', body.licenseDocumentUrl, now]
        )
        console.log("Driver document submission created for admin review")
      } catch (docError) {
        console.error("Error creating driver document submission:", docError)
        // Don't fail the driver creation if document submission creation fails
      }
    }
    
    const response = NextResponse.json({ 
      message: "Driver created successfully", 
      driver: result.rows[0] 
    }, { status: 201 })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Create driver error:", error)
    const response = NextResponse.json({ error: "Failed to create driver", details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// PUT - Update driver
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    console.log("Received update data:", body)
    
    const { id, ...updateData } = body

    const sql = `
      UPDATE drivers 
      SET 
        driver_name = $1,
        mobile = $2,
        license_document_url = $3,
        updated_at = $4
      WHERE id = $5
      RETURNING *
    `

    const params = [
      updateData.driverName,
      updateData.mobile,
      updateData.licenseDocumentUrl || null,
      new Date().toISOString(),
      id
    ]

    console.log("Update SQL params:", params)

    const result = await dbQuery(sql, params)

    if (result.rows.length === 0) {
      const response = NextResponse.json({ error: "Driver not found" }, { status: 404 })
    return addCorsHeaders(response)
    }

    console.log("Driver updated successfully:", result.rows[0])
    
    // If there's a new license document URL, create a driver document submission for admin review
    if (updateData.licenseDocumentUrl && updateData.licenseDocumentUrl !== result.rows[0].license_document_url) {
      try {
        const now = new Date().toISOString()
        await dbQuery(
          `INSERT INTO driver_documents (driver_id, supplier_id, driver_name, document_type, document_url, submitted_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [id, result.rows[0].supplier_id, updateData.driverName, 'license', updateData.licenseDocumentUrl, now]
        )
        console.log("Driver document submission created for admin review")
      } catch (docError) {
        console.error("Error creating driver document submission:", docError)
        // Don't fail the driver update if document submission creation fails
      }
    }
    
    const response = NextResponse.json({ 
      message: "Driver updated successfully", 
      driver: result.rows[0] 
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Update driver error:", error)
    const response = NextResponse.json({ error: "Failed to update driver", details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" }, { status: 500 })
    return addCorsHeaders(response)
  }
}

// DELETE - Delete driver (hard delete - completely remove from database)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      const response = NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    return addCorsHeaders(response)
    }

    console.log("Deleting driver with ID:", id)

    // First check if driver exists
    const checkResult = await dbQuery("SELECT id, driver_name FROM drivers WHERE id = $1", [id])
    console.log("Driver check result:", checkResult.rows)
    
    if (checkResult.rows.length === 0) {
      console.log("Driver not found in database")
      const response = NextResponse.json({ error: "Driver not found" }, { status: 404 })
    return addCorsHeaders(response)
    }

    console.log("Driver found:", checkResult.rows[0])

    // Check for foreign key references before deleting
    try {
      // Check if driver is referenced in confirmed_orders table (this table has driver_id)
      try {
        console.log("Checking confirmed_orders for driver_id:", id)
        const confirmedOrdersCheck = await dbQuery(
          "SELECT COUNT(*) as count FROM confirmed_orders WHERE driver_id = $1",
          [id]
        )
        console.log("Confirmed orders check result:", confirmedOrdersCheck.rows[0])
        
        if (parseInt(confirmedOrdersCheck.rows[0].count) > 0) {
          console.log("Driver has confirmed orders, blocking deletion")
          const response = NextResponse.json({ 
            error: "Cannot delete driver. Driver is assigned to confirmed orders. Please reassign or complete the orders first.",
            details: "Driver has active orders"
          }, { status: 400 })
    return addCorsHeaders(response)
        }
      } catch (error) {
        console.log("confirmed_orders check skipped:", error)
      }

      // Check if driver is referenced in suppliers_vehicle_location table (this table has driver_id)
      try {
        console.log("Checking suppliers_vehicle_location for driver_id:", id)
        const vehicleLocationCheck = await dbQuery(
          "SELECT COUNT(*) as count FROM suppliers_vehicle_location WHERE driver_id = $1",
          [id]
        )
        console.log("Vehicle location check result:", vehicleLocationCheck.rows[0])
        
        if (parseInt(vehicleLocationCheck.rows[0].count) > 0) {
          console.log("Driver has vehicle location requests, blocking deletion")
          const response = NextResponse.json({ 
            error: "Cannot delete driver. Driver is assigned to vehicle location requests. Please reassign or complete the requests first.",
            details: "Driver has active vehicle location requests"
          }, { status: 400 })
    return addCorsHeaders(response)
        }
      } catch (error) {
        console.log("suppliers_vehicle_location check skipped:", error)
      }

    } catch (constraintError) {
      console.log("Foreign key constraint check failed:", constraintError)
      // Continue with deletion if constraint check fails
    }

    // Perform hard delete with retry mechanism
    const sql = `DELETE FROM drivers WHERE id = $1`
    console.log("Attempting to delete driver with SQL:", sql, "and ID:", id)
    let result
    let retryCount = 0
    const maxRetries = 3

    while (retryCount < maxRetries) {
      try {
        console.log(`Delete attempt ${retryCount + 1} for driver ID: ${id}`)
        result = await dbQuery(sql, [id])
        console.log("Delete query result:", result)
        break // Success, exit retry loop
      } catch (error) {
        retryCount++
        console.log(`Delete attempt ${retryCount} failed:`, error)
        
        if (retryCount >= maxRetries) {
          console.log("All delete attempts failed, throwing error")
          throw error // Re-throw if all retries failed
        }
        
        // Wait before retry (exponential backoff)
        console.log(`Waiting ${1000 * retryCount}ms before retry...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
      }
    }

    console.log("Driver deleted successfully:", checkResult.rows[0].driver_name)
    
    const response = NextResponse.json({ 
      message: "Driver deleted successfully",
      deletedDriver: checkResult.rows[0]
    })
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Delete driver error:", error)
    
    // Check if it's a database connection error
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    if (error instanceof Error && (
      errorMessage.includes('connection') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('Connection terminated')
    )) {
      const response = NextResponse.json({ 
        error: "Database connection error. Please try again.",
        details: "Connection timeout or database unavailable"
      }, { status: 503 })
    return addCorsHeaders(response)
    }
    
    // Check if it's a foreign key constraint violation
    if (error instanceof Error && error instanceof Error ? error.message : "Unknown error".includes('violates foreign key constraint')) {
      const response = NextResponse.json({ 
        error: "Cannot delete driver. Driver is referenced by other records in the system.",
        details: "Foreign key constraint violation"
      }, { status: 400 })
    return addCorsHeaders(response)
    }
    
    const response = NextResponse.json({ 
      error: "Failed to delete driver", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
    return addCorsHeaders(response)
  }
}

