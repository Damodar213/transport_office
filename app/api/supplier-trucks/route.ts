import { type NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export interface Truck {
  id: number
  supplier_id: number
  vehicle_number: string
  body_type: string
  capacity_tons?: number
  number_of_wheels?: number
  document_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// GET - Fetch trucks for a specific supplier
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
        t.id,
        t.supplier_id,
        t.vehicle_number,
        t.body_type,
        t.capacity_tons,
        t.number_of_wheels,
        t.document_url,
        t.is_active,
        t.created_at,
        t.updated_at
      FROM trucks t
      WHERE t.supplier_id = $1
      ORDER BY t.created_at DESC
    `

    const result = await dbQuery<Truck>(sql, [supplierDbId])
    return NextResponse.json({ trucks: result.rows })

  } catch (error) {
    console.error("Get trucks error:", error)
    return NextResponse.json({ error: "Failed to fetch trucks" }, { status: 500 })
  }
}

// POST - Create new truck
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Creating truck with data:", body)

    // Validate required fields
    if (!body.supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }
    if (!body.vehicleNumber) {
      return NextResponse.json({ error: "Vehicle number is required" }, { status: 400 })
    }
    if (!body.bodyType) {
      return NextResponse.json({ error: "Body type is required" }, { status: 400 })
    }

    // Get supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      console.error("Supplier not found:", body.supplierId)
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplierId = supplierResult.rows[0].user_id
    console.log("Found supplier ID:", supplierId)

    // Check if vehicle number already exists
    const existingVehicle = await dbQuery(
      "SELECT id FROM trucks WHERE vehicle_number = $1",
      [body.vehicleNumber]
    )

    if (existingVehicle.rows.length > 0) {
      console.error("Vehicle number already exists:", body.vehicleNumber)
      return NextResponse.json({ error: "Vehicle number already exists" }, { status: 409 })
    }

    const sql = `
      INSERT INTO trucks (
        supplier_id, vehicle_number, body_type, capacity_tons, number_of_wheels, document_url
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `

    const params = [
      supplierId,
      body.vehicleNumber,
      body.bodyType,
      body.capacityTons || null,
      body.numberOfWheels || null,
      body.documentUrl || null
    ]

    console.log("Executing SQL with params:", params)
    const result = await dbQuery(sql, params)
    
    if (!result.rows || result.rows.length === 0) {
      console.error("No rows returned from insert")
      return NextResponse.json({ error: "Failed to create truck - no data returned" }, { status: 500 })
    }

    console.log("Truck created successfully:", result.rows[0])
    return NextResponse.json({ 
      message: "Truck created successfully", 
      truck: result.rows[0] 
    }, { status: 201 })

  } catch (error) {
    console.error("Create truck error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json({ 
      error: "Failed to create truck", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}

// PUT - Update truck
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    const sql = `
      UPDATE trucks 
      SET 
        vehicle_number = $1,
        body_type = $2,
        capacity_tons = $3,
        number_of_wheels = $4,
        document_url = $5,
        updated_at = $6
      WHERE id = $7
      RETURNING *
    `

    const params = [
      updateData.vehicleNumber,
      updateData.bodyType,
      updateData.capacityTons || null,
      updateData.numberOfWheels || null,
      updateData.documentUrl || null,
      new Date().toISOString(),
      id
    ]

    const result = await dbQuery(sql, params)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Truck not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      message: "Truck updated successfully", 
      truck: result.rows[0] 
    })

  } catch (error) {
    console.error("Update truck error:", error)
    return NextResponse.json({ error: "Failed to update truck" }, { status: 500 })
  }
}

// DELETE - Delete truck (hard delete - completely remove from database)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Truck ID is required" }, { status: 400 })
    }

    console.log("Deleting truck with ID:", id)

    // First check if truck exists
    const checkResult = await dbQuery("SELECT id, vehicle_number FROM trucks WHERE id = $1", [id])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Truck not found" }, { status: 404 })
    }

    // Perform hard delete
    const sql = `DELETE FROM trucks WHERE id = $1`
    const result = await dbQuery(sql, [id])

    console.log("Truck deleted successfully:", checkResult.rows[0].vehicle_number)
    
    return NextResponse.json({ 
      message: "Truck deleted successfully",
      deletedTruck: checkResult.rows[0]
    })

  } catch (error) {
    console.error("Delete truck error:", error)
    return NextResponse.json({ error: "Failed to delete truck", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

