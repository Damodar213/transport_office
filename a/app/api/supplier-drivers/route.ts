import { type NextRequest, NextResponse } from "next/server"
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
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }

    // Get supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
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
    return NextResponse.json({ drivers: result.rows })

  } catch (error) {
    console.error("Get drivers error:", error)
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
  }
}

// POST - Create new driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Received driver data:", body)

    // Get supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
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
    
    return NextResponse.json({ 
      message: "Driver created successfully", 
      driver: result.rows[0] 
    }, { status: 201 })

  } catch (error) {
    console.error("Create driver error:", error)
    return NextResponse.json({ error: "Failed to create driver", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// PUT - Update driver
export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    console.log("Driver updated successfully:", result.rows[0])
    return NextResponse.json({ 
      message: "Driver updated successfully", 
      driver: result.rows[0] 
    })

  } catch (error) {
    console.error("Update driver error:", error)
    return NextResponse.json({ error: "Failed to update driver", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// DELETE - Delete driver (hard delete - completely remove from database)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    console.log("Deleting driver with ID:", id)

    // First check if driver exists
    const checkResult = await dbQuery("SELECT id, driver_name FROM drivers WHERE id = $1", [id])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Check for foreign key references before deleting
    try {
      // Check if driver is referenced in confirmed_orders table
      const confirmedOrdersCheck = await dbQuery(
        "SELECT COUNT(*) as count FROM confirmed_orders WHERE driver_id = $1",
        [id]
      )
      
      if (parseInt(confirmedOrdersCheck.rows[0].count) > 0) {
        return NextResponse.json({ 
          error: "Cannot delete driver. Driver is assigned to confirmed orders. Please reassign or complete the orders first.",
          details: "Driver has active orders"
        }, { status: 400 })
      }

      // Check if driver is referenced in transport_orders table (if it exists)
      try {
        const transportOrdersCheck = await dbQuery(
          "SELECT COUNT(*) as count FROM transport_orders WHERE driver_id = $1",
          [id]
        )
        
        if (parseInt(transportOrdersCheck.rows[0].count) > 0) {
          return NextResponse.json({ 
            error: "Cannot delete driver. Driver is assigned to transport orders. Please reassign or complete the orders first.",
            details: "Driver has active transport orders"
          }, { status: 400 })
        }
      } catch (error) {
        // transport_orders table might not exist or might not have driver_id column
        console.log("transport_orders check skipped:", error)
      }

      // Check if driver is referenced in buyer_requests table
      try {
        const buyerRequestsCheck = await dbQuery(
          "SELECT COUNT(*) as count FROM buyer_requests WHERE driver_id = $1",
          [id]
        )
        
        if (parseInt(buyerRequestsCheck.rows[0].count) > 0) {
          return NextResponse.json({ 
            error: "Cannot delete driver. Driver is assigned to buyer requests. Please reassign or complete the requests first.",
            details: "Driver has active buyer requests"
          }, { status: 400 })
        }
      } catch (error) {
        console.log("buyer_requests check skipped:", error)
      }

      // Check if driver is referenced in suppliers_vehicle_location table
      try {
        const vehicleLocationCheck = await dbQuery(
          "SELECT COUNT(*) as count FROM suppliers_vehicle_location WHERE driver_id = $1",
          [id]
        )
        
        if (parseInt(vehicleLocationCheck.rows[0].count) > 0) {
          return NextResponse.json({ 
            error: "Cannot delete driver. Driver is assigned to vehicle location requests. Please reassign or complete the requests first.",
            details: "Driver has active vehicle location requests"
          }, { status: 400 })
        }
      } catch (error) {
        console.log("suppliers_vehicle_location check skipped:", error)
      }

    } catch (constraintError) {
      console.log("Foreign key constraint check failed:", constraintError)
      // Continue with deletion if constraint check fails
    }

    // Perform hard delete
    const sql = `DELETE FROM drivers WHERE id = $1`
    const result = await dbQuery(sql, [id])

    console.log("Driver deleted successfully:", checkResult.rows[0].driver_name)
    
    return NextResponse.json({ 
      message: "Driver deleted successfully",
      deletedDriver: checkResult.rows[0]
    })

  } catch (error) {
    console.error("Delete driver error:", error)
    
    // Check if it's a foreign key constraint violation
    if (error instanceof Error && error.message.includes('violates foreign key constraint')) {
      return NextResponse.json({ 
        error: "Cannot delete driver. Driver is referenced by other records in the system.",
        details: "Foreign key constraint violation"
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: "Failed to delete driver", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

