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
    console.log("Starting trucks table migration to fix column names...")

    // Check current table structure
    const currentStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      ORDER BY ordinal_position
    `)

    console.log("Current trucks table structure:")
    currentStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
    })

    // Check if number_of_vehicles exists and number_of_wheels doesn't
    const hasNumberOfVehicles = currentStructure.rows.some(row => row.column_name === 'number_of_vehicles')
    const hasNumberOfWheels = currentStructure.rows.some(row => row.column_name === 'number_of_wheels')

    if (hasNumberOfVehicles && !hasNumberOfWheels) {
      // Rename number_of_vehicles to number_of_wheels
      try {
        await dbQuery(`ALTER TABLE trucks RENAME COLUMN number_of_vehicles TO number_of_wheels`)
        console.log("Renamed number_of_vehicles to number_of_wheels")
      } catch (error) {
        console.error("Error renaming column:", error)
        const response = NextResponse.json({ 
          error: "Failed to rename column",
          details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
        }, { status: 500 })
       return addCorsHeaders(response)
        return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
      }
    } else if (!hasNumberOfVehicles && !hasNumberOfWheels) {
      // Add number_of_wheels column if neither exists
      try {
        await dbQuery(`ALTER TABLE trucks ADD COLUMN number_of_wheels INTEGER`)
        console.log("Added number_of_wheels column")
      } catch (error) {
        console.error("Error adding column:", error)
        const response = NextResponse.json({ 
          error: "Failed to add column",
          details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
        }, { status: 500 })
       return addCorsHeaders(response)
        return addCorsHeaders(response)
       return addCorsHeaders(response)
        return addCorsHeaders(response)
      }
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
      finalStructure: finalStructure.rows
    })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Trucks migration error:", error)
    const response = NextResponse.json({ 
      error: "Failed to migrate trucks table",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
   return addCorsHeaders(response)
    return addCorsHeaders(response)
   return addCorsHeaders(response)
    return addCorsHeaders(response)
  }
}

