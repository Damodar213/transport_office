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
    console.log("Starting migration to create buyer_requests table...")

    // Check if the table already exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'buyer_requests'
      )
    `)

    if (tableExists.rows[0].exists) {
      console.log("Table buyer_requests already exists, skipping creation...")
      const response = NextResponse.json({ 
        message: "Table buyer_requests already exists, no migration needed",
        created: false
      })
    }

    // Create the buyer_requests table
    await dbQuery(`
      CREATE TABLE buyer_requests (
        id SERIAL PRIMARY KEY,
        buyer_id VARCHAR(255) NOT NULL REFERENCES buyers(user_id) ON DELETE CASCADE,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        load_type VARCHAR(100) NOT NULL,
        from_state VARCHAR(100) NOT NULL,
        from_district VARCHAR(100) NOT NULL,
        from_place VARCHAR(200) NOT NULL,
        from_taluk VARCHAR(100),
        to_state VARCHAR(100) NOT NULL,
        to_district VARCHAR(100) NOT NULL,
        to_place VARCHAR(200) NOT NULL,
        to_taluk VARCHAR(100),
        estimated_tons DECIMAL(8,2),
        number_of_goods INTEGER,
        delivery_place VARCHAR(500) NOT NULL,
        required_date DATE,
        special_instructions TEXT,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
          'draft', 'submitted', 'pending', 'assigned', 'confirmed', 
          'picked_up', 'in_transit', 'delivered', 'cancelled', 'rejected'
        )),
        supplier_id VARCHAR(255) REFERENCES suppliers(user_id),
        driver_id INTEGER REFERENCES drivers(id),
        vehicle_id INTEGER REFERENCES trucks(id),
        rate DECIMAL(10,2),
        distance_km DECIMAL(8,2),
        admin_notes TEXT,
        assigned_by VARCHAR(255),
        assigned_at TIMESTAMP,
        confirmed_at TIMESTAMP,
        pickup_date TIMESTAMP,
        delivery_date TIMESTAMP,
        estimated_delivery_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log("Successfully created buyer_requests table")

    // Create indexes for better performance
    await dbQuery(`CREATE INDEX idx_buyer_requests_buyer_id ON buyer_requests(buyer_id)`)
    await dbQuery(`CREATE INDEX idx_buyer_requests_status ON buyer_requests(status)`)
    await dbQuery(`CREATE INDEX idx_buyer_requests_created_at ON buyer_requests(created_at)`)
    await dbQuery(`CREATE INDEX idx_buyer_requests_order_number ON buyer_requests(order_number)`)

    console.log("Created indexes for buyer_requests table")

    // Verify the table structure
    const tableStructure = await dbQuery(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'buyer_requests' 
      ORDER BY ordinal_position
    `)

    console.log("buyer_requests table structure:")
    tableStructure.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${row.column_default ? `default: ${row.column_default}` : ''}`)
    })

    const response = NextResponse.json({ 
      message: "buyer_requests table created successfully",
      created: true,
      tableStructure: tableStructure.rows
    })

  } catch (error) {
    console.error("Migration error:", error)
    const response = NextResponse.json({ 
      error: "Failed to create buyer_requests table", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
  }
}

