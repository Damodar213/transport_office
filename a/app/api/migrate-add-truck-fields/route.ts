import { NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function POST() {
  try {
    console.log("Starting trucks table migration to add new fields...")

    // Check if the columns already exist
    const checkColumns = await dbQuery(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'trucks' 
      AND column_name IN ('number_of_vehicles', 'document_url')
    `)

    const existingColumns = checkColumns.rows.map(row => row.column_name)
    console.log("Existing columns:", existingColumns)

    // Add columns if they don't exist
    const columnsToAdd = [
      { name: 'number_of_vehicles', type: 'INTEGER' },
      { name: 'document_url', type: 'TEXT' }
    ]
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        try {
          await dbQuery(`ALTER TABLE trucks ADD COLUMN ${column.name} ${column.type}`)
          console.log(`Added column: ${column.name}`)
        } catch (error) {
          console.error(`Error adding column ${column.name}:`, error)
        }
      } else {
        console.log(`Column ${column.name} already exists, skipping...`)
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

    return NextResponse.json({ 
      message: "Trucks table migration completed successfully",
      addedColumns: columnsToAdd.filter(col => !existingColumns.includes(col.name)),
      finalStructure: finalStructure.rows
    })

  } catch (error) {
    console.error("Trucks migration error:", error)
    return NextResponse.json({ 
      error: "Trucks migration failed", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
  }
}

