import { NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function POST() {
  try {
    // Skip suppliers table creation since it already exists
    console.log("Skipping suppliers table creation - already exists")

    // Create drivers table - reference user_id instead of id
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS drivers (
        id SERIAL PRIMARY KEY,
        supplier_id TEXT REFERENCES suppliers(user_id) ON DELETE CASCADE,
        driver_name VARCHAR(100) NOT NULL,
        mobile VARCHAR(20) NOT NULL,
        license_number VARCHAR(50) UNIQUE NOT NULL,
        license_document_url TEXT,
        aadhaar_number VARCHAR(20),
        experience_years INTEGER,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Drivers table created/verified")

    // Create trucks table - reference user_id instead of id
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS trucks (
        id SERIAL PRIMARY KEY,
        supplier_id TEXT REFERENCES suppliers(user_id) ON DELETE CASCADE,
        vehicle_number VARCHAR(20) UNIQUE NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        capacity_tons DECIMAL(8,2),
        fuel_type VARCHAR(20),
        registration_number VARCHAR(50),
        insurance_expiry DATE,
        fitness_expiry DATE,
        permit_expiry DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Trucks table created/verified")

    // Create transport orders table - reference user_id instead of id
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS transport_orders (
        id SERIAL PRIMARY KEY,
        supplier_id TEXT REFERENCES suppliers(user_id) ON DELETE CASCADE,
        state VARCHAR(100) NOT NULL,
        district VARCHAR(100) NOT NULL,
        place VARCHAR(200) NOT NULL,
        taluk VARCHAR(100),
        vehicle_number VARCHAR(20) NOT NULL,
        body_type VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        admin_notes TEXT,
        admin_action_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Transport orders table created/verified")

    // Create confirmed orders table - reference user_id instead of id
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS confirmed_orders (
        id SERIAL PRIMARY KEY,
        transport_order_id INTEGER REFERENCES transport_orders(id) ON DELETE CASCADE,
        supplier_id TEXT REFERENCES suppliers(user_id) ON DELETE CASCADE,
        driver_id INTEGER REFERENCES drivers(id),
        truck_id INTEGER REFERENCES trucks(id),
        pickup_date DATE,
        delivery_date DATE,
        actual_pickup_date TIMESTAMP,
        actual_delivery_date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)
    console.log("Confirmed orders table created/verified")

    // Get existing supplier user_id for sample data
    const existingSupplier = await dbQuery("SELECT user_id FROM suppliers LIMIT 1")
    let supplierId = "111111" // Default fallback
    
    if (existingSupplier.rows.length > 0) {
      supplierId = existingSupplier.rows[0].user_id
      console.log(`Using existing supplier user_id: ${supplierId}`)
    }

    // Insert sample driver data (only if table is empty)
    const existingDrivers = await dbQuery("SELECT COUNT(*) as count FROM drivers")
    if (parseInt(existingDrivers.rows[0].count) === 0) {
      await dbQuery(`
        INSERT INTO drivers (supplier_id, driver_name, mobile, license_number, aadhaar_number, experience_years)
        VALUES 
          ($1, 'Rajesh Kumar', '+91 9876543210', 'DL1420110012345', '123456789012', 5),
          ($1, 'Suresh Patel', '+91 9876543211', 'DL1420110012346', '123456789013', 3)
      `, [supplierId])
      console.log("Sample driver data inserted")
    }

    // Insert sample truck data (only if table is empty)
    const existingTrucks = await dbQuery("SELECT COUNT(*) as count FROM trucks")
    if (parseInt(existingTrucks.rows[0].count) === 0) {
      await dbQuery(`
        INSERT INTO trucks (supplier_id, vehicle_number, body_type, capacity_tons, fuel_type, registration_number)
        VALUES 
          ($1, 'KA01AB1234', 'Full Body', 25.0, 'Diesel', 'KA01AB1234'),
          ($1, 'TN01CD5678', 'Container', 30.0, 'Diesel', 'TN01CD5678')
      `, [supplierId])
      console.log("Sample truck data inserted")
    }

    // Insert sample transport order data (only if table is empty)
    const existingOrders = await dbQuery("SELECT COUNT(*) as count FROM transport_orders")
    if (parseInt(existingOrders.rows[0].count) === 0) {
      await dbQuery(`
        INSERT INTO transport_orders (supplier_id, state, district, place, taluk, vehicle_number, body_type, status)
        VALUES 
          ($1, 'Karnataka', 'Bangalore', 'Electronic City', 'Anekal', 'KA01AB1234', 'Full Body', 'pending'),
          ($1, 'Tamil Nadu', 'Chennai', 'Guindy', NULL, 'TN01CD5678', 'Container', 'confirmed')
      `, [supplierId])
      console.log("Sample transport order data inserted")
    }

    return NextResponse.json({ 
      message: "Database migration completed successfully",
      tables: ["suppliers (existing)", "drivers", "trucks", "transport_orders", "confirmed_orders"],
      supplierId: supplierId
    })

  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ error: "Migration failed", details: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}


