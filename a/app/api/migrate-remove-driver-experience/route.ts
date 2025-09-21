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
    console.log("Starting drivers table migration to remove experience_years column...")

    // Check if the column exists before dropping it
    const checkColumns = await dbQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
      AND column_name = 'experience_years'
    `)

    const existingColumns = checkColumns.rows.map(row => row.column_name)
    console.log("Existing columns to potentially drop:", existingColumns)

    // Drop the experience_years column if it exists
    if (existingColumns.includes('experience_years')) {
      try {
        await dbQuery(`ALTER TABLE drivers DROP COLUMN experience_years`)
        console.log("Dropped column: experience_years")
      } catch (error) {
        console.error("Error dropping column experience_years:", error)
        const response = NextResponse.json({ 
          error: "Failed to drop experience_years column", 
          details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
        }, { status: 500 })
       return addCorsHeaders(response)
        return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
      }
    } else {
      console.log("Column experience_years does not exist, skipping...")
    }

    // Verify the final table structure
    const finalStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
      ORDER BY ordinal_position
    `)

    console.log("Final drivers table structure:")
    finalStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    const response = NextResponse.json({ 
      message: "Drivers table migration completed successfully",
      droppedColumns: existingColumns.includes('experience_years')
    return addCorsHeaders(response)
     return addCorsHeaders(response)
     ? ['experience_years'] : [],
      finalStructure: finalStructure.rows
    })
    return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Drivers migration error:", error)
    const response = NextResponse.json({ 
      error: "Drivers migration failed", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}
