import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    console.log("Creating manual_orders table...")

    // Create the manual_orders table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS manual_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        load_type VARCHAR(100) NOT NULL,
        estimated_tons DECIMAL(10,2) NOT NULL,
        delivery_place VARCHAR(255) NOT NULL,
        from_location VARCHAR(255) DEFAULT 'Admin Specified Location',
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
        created_by VARCHAR(100) DEFAULT 'ADMIN',
        assigned_supplier_id VARCHAR(50),
        assigned_supplier_name VARCHAR(255),
        admin_notes TEXT,
        special_instructions TEXT,
        required_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await dbQuery(createTableSQL)
    console.log("✅ manual_orders table created successfully")

    // Create index for better performance
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_manual_orders_status 
      ON manual_orders(status)
    `
    await dbQuery(createIndexSQL)
    console.log("✅ Status index created successfully")

    // Create index for order number
    const createOrderNumberIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_manual_orders_order_number 
      ON manual_orders(order_number)
    `
    await dbQuery(createOrderNumberIndexSQL)
    console.log("✅ Order number index created successfully")

    // Create index for created_at
    const createDateIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_manual_orders_created_at 
      ON manual_orders(created_at)
    `
    await dbQuery(createDateIndexSQL)
    console.log("✅ Created date index created successfully")

    return NextResponse.json({
      success: true,
      message: "Manual orders table created successfully with all indexes"
    })

  } catch (error) {
    console.error("Manual orders migration error:", error)
    return NextResponse.json({ 
      error: "Failed to create manual orders table",
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error"
    }, { status: 500 })
  }
}

