import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export interface District {
  id: string
  name: string
  state: string
  description?: string
  isActive: boolean
  createdAt: string
}

// GET - Fetch all districts
export async function GET() {
  try {
    console.log("Fetching districts from database...")
    
    // Check if database is available
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available",
        districts: [],
        message: "Database connection failed"
      }, { status: 500 })
    }

    // Ensure table exists (idempotent)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        district VARCHAR(255) NOT NULL,
        state VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(district, state)
      )
    `)

    // Fetch districts
    const result = await dbQuery(`
      SELECT 
        id::text as id, 
        district as name, 
        state,
        '' as description, 
        is_active as "isActive", 
        created_at as "createdAt"
      FROM districts
      WHERE is_active = true
      ORDER BY state, district
    `)

    return NextResponse.json({
      districts: result.rows,
      total: result.rows.length,
      message: "Districts fetched successfully"
    })
  } catch (error) {
    console.error("Error fetching districts:", error)
    return NextResponse.json({ 
      error: "Failed to fetch districts",
      districts: [],
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create new district
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, state, description } = body

    if (!name || !name.trim() || !state || !state.trim()) {
      return NextResponse.json({ 
        error: "District name and state are required" 
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    // Table already exists, no need to create it

    // Insert new district
    const result = await dbQuery(`
      INSERT INTO districts (district, state, is_active)
      VALUES ($1, $2, $3)
      RETURNING id::text as id, district as name, state, '' as description, is_active as "isActive", created_at as "createdAt"
    `, [name.trim(), state.trim(), true])

    return NextResponse.json({
      district: result.rows[0],
      message: "District created successfully"
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating district:", error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ 
        error: "District with this name and state already exists"
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Failed to create district",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT - Update district
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, name, state, description, isActive } = body

    if (!id || !name || !name.trim() || !state || !state.trim()) {
      return NextResponse.json({ 
        error: "District ID, name and state are required" 
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    const result = await dbQuery(`
      UPDATE districts 
      SET district = $1, state = $2, is_active = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING id::text as id, district as name, state, '' as description, is_active as "isActive", created_at as "createdAt"
    `, [name.trim(), state.trim(), isActive !== undefined ? isActive : true, id])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "District not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      district: result.rows[0],
      message: "District updated successfully"
    })
  } catch (error) {
    console.error("Error updating district:", error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({ 
        error: "District with this name and state already exists"
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: "Failed to update district",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE - Delete district
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ 
        error: "District ID is required" 
      }, { status: 400 })
    }

    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ 
        error: "Database not available" 
      }, { status: 500 })
    }

    const result = await dbQuery(`
      DELETE FROM districts WHERE id = $1
    `, [id])

    if (result.rowCount === 0) {
      return NextResponse.json({ 
        error: "District not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      message: "District deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting district:", error)
    return NextResponse.json({ 
      error: "Failed to delete district",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
