import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export interface LoadType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

// GET - Fetch all load types
export async function GET() {
  try {
    console.log("Fetching load types from database...")
    
    // Check if database is available
    const pool = getPool()
    if (!pool) {
      console.log("Database not available, returning default load types")
      return NextResponse.json({
        loadTypes: [
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
        ],
        total: 10,
        message: "Default load types (database not configured)"
      })
    }

    // Simple approach: try to create table and insert data
    try {
      // Create table if it doesn't exist
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS load_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
      
      // Check if table is empty and insert default data
      const countResult = await dbQuery("SELECT COUNT(*) as count FROM load_types")
      if (parseInt(countResult.rows[0].count) === 0) {
        await dbQuery(`
          INSERT INTO load_types (name, description, is_active) VALUES
          ('Rice', 'Agricultural products', true),
          ('Wheat', 'Agricultural products', true),
          ('Cotton', 'Textile materials', true),
          ('Sugar', 'Food products', true),
          ('Cement', 'Construction materials', true),
          ('Steel', 'Industrial materials', true),
          ('Textiles', 'Fabric and clothing', true),
          ('Electronics', 'Electronic devices', true),
          ('Furniture', 'Home and office furniture', true),
          ('Other', 'Miscellaneous items', true)
        `)
      }
    } catch (error) {
      console.error("Error setting up table:", error)
      // Continue anyway, might already exist
    }

    // Fetch load types
    const result = await dbQuery(`
      SELECT 
        id::text as id, 
        name, 
        description, 
        is_active as "isActive", 
        created_at as "createdAt"
      FROM load_types
      WHERE is_active = true
      ORDER BY name
    `)

    return NextResponse.json({
      loadTypes: result.rows,
      total: result.rows.length,
      message: "Load types fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching load types:", error)
    return NextResponse.json({ 
      error: "Failed to fetch load types",
      loadTypes: [],
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

    const pool = getPool()
    if (!pool) {
      console.log("Database not available, cannot create load type")
      return NextResponse.json({ 
        error: "Database not available - cannot create load types without database" 
      }, { status: 503 })
    }

    // Ensure table exists
    try {
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS load_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
    } catch (error) {
      console.error("Error ensuring table exists:", error)
    }

    // Insert new load type
    const result = await dbQuery(`
      INSERT INTO load_types (name, description, is_active)
      VALUES ($1, $2, $3)
      RETURNING id::text as id, name, description, is_active as "isActive", created_at as "createdAt"
    `, [name.trim(), description?.trim() || null, true])

    return NextResponse.json({
      loadType: result.rows[0],
      message: "Load type created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating load type:", error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ 
        error: "Load type with this name already exists"
      }, { status: 409 })
    }
    
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

    const pool = getPool()
    if (!pool) {
      console.log("Database not available, cannot update load type")
      return NextResponse.json({ 
        error: "Database not available - cannot update load types without database" 
      }, { status: 503 })
    }

    const result = await dbQuery(`
      UPDATE load_types 
      SET name = $1, description = $2, is_active = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id::text as id, name, description, is_active as "isActive", created_at as "createdAt"
    `, [name.trim(), description?.trim() || null, isActive !== undefined ? isActive : true, id])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Load type not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      loadType: result.rows[0],
      message: "Load type updated successfully"
    })
  } catch (error) {
    console.error("Error updating load type:", error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ 
        error: "Load type with this name already exists"
      }, { status: 409 })
    }
    
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

    const pool = getPool()
    if (!pool) {
      console.log("Database not available, cannot delete load type")
      return NextResponse.json({ 
        error: "Database not available - cannot delete load types without database" 
      }, { status: 503 })
    }

    const result = await dbQuery(`
      DELETE FROM load_types WHERE id = $1
    `, [id])

    if (result.rowCount === 0) {
      return NextResponse.json({ 
        error: "Load type not found" 
      }, { status: 404 })
    }

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
