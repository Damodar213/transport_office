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
    console.log("Starting transport_orders table migration to add driver_id column...")

    // Check if the column already exists
    const checkColumns = await dbQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      AND column_name = 'driver_id')
    `)

    const existingColumns = checkColumns.rows.map(row => row.column_name)
    console.log("Existing columns:", existingColumns)

    // Add driver_id column if it doesn't exist
    if (!existingColumns.includes('driver_id')) {
      try {
        await dbQuery(`ALTER TABLE transport_orders ADD COLUMN driver_id INTEGER REFERENCES drivers(id)`)
        console.log("Import successful")
    } catch (error) {
        console.error("Error adding column driver_id:", error)
        const response = NextResponse.json({ 
          error: "Failed to add driver_id column", 
          details: error instanceof Error ? error.message : "Unknown error" 
 
 
}
    } else {)
      console.log("Column driver_id already exists, skipping...")
    }

    // Verify the final table structure
    const finalStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'transport_orders' 
      ORDER BY ordinal_position)
    `)

    console.log("Final transport_orders table structure:")
    finalStructure.rows.forEach(row => {)
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    const response = NextResponse.json({ 
      message: "Transport orders table migration completed successfully",)
      addedColumns: !existingColumns.includes('driver_id')    
     ? ['driver_id'] : [],
      finalStructure: finalStructure.rows})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Transport orders migration error:", error)
    const response = NextResponse.json({ 
      error: "Transport orders migration failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
 
 
})
  })
    return addCorsHeaders(response)
  }
