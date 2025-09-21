import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"
import { createApiResponse, createApiError } from "@/lib/api-utils"

export async function POST() {
  try {
    const pool = getPool()
    if (!pool) {
      return createApiError("Database not available", null, 503)
    }

    console.log("Creating vehicle_documents and driver_documents tables...")

    // Create vehicle_documents table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS vehicle_documents (
        id SERIAL PRIMARY KEY,
        vehicle_id INTEGER NOT NULL,
        supplier_id VARCHAR(255) NOT NULL,
        vehicle_number VARCHAR(255),
        document_type VARCHAR(50) NOT NULL,
        document_url TEXT NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        review_notes TEXT,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create driver_documents table
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS driver_documents (
        id SERIAL PRIMARY KEY,
        driver_id INTEGER NOT NULL,
        supplier_id VARCHAR(255) NOT NULL,
        driver_name VARCHAR(255),
        document_type VARCHAR(50) NOT NULL,
        document_url TEXT NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        review_notes TEXT,
        reviewed_by VARCHAR(255),
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create indexes for better performance
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle_id ON vehicle_documents(vehicle_id)
    `)
    
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_documents_supplier_id ON vehicle_documents(supplier_id)
    `)
    
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_vehicle_documents_status ON vehicle_documents(status)
    `)

    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_id ON driver_documents(driver_id)
    `)
    
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_driver_documents_supplier_id ON driver_documents(supplier_id)
    `)
    
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_driver_documents_status ON driver_documents(status)
    `)

    // Migrate existing vehicle documents from trucks table
    try {
      const trucksResult = await dbQuery(`
        SELECT t.id, t.supplier_id, t.vehicle_number, t.document_url, t.created_at
        FROM trucks t 
        WHERE t.document_url IS NOT NULL AND t.document_url != ''
      `)
      
      console.log(`Found ${trucksResult.rows.length} trucks with documents to migrate`)
      
      for (const truck of trucksResult.rows) {
        try {
          await dbQuery(
            `INSERT INTO vehicle_documents (vehicle_id, supplier_id, vehicle_number, document_type, document_url, submitted_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             ON CONFLICT DO NOTHING`,
            [
              truck.id,
              truck.supplier_id,
              truck.vehicle_number,
              'rc', // Default to RC document type
              truck.document_url,
              truck.created_at || new Date().toISOString()
            ]
          )
        } catch (error) {
          console.error(`Error migrating vehicle document ${truck.id}:`, error)
        }
      }
      console.log("Vehicle document migration completed")
    } catch (vehicleMigrationError) {
      console.warn("Could not migrate vehicle documents:", vehicleMigrationError)
    }

    // Migrate existing driver documents from drivers table
    try {
      const driversResult = await dbQuery(`
        SELECT d.id, d.supplier_id, d.driver_name, d.document_url, d.created_at
        FROM drivers d 
        WHERE d.document_url IS NOT NULL AND d.document_url != ''
      `)
      
      console.log(`Found ${driversResult.rows.length} drivers with documents to migrate`)
      
      for (const driver of driversResult.rows) {
        try {
          await dbQuery(
            `INSERT INTO driver_documents (driver_id, supplier_id, driver_name, document_type, document_url, submitted_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'pending')
             ON CONFLICT DO NOTHING`,
            [
              driver.id,
              driver.supplier_id,
              driver.driver_name,
              'license', // Default to driving license document type
              driver.document_url,
              driver.created_at || new Date().toISOString()
            ]
          )
        } catch (error) {
          console.error(`Error migrating driver document ${driver.id}:`, error)
        }
      }
      console.log("Driver document migration completed")
    } catch (driverMigrationError) {
      console.warn("Could not migrate driver documents:", driverMigrationError)
    }

    return createApiResponse({
      message: "vehicle_documents and driver_documents tables created successfully",
      migrated: true
    })

  } catch (error) {
    console.error("Migration error:", error)
    return createApiError(
      "Failed to create vehicle and driver document tables",
      error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error",
      500
    )
  }
}


