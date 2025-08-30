import { NextRequest, NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export interface LoadType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

// Mock data for development - replace with database calls
let loadTypes: LoadType[] = [
  { id: "1", name: "Rice", description: "Agricultural products", isActive: true, createdAt: new Date().toISOString() },
  { id: "2", name: "Wheat", description: "Agricultural products", isActive: true, createdAt: new Date().toISOString() },
  { id: "3", name: "Cotton", description: "Textile materials", isActive: true, createdAt: new Date().toISOString() },
  { id: "4", name: "Sugar", description: "Food products", isActive: true, createdAt: new Date().toISOString() },
  { id: "5", name: "Cement", description: "Construction materials", isActive: true, createdAt: new Date().toISOString() },
  { id: "6", name: "Steel", description: "Industrial materials", isActive: true, createdAt: new Date().toISOString() },
  { id: "7", name: "Textiles", description: "Fabric and clothing", isActive: true, createdAt: new Date().toISOString() },
  { id: "8", name: "Electronics", description: "Electronic devices", isActive: true, createdAt: new Date().toISOString() },
  { id: "9", name: "Furniture", description: "Home and office furniture", isActive: true, createdAt: new Date().toISOString() },
  { id: "10", name: "Other", description: "Miscellaneous items", isActive: true, createdAt: new Date().toISOString() }
]

// GET - Fetch all load types
export async function GET() {
  try {
    // Check if database is available
    const pool = await import("@/lib/db").then(m => m.getPool())
    if (pool) {
      // TODO: Implement database query for load types
      // const result = await dbQuery(`
      //   SELECT id, name, description, is_active as "isActive", created_at as "createdAt"
      //   FROM load_types
      //   ORDER BY name
      // `)
      // loadTypes = result.rows
    }

    return NextResponse.json({
      loadTypes: loadTypes.filter(lt => lt.isActive),
      total: loadTypes.filter(lt => lt.isActive).length,
      message: "Load types fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching load types:", error)
    return NextResponse.json({ 
      error: "Failed to fetch load types",
      loadTypes: loadTypes.filter(lt => lt.isActive),
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create new load type
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ 
        error: "Load type name is required" 
      }, { status: 400 })
    }

    const newLoadType: LoadType = {
      id: Date.now().toString(),
      name: name.trim(),
      description: description?.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString()
    }

    loadTypes.push(newLoadType)

    // TODO: Implement database insert
    // if (pool) {
    //   await dbQuery(`
    //     INSERT INTO load_types (name, description, is_active, created_at)
    //     VALUES ($1, $2, $3, $4)
    //   `, [newLoadType.name, newLoadType.description, newLoadType.isActive, newLoadType.createdAt])
    // }

    return NextResponse.json({
      loadType: newLoadType,
      message: "Load type created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating load type:", error)
    return NextResponse.json({ 
      error: "Failed to create load type",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT - Update load type
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, isActive } = body

    if (!id || !name || !name.trim()) {
      return NextResponse.json({ 
        error: "Load type ID and name are required" 
      }, { status: 400 })
    }

    const loadTypeIndex = loadTypes.findIndex(lt => lt.id === id)
    if (loadTypeIndex === -1) {
      return NextResponse.json({ 
        error: "Load type not found" 
      }, { status: 404 })
    }

    loadTypes[loadTypeIndex] = {
      ...loadTypes[loadTypeIndex],
      name: name.trim(),
      description: description?.trim() || undefined,
      isActive: isActive !== undefined ? isActive : loadTypes[loadTypeIndex].isActive
    }

    // TODO: Implement database update
    // if (pool) {
    //   await dbQuery(`
    //     UPDATE load_types 
    //     SET name = $1, description = $2, is_active = $3, updated_at = CURRENT_TIMESTAMP
    //     WHERE id = $4
    //   `, [name.trim(), description?.trim(), isActive, id])
    // }

    return NextResponse.json({
      loadType: loadTypes[loadTypeIndex],
      message: "Load type updated successfully"
    })
  } catch (error) {
    console.error("Error updating load type:", error)
    return NextResponse.json({ 
      error: "Failed to update load type",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE - Delete load type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ 
        error: "Load type ID is required" 
      }, { status: 400 })
    }

    const loadTypeIndex = loadTypes.findIndex(lt => lt.id === id)
    if (loadTypeIndex === -1) {
      return NextResponse.json({ 
        error: "Load type not found" 
      }, { status: 404 })
    }

    loadTypes.splice(loadTypeIndex, 1)

    // TODO: Implement database delete
    // if (pool) {
    //   await dbQuery(`
    //     DELETE FROM load_types WHERE id = $1
    //   `, [id])
    // }

    return NextResponse.json({
      message: "Load type deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting load type:", error)
    return NextResponse.json({ 
      error: "Failed to delete load type",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
