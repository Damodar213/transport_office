import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"
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
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      const response = NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get("supplierId")

    if (!supplierId) {
      const response = NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // SECURITY CHECK: Ensure the logged-in user can only access their own data
    if (session.userIdString !== supplierId) {
      console.warn(`Security violation: User ${session.userIdString} attempted to access supplier ${supplierId} data`)
      const response = NextResponse.json({ error: "Access denied - you can only access your own data" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Verify supplier exists
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [supplierId]
    )

    if (supplierResult.rows.length === 0) {
      const response = NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
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
    const response = NextResponse.json({ trucks: result.rows })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Get trucks error:", error)
    const response = NextResponse.json({ error: "Failed to fetch trucks" }, { status: 500 })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

// POST - Create new truck
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      const response = NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const body = await request.json()
    console.log("Creating truck with data:", body)

    // Validate required fields
    if (!body.supplierId) {
      const response = NextResponse.json({ error: "Supplier ID is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    if (!body.vehicleNumber) {
      const response = NextResponse.json({ error: "Vehicle number is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }
    if (!body.bodyType) {
      const response = NextResponse.json({ error: "Body type is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // SECURITY CHECK: Ensure the logged-in user can only create trucks for themselves
    if (session.userIdString !== body.supplierId) {
      console.warn(`Security violation: User ${session.userIdString} attempted to create truck for supplier ${body.supplierId}`)
      const response = NextResponse.json({ error: "Access denied - you can only create trucks for yourself" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Verify supplier exists
    const supplierResult = await dbQuery(
      "SELECT user_id FROM suppliers WHERE user_id = $1",
      [body.supplierId]
    )

    if (supplierResult.rows.length === 0) {
      console.error("Supplier not found:", body.supplierId)
      const response = NextResponse.json({ error: "Supplier not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
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
      const response = NextResponse.json({ error: "Vehicle number already exists" }, { status: 409 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
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
      const response = NextResponse.json({ error: "Failed to create truck - no data returned" }, { status: 500 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
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
    
    const response = NextResponse.json({ 
      message: "Truck created successfully", 
      truck: result.rows[0] 
    }, { status: 201 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Create truck error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    })
    const response = NextResponse.json({ 
      error: "Failed to create truck", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

// PUT - Update truck
export async function PUT(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      const response = NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const body = await request.json()
    const { id, ...updateData } = body

    // SECURITY CHECK: First verify the truck belongs to the logged-in supplier
    const truckCheck = await dbQuery(
      "SELECT supplier_id FROM trucks WHERE id = $1",
      [id]
    )

    if (truckCheck.rows.length === 0) {
      const response = NextResponse.json({ error: "Truck not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    if (truckCheck.rows[0].supplier_id !== session.userIdString) {
      console.warn(`Security violation: User ${session.userIdString} attempted to update truck ${id} belonging to supplier ${truckCheck.rows[0].supplier_id}`)
      const response = NextResponse.json({ error: "Access denied - you can only update your own trucks" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
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
      updateData.vehicleNumber,
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
      const response = NextResponse.json({ error: "Truck not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const response = NextResponse.json({ 
      message: "Truck updated successfully", 
      truck: result.rows[0] 
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Update truck error:", error)
    const response = NextResponse.json({ error: "Failed to update truck" }, { status: 500 })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

// DELETE - Delete truck (hard delete - completely remove from database)
export async function DELETE(request: Request) {
  try {
    // First, verify the user is authenticated
    const session = await getSession()
    if (!session) {
      const response = NextResponse.json({ error: "Authentication required" }, { status: 401 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Only allow suppliers to access this endpoint
    if (session.role !== 'supplier') {
      const response = NextResponse.json({ error: "Access denied - supplier role required" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      const response = NextResponse.json({ error: "Truck ID is required" }, { status: 400 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    console.log("Deleting truck with ID:", id)

    // First check if truck exists and belongs to the logged-in supplier
    const checkResult = await dbQuery("SELECT id, vehicle_number, supplier_id FROM trucks WHERE id = $1", [id])
    
    if (checkResult.rows.length === 0) {
      const response = NextResponse.json({ error: "Truck not found" }, { status: 404 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // SECURITY CHECK: Ensure the truck belongs to the logged-in supplier
    if (checkResult.rows[0].supplier_id !== session.userIdString) {
      console.warn(`Security violation: User ${session.userIdString} attempted to delete truck ${id} belonging to supplier ${checkResult.rows[0].supplier_id}`)
      const response = NextResponse.json({ error: "Access denied - you can only delete your own trucks" }, { status: 403 })
    return addCorsHeaders(response)
     return addCorsHeaders(response)
      return addCorsHeaders(response)
    }

    // Perform hard delete with supplier check
    const sql = `DELETE FROM trucks WHERE id = $1 AND supplier_id = $2`
    const result = await dbQuery(sql, [id, session.userIdString])

    console.log("Truck deleted successfully:", checkResult.rows[0].vehicle_number)
    
    const response = NextResponse.json({ 
      message: "Truck deleted successfully",
      deletedTruck: checkResult.rows[0]
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Delete truck error:", error)
    const response = NextResponse.json({ error: "Failed to delete truck", details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" }, { status: 500 })
  return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

