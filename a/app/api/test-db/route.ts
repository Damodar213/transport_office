import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Check if tables exist
    const tablesResult = await dbQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('order_submissions', 'drivers', 'trucks', 'notifications')
      ORDER BY table_name
    `)
    
    const existingTables = tablesResult.rows.map(row => row.table_name)
    
    // Check order_submissions table structure
    let orderSubmissionsColumns = []
    if (existingTables.includes('order_submissions')) {
      const columnsResult = await dbQuery(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'order_submissions'
        ORDER BY ordinal_position
      `)
      orderSubmissionsColumns = columnsResult.rows
    }
    
    // Check drivers table structure
    let driversColumns = []
    if (existingTables.includes('drivers')) {
      const columnsResult = await dbQuery(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'drivers'
        ORDER BY ordinal_position
      `)
      driversColumns = columnsResult.rows
    }
    
    // Check trucks table structure
    let trucksColumns = []
    if (existingTables.includes('trucks')) {
      const columnsResult = await dbQuery(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'trucks'
        ORDER BY ordinal_position
      `)
      trucksColumns = columnsResult.rows
    }

    return NextResponse.json({
      success: true,
      existingTables,
      orderSubmissionsColumns,
      driversColumns,
      trucksColumns
    })

  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json(
      { error: "Database test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}


