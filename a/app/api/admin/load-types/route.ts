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
      const response = NextResponse.json({ 
        error: "Database not available",
        loadTypes: [],
        message: "Database connection failed"
  }
      }, { status: 500 })
    }

    // Simple approach: try to create table and insert data
    try {
      // Create table if it doesn't exist
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS load_types (
  }
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

    const response = NextResponse.json({
      loadTypes: result.rows,
      total: result.rows.length,
      message: "Load types fetched successfully"
  }
    })
  } catch (error) {
    console.error("Error fetching load types:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch load types",
      loadTypes: [],
      message: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
  }
// POST - Create new load type
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    const body = await request.json()
    const { name, description } = body

    if (!name || !name.trim()) {
      const response = NextResponse.json({ 
        error: "Load type name is required" 
  }
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      const response = NextResponse.json({ 
        error: "Database not available" 
  }
      }, { status: 500 })
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

    const response = NextResponse.json({
      loadType: result.rows[0],
      message: "Load type created successfully"
  }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating load type:", error)
    
    if (error instanceof Error && error instanceof Error ? error.message : "Unknown error".includes('duplicate key')) {
      const response = NextResponse.json({ 
        error: "Load type with this name already exists"
  }
      }, { status: 409 })
    }

    const response = NextResponse.json({ 
      error: "Failed to create load type",
      message: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
  }
// PUT - Update load type
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, description, isActive } = body

    if (!id || !name || !name.trim()) {
      const response = NextResponse.json({ 
        error: "Load type ID and name are required" 
  }
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      const response = NextResponse.json({ 
        error: "Database not available" 
  }
      }, { status: 500 })
    }

    const result = await dbQuery(`
      UPDATE load_types 
      SET name = $1, description = $2, is_active = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id::text as id, name, description, is_active as "isActive", created_at as "createdAt"
    `, [name.trim(), description?.trim() || null, isActive !== undefined ? isActive : true, id])

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Load type not found" 
  }
      }, { status: 404 })
    }

    const response = NextResponse.json({
      loadType: result.rows[0],
      message: "Load type updated successfully"
  }
    })
  } catch (error) {
    console.error("Error updating load type:", error)
    
    if (error instanceof Error && error instanceof Error ? error.message : "Unknown error".includes('duplicate key')) {
      const response = NextResponse.json({ 
        error: "Load type with this name already exists"
  }
      }, { status: 409 })
    }

    const response = NextResponse.json({ 
      error: "Failed to update load type",
      message: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
  }
// DELETE - Delete load type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      const response = NextResponse.json({ 
        error: "Load type ID is required" 
  }
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      const response = NextResponse.json({ 
        error: "Database not available" 
  }
      }, { status: 500 })
    }

    const result = await dbQuery(`
      DELETE FROM load_types WHERE id = $1
    `, [id])

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Load type not found" 
  }
      }, { status: 404 })
    }

    const response = NextResponse.json({
      message: "Load type deleted successfully"
  }
    })
  } catch (error) {
    console.error("Error deleting load type:", error)
    const response = NextResponse.json({ 
      error: "Failed to delete load type",
      message: error instanceof Error ? error.message : "Unknown error"
  }
    }, { status: 500 })
  }
