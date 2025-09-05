import { NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function GET() {
  try {
    console.log("Testing database connection...")
    
    // Test basic connection
    const testResult = await dbQuery("SELECT 1 as test")
    console.log("Basic connection test:", testResult.rows[0])
    
    // Test drivers table structure
    const driversStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'drivers' 
      ORDER BY ordinal_position
    `)
    
    console.log("Drivers table structure:", driversStructure.rows)
    
    // Test if we can query drivers table
    const driversCount = await dbQuery("SELECT COUNT(*) as count FROM drivers")
    console.log("Total drivers:", driversCount.rows[0].count)
    
    // Test foreign key constraints
    const constraints = await dbQuery(`
      SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'drivers'
    `)
    
    console.log("Foreign key constraints:", constraints.rows)
    
    return NextResponse.json({ 
      message: "Database connection test successful",
      results: {
        connection: "OK",
        driversCount: driversCount.rows[0].count,
        tableStructure: driversStructure.rows,
        foreignKeys: constraints.rows
      }
    })
    
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json({ 
      error: "Database connection test failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 })
  }
}
