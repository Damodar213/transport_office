import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { getSession } from "@/lib/auth"

export interface Truck {
  id: number
  supplier_id: string
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
export async function GET(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      return NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    if (!supplierId) {
      return NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    }

    // SECURITY CHECK: Ensure the logged-in user can only access their own data
    if (session.userIdString !== supplierId) {
      console.warn(`Security violation: User ${session.userIdString} attempted to access supplier ${supplierId} data`)
      return NextResponse.json({ error: "Access denied - you can only access your own data" }, { status: 403 })
    }

    // Check if database is available
    if (!getPool()) {
      console.log("No database connection available, returning empty trucks list")
      return NextResponse.json({ trucks: [] })
    }

    // Ensure trucks table exists (idempotent)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(50) NOT NULL,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        capacity_tons DECIMAL(8,2),
        number_of_wheels INTEGER,
        document_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Bring schema up-to-date (idempotent columns)
    await dbQuery("ALTER TABLE trucks ADD COLUMN IF NOT EXISTS number_of_wheels INTEGER")
    await dbQuery("ALTER TABLE trucks ADD COLUMN IF NOT EXISTS document_url TEXT")

    // Verify supplier exists
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    if (supplierResult.rows.length === 0) {
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

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

    const result = await dbQuery<Truck>(sql, [supplierId])
    return NextResponse.json({ trucks: result.rows })

  } catch (error) {
    console.error("Get trucks error:", error)
    return NextResponse.json({ error: "Failed to fetch trucks" }, { status: 500 })
  }
}

// POST - Create new truck
export async function POST(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      return NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    }

    // Check if database is available
    if (!getPool()) {
      console.log("No database connection available, cannot create truck")
      return NextResponse.json({ error: "Database not available. Please try again later." }, { status: 503 })
    }

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

    // SECURITY CHECK: Ensure the logged-in user can only create trucks for themselves
    if (session.userIdString !== body.supplierId) {
      console.warn(`Security violation: User ${session.userIdString} attempted to create truck for supplier ${body.supplierId}`)
      return NextResponse.json({ error: "Access denied - you can only create trucks for yourself" }, { status: 403 })
    }

    // Ensure trucks table exists (idempotent)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(50) NOT NULL,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        capacity_tons DECIMAL(8,2),
        number_of_wheels INTEGER,
        document_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Bring schema up-to-date (idempotent columns)
    await dbQuery("ALTER TABLE trucks ADD COLUMN IF NOT EXISTS number_of_wheels INTEGER")
    await dbQuery("ALTER TABLE trucks ADD COLUMN IF NOT EXISTS document_url TEXT")

    // Verify supplier exists
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      console.error("Supplier not found:", body.supplierId)
      return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    }

    const supplierId = body.supplierId
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
      body.vehicleNumber.toUpperCase(),
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
    
    // If there's a document URL, create a vehicle document submission for admin review
    if (body.documentUrl) {
      try {
        const now = new Date().toISOString()
        await dbQuery(
          `INSERT INTO vehicle_documents (vehicle_id, supplier_id, vehicle_number, document_type, document_url, submitted_at, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
          [result.rows[0].id, supplierId, body.vehicleNumber, 'rc', body.documentUrl, now]
        )
        console.log("Vehicle document submission created for admin review")
      } catch (docError) {
        console.error("Error creating vehicle document submission:", docError)
        // Don't fail the truck creation if document submission creation fails
      }
    }
    
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
export async function PUT(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      return NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // SECURITY CHECK: First verify the truck belongs to the logged-in supplier
    const truckCheck = await dbQuery(
      "SELECT supplier_id FROM trucks WHERE id = $1",
      [id]
    )

    if (truckCheck.rows.length === 0) {
      return NextResponse.json({ error: "Truck not found" }, { status: 404 })
    }

    if (truckCheck.rows[0].supplier_id !== session.userIdString) {
      console.warn(`Security violation: User ${session.userIdString} attempted to update truck ${id} belonging to supplier ${truckCheck.rows[0].supplier_id}`)
      return NextResponse.json({ error: "Access denied - you can only update your own trucks" }, { status: 403 })
    }

    const sql = `
      UPDATE trucks 
      SET 
        vehicle_number = $1,
        body_type = $2,
        capacity_tons = $3,
        number_of_wheels = $4,
        document_url = $5,
        updated_at = $6
      WHERE id = $7 AND supplier_id = $8
      RETURNING *
    `

    const params = [
      updateData.vehicleNumber.toUpperCase(),
      updateData.bodyType,
      updateData.capacityTons || null,
      updateData.numberOfWheels || null,
      updateData.documentUrl || null,
      new Date().toISOString(),
      id,
      session.userIdString
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
export async function DELETE(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      return NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    }

    // Ensure trucks table exists (idempotent)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        supplier_id VARCHAR(50) NOT NULL,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        capacity_tons DECIMAL(8,2),
        number_of_wheels INTEGER,
        document_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Truck ID is required" }, { status: 400 })
    }

    console.log("Deleting truck with ID:", id)

    // First check if truck exists and belongs to the logged-in supplier
    const checkResult = await dbQuery("SELECT id, vehicle_number, supplier_id FROM trucks WHERE id = $1", [id])
    
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: "Truck not found" }, { status: 404 })
    }

    // SECURITY CHECK: Ensure the truck belongs to the logged-in supplier
    if (checkResult.rows[0].supplier_id !== session.userIdString) {
      console.warn(`Security violation: User ${session.userIdString} attempted to delete truck ${id} belonging to supplier ${checkResult.rows[0].supplier_id}`)
      return NextResponse.json({ error: "Access denied - you can only delete your own trucks" }, { status: 403 })
    }

    // Perform hard delete with supplier check
    const sql = `DELETE FROM trucks WHERE id = $1 AND supplier_id = $2`
    const result = await dbQuery(sql, [id, session.userIdString])

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

