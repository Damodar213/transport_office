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
    console.log("Starting trucks table migration to remove unused columns...")

    // Check if the columns exist before dropping them
    const checkColumns = await dbQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND column_name IN ('fuel_type', 'registration_number', 'insurance_expiry', 'fitness_expiry', 'permit_expiry')
    `)

    const existingColumns = checkColumns.rows.map(row => row.column_name)
    console.log("Existing columns to potentially drop:", existingColumns)

    // Drop columns if they exist
    const columnsToDrop = ['fuel_type', 'registration_number', 'insurance_expiry', 'fitness_expiry', 'permit_expiry']
    
    for (const column of columnsToDrop) {
      if (existingColumns.includes(column)) {
        try {
          await dbQuery(`ALTER TABLE trucks DROP COLUMN IF EXISTS ${column}`)
          console.log(`Dropped column: ${column}`)
        } catch (error) {
          console.error(`Error dropping column ${column}:`, error)
        }

      } else {
        console.log(`Column ${column} does not exist, skipping...`)
  }
    // Verify the final table structure
    const finalStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      ORDER BY ordinal_position
    `)

    console.log("Final trucks table structure:")
    finalStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    const response = NextResponse.json({ 
      message: "Trucks table migration completed successfully",
      droppedColumns: columnsToDrop.filter(col => existingColumns.includes(col)    
    ),
      finalStructure: finalStructure.rows})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Trucks migration error:", error)
    const response = NextResponse.json({ 
      error: "Trucks migration failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
  }
  })
    return addCorsHeaders(response)
  }
