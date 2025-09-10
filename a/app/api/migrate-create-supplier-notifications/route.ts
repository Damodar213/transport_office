import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST() {
  try {
    const pool = getPool()
    if (!pool) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    console.log("Creating supplier_vehicle_location_notifications table...")

    // Create the supplier_vehicle_location_notifications table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS supplier_vehicle_location_notifications (
        id SERIAL PRIMARY KEY,
        vehicle_location_id INTEGER NOT NULL,
        supplier_id VARCHAR(255) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        supplier_company VARCHAR(255),
        state VARCHAR(255) NOT NULL,
        district VARCHAR(255) NOT NULL,
        place VARCHAR(255) NOT NULL,
        taluk VARCHAR(255),
        vehicle_number VARCHAR(255) NOT NULL,
        body_type VARCHAR(255) NOT NULL,
        driver_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await dbQuery(createTableSQL)
    console.log("✅ supplier_vehicle_location_notifications table created successfully")

    // Create index for better performance
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_supplier_vehicle_location_notifications_supplier_id 
      ON supplier_vehicle_location_notifications(supplier_id)
    `
    await dbQuery(createIndexSQL)
    console.log("✅ Index created successfully")

    // Create index for is_read status
    const createReadIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_supplier_vehicle_location_notifications_is_read 
      ON supplier_vehicle_location_notifications(is_read)
    `
    await dbQuery(createReadIndexSQL)
    console.log("✅ Read status index created successfully")

    return NextResponse.json({
      success: true,
      message: "supplier_vehicle_location_notifications table created successfully",
      table: "supplier_vehicle_location_notifications"
    })

  } catch (error) {
    console.error("Error creating supplier_vehicle_location_notifications table:", error)
    return NextResponse.json({ 
      error: "Failed to create supplier_vehicle_location_notifications table",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

