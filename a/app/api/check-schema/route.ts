import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function GET() {
  try {
    console.log("Checking database schema...")
    
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }
    
    // Check what tables exist
    const tablesResult = await dbQuery(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    const tables = tablesResult.rows.map(row => row.table_name)
    console.log("Available tables:", tables)
    
    // Check if confirmed_orders table exists
    const confirmedOrdersExists = tables.includes('confirmed_orders')
    
    if (!confirmedOrdersExists) {
      console.log("confirmed_orders table does not exist, creating it...")
      
      // Create the confirmed_orders table
      await dbQuery(`
        CREATE TABLE IF NOT EXISTS confirmed_orders (
          id SERIAL PRIMARY KEY,
          transport_order_id INTEGER NOT NULL REFERENCES transport_orders(id),
          supplier_id VARCHAR(255) NOT NULL,
          status VARCHAR(50) DEFAULT 'assigned',
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      
      console.log("confirmed_orders table created successfully")
    }
    
    // Get table structures
    const tableStructures = {}
    for (const table of tables) {
      try {
        const columnsResult = await dbQuery(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table])
        
        tableStructures[table] = columnsResult.rows
      } catch (error) {
        console.error(`Error getting structure for table ${table}:`, error)
        tableStructures[table] = []
      }
    }
    
    return NextResponse.json({
      tables,
      confirmedOrdersExists: confirmedOrdersExists || true, // Will be true if we just created it
      tableStructures,
      message: "Schema check completed"
    })
    
  } catch (error) {
    console.error("Check schema error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}


