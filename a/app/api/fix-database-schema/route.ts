import { NextRequest, NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    console.log("Fix database schema API called")
    
    if (!getPool()) {
      console.log("Database not available")
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    // Fix accepted_requests table structure
    console.log("Fixing accepted_requests table structure...")
    
    // Create table if it doesn't exist
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS accepted_requests (
        id SERIAL PRIMARY KEY,
        buyer_request_id INTEGER,
        order_submission_id INTEGER,
        buyer_id VARCHAR(50),
        supplier_id VARCHAR(50) NOT NULL,
        driver_id INTEGER,
        vehicle_id INTEGER,
        order_number VARCHAR(100),
        load_type VARCHAR(100),
        from_state VARCHAR(100),
        from_district VARCHAR(100),
        from_place VARCHAR(255),
        to_state VARCHAR(100),
        to_district VARCHAR(100),
        to_place VARCHAR(255),
        estimated_tons DECIMAL(10,2),
        rate DECIMAL(10,2),
        distance_km DECIMAL(10,2),
        driver_name VARCHAR(100),
        driver_mobile VARCHAR(20),
        vehicle_number VARCHAR(20),
        vehicle_type VARCHAR(50),
        supplier_company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'accepted',
        accepted_at TIMESTAMP,
        sent_by_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Add missing columns
    const columnsToAdd = [
      "buyer_request_id INTEGER",
      "order_submission_id INTEGER", 
      "buyer_id VARCHAR(50)",
      "supplier_id VARCHAR(50)",
      "driver_id INTEGER",
      "vehicle_id INTEGER",
      "order_number VARCHAR(100)",
      "load_type VARCHAR(100)",
      "from_state VARCHAR(100)",
      "from_district VARCHAR(100)",
      "from_place VARCHAR(255)",
      "to_state VARCHAR(100)",
      "to_district VARCHAR(100)",
      "to_place VARCHAR(255)",
      "estimated_tons DECIMAL(10,2)",
      "rate DECIMAL(10,2)",
      "distance_km DECIMAL(10,2)",
      "driver_name VARCHAR(100)",
      "driver_mobile VARCHAR(20)",
      "vehicle_number VARCHAR(20)",
      "vehicle_type VARCHAR(50)",
      "supplier_company VARCHAR(255)",
      "status VARCHAR(50)",
      "accepted_at TIMESTAMP",
      "sent_by_admin BOOLEAN",
      "created_at TIMESTAMP",
      "updated_at TIMESTAMP"
    ]
    
    for (const column of columnsToAdd) {
      try {
        await dbQuery(`ALTER TABLE accepted_requests ADD COLUMN IF NOT EXISTS ${column.split(' ')[0]} ${column.split(' ').slice(1).join(' ')}`)
      } catch (error) {
        console.log(`Column ${column.split(' ')[0]} might already exist or error occurred:`, error)
      }
    }
    
    // Fix manual_orders table structure
    console.log("Fixing manual_orders table structure...")
    
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS manual_orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(100),
        load_type VARCHAR(100),
        estimated_tons DECIMAL(10,2),
        number_of_goods INTEGER,
        delivery_place VARCHAR(255),
        from_place VARCHAR(255),
        to_place VARCHAR(255),
        from_state VARCHAR(100),
        from_district VARCHAR(100),
        to_state VARCHAR(100),
        to_district VARCHAR(100),
        from_taluk VARCHAR(100),
        to_taluk VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        created_by VARCHAR(100),
        assigned_supplier_id VARCHAR(50),
        assigned_supplier_name VARCHAR(255),
        admin_notes TEXT,
        special_instructions TEXT,
        required_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Add missing columns to manual_orders
    const manualOrderColumns = [
      "number_of_goods INTEGER",
      "from_place VARCHAR(255)",
      "to_place VARCHAR(255)",
      "from_state VARCHAR(100)",
      "from_district VARCHAR(100)",
      "to_state VARCHAR(100)",
      "to_district VARCHAR(100)",
      "from_taluk VARCHAR(100)",
      "to_taluk VARCHAR(100)"
    ]
    
    for (const column of manualOrderColumns) {
      try {
        await dbQuery(`ALTER TABLE manual_orders ADD COLUMN IF NOT EXISTS ${column.split(' ')[0]} ${column.split(' ').slice(1).join(' ')}`)
      } catch (error) {
        console.log(`Column ${column.split(' ')[0]} might already exist or error occurred:`, error)
      }
    }
    
    // Fix manual_order_submissions table structure
    console.log("Fixing manual_order_submissions table structure...")
    
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS manual_order_submissions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        supplier_id VARCHAR(50),
        submitted_by VARCHAR(100),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'new',
        notes TEXT,
        driver_id INTEGER,
        vehicle_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    
    // Create indexes for better performance
    console.log("Creating indexes...")
    
    try {
      await dbQuery("CREATE INDEX IF NOT EXISTS idx_accepted_requests_supplier ON accepted_requests(supplier_id)")
      await dbQuery("CREATE INDEX IF NOT EXISTS idx_accepted_requests_sent_by_admin ON accepted_requests(sent_by_admin)")
      await dbQuery("CREATE INDEX IF NOT EXISTS idx_accepted_requests_accepted_at ON accepted_requests(accepted_at)")
      await dbQuery("CREATE INDEX IF NOT EXISTS idx_manual_order_submissions_supplier ON manual_order_submissions(supplier_id)")
      await dbQuery("CREATE INDEX IF NOT EXISTS idx_manual_order_submissions_order ON manual_order_submissions(order_id)")
    } catch (error) {
      console.log("Some indexes might already exist:", error)
    }
    
    console.log("Database schema fix completed successfully")
    
    return NextResponse.json({
      success: true,
      message: "Database schema fixed successfully"
    })

  } catch (error) {
    console.error("Error fixing database schema:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}

