import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery } from "@/lib/db"

export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST() {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    console.log("Starting migration to rename transport_orders table to suppliers_vehicle_location...")

    // Check if the old table exists
    const checkOldTable = await dbQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'transport_orders'
    `)

    // Check if the new table already exists
    const checkNewTable = await dbQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'suppliers_vehicle_location'
    `)

    if (checkOldTable.rows.length === 0) {
      console.log("Table transport_orders does not exist, skipping migration...")
      const response = NextResponse.json({ 
        message: "Table transport_orders does not exist, no migration needed",
        renamed: false
      })
    }

    if (checkNewTable.rows.length > 0) {
      console.log("Table suppliers_vehicle_location already exists, skipping migration...")
      const response = NextResponse.json({ 
        message: "Table suppliers_vehicle_location already exists, no migration needed",
        renamed: false
      })
    }

    // Rename the table
    try {
      await dbQuery(`ALTER TABLE transport_orders RENAME TO suppliers_vehicle_location`)
      console.log("Successfully renamed table: transport_orders -> suppliers_vehicle_location")
    } catch (error) {
      console.error("Error renaming table:", error)
      const response = NextResponse.json({ 
        error: "Failed to rename table", 
        details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
      }, { status: 500 })
    }

    // Verify the new table structure
    const finalStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'suppliers_vehicle_location' 
      ORDER BY ordinal_position
    `)

    console.log("Final suppliers_vehicle_location table structure:")
    finalStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    const response = NextResponse.json({ 
      message: "Table migration completed successfully",
      renamed: true,
      oldTableName: "transport_orders",
      newTableName: "suppliers_vehicle_location",
      finalStructure: finalStructure.rows
    })

  } catch (error) {
    console.error("Table migration error:", error)
    const response = NextResponse.json({ 
      error: "Table migration failed", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
  }
}
