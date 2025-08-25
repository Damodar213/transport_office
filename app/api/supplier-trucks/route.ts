import { type NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export interface Truck {
  id: number
  supplier_id: number
  vehicle_number: string
  body_type: string
  capacity_tons?: number
  fuel_type?: string
  registration_number?: string
  insurance_expiry?: string
  fitness_expiry?: string
  permit_expiry?: string
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
        t.fuel_type,
        t.registration_number,
        t.insurance_expiry,
        t.fitness_expiry,
        t.permit_expiry,
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

    // Get supplier user_id from suppliers table
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplierId = supplierResult.rows[0].user_id

    const sql = `
      INSERT INTO trucks (
        supplier_id, vehicle_number, body_type, capacity_tons,
        fuel_type, registration_number, insurance_expiry, 
        fitness_expiry, permit_expiry
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `

    const params = [
      supplierId,
      body.vehicleNumber,
      body.bodyType,
      body.capacityTons || null,
      body.fuelType || null,
      body.registrationNumber || null,
      body.insuranceExpiry || null,
      body.fitnessExpiry || null,
      body.permitExpiry || null
    ]

    const result = await dbQuery(sql, params)
    return NextResponse.json({ 
      message: "Truck created successfully", 
      truck: result.rows[0] 
    }, { status: 201 })

  } catch (error) {
    console.error("Create truck error:", error)
    return NextResponse.json({ error: "Failed to create truck" }, { status: 500 })
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
        fuel_type = $4,
        registration_number = $5,
        insurance_expiry = $6,
        fitness_expiry = $7,
        permit_expiry = $8,
        updated_at = $9
      WHERE id = $10
      RETURNING *
    `

    const params = [
      updateData.vehicleNumber,
      updateData.bodyType,
      updateData.capacityTons || null,
      updateData.fuelType || null,
      updateData.registrationNumber || null,
      updateData.insuranceExpiry || null,
      updateData.fitnessExpiry || null,
      updateData.permitExpiry || null,
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

