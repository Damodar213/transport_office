import { type NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export interface Driver {
  id: number
  supplier_id: number
  driver_name: string
  mobile: string
  license_number: string
  license_document_url?: string
  aadhaar_number?: string
  experience_years?: number
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
        d.license_number,
        d.license_document_url,
        d.aadhaar_number,
        d.experience_years,
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
        supplier_id, driver_name, mobile, license_number, 
        license_document_url, aadhaar_number, experience_years
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const params = [
      supplierId,
      body.driverName,
      body.mobile,
      body.licenseNumber,
      body.licenseDocumentUrl || null,
      body.aadhaarNumber || null,
      body.experienceYears || null
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
        license_number = $3,
        license_document_url = $4,
        aadhaar_number = $5,
        experience_years = $6,
        updated_at = $7
      WHERE id = $8
      RETURNING *
    `

    const params = [
      updateData.driverName,
      updateData.mobile,
      updateData.licenseNumber,
      updateData.licenseDocumentUrl || null,
      updateData.aadhaarNumber || null,
      updateData.experienceYears || null,
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
    return NextResponse.json({ error: "Failed to delete driver", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

