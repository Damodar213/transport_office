import { NextResponse } from "next/server"
import { dbQuery } from "@/lib/db"

export async function POST() {
  try {
    console.log("Starting migration to add whatsapp_sent and notification_sent fields to order_submissions table...")

    // Check if the order_submissions table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'order_submissions'
      )
    `)

    if (!tableExists.rows[0].exists) {
      // Create the order_submissions table if it doesn't exist
      await dbQuery(`
        CREATE TABLE order_submissions (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL REFERENCES buyer_requests(id) ON DELETE CASCADE,
          supplier_id VARCHAR(50) NOT NULL REFERENCES suppliers(user_id) ON DELETE CASCADE,
          submitted_by VARCHAR(100) NOT NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          whatsapp_sent BOOLEAN DEFAULT FALSE,
          notification_sent BOOLEAN DEFAULT FALSE,
          status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'responded', 'confirmed', 'rejected')),
          driver_id INTEGER REFERENCES drivers(id),
          vehicle_id INTEGER REFERENCES trucks(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(order_id, supplier_id)
        )
      `)
      console.log("Created order_submissions table with whatsapp_sent and notification_sent fields")
    } else {
      // Check if the fields already exist
      const whatsappFieldExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'order_submissions' 
          AND column_name = 'whatsapp_sent'
        )
      `)

      const notificationFieldExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'order_submissions' 
          AND column_name = 'notification_sent'
        )
      `)

      const statusFieldExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'order_submissions' 
          AND column_name = 'status'
        )
      `)

      const driverIdFieldExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'order_submissions' 
          AND column_name = 'driver_id'
        )
      `)

      const vehicleIdFieldExists = await dbQuery(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'order_submissions' 
          AND column_name = 'vehicle_id'
        )
      `)

      // Add whatsapp_sent field if it doesn't exist
      if (!whatsappFieldExists.rows[0].exists) {
        await dbQuery(`
          ALTER TABLE order_submissions 
          ADD COLUMN whatsapp_sent BOOLEAN DEFAULT FALSE
        `)
        console.log("Added whatsapp_sent field to order_submissions table")
      } else {
        console.log("whatsapp_sent field already exists")
      }

      // Add notification_sent field if it doesn't exist
      if (!notificationFieldExists.rows[0].exists) {
        await dbQuery(`
          ALTER TABLE order_submissions 
          ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE
        `)
        console.log("Added notification_sent field to order_submissions table")
      } else {
        console.log("notification_sent field already exists")
      }

      // Add status field if it doesn't exist
      if (!statusFieldExists.rows[0].exists) {
        await dbQuery(`
          ALTER TABLE order_submissions 
          ADD COLUMN status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'responded', 'confirmed', 'rejected'))
        `)
        console.log("Added status field to order_submissions table")
      } else {
        console.log("status field already exists")
      }

      // Add driver_id field if it doesn't exist
      if (!driverIdFieldExists.rows[0].exists) {
        await dbQuery(`
          ALTER TABLE order_submissions 
          ADD COLUMN driver_id INTEGER REFERENCES drivers(id)
        `)
        console.log("Added driver_id field to order_submissions table")
      } else {
        console.log("driver_id field already exists")
      }

      // Add vehicle_id field if it doesn't exist
      if (!vehicleIdFieldExists.rows[0].exists) {
        await dbQuery(`
          ALTER TABLE order_submissions 
          ADD COLUMN vehicle_id INTEGER REFERENCES trucks(id)
        `)
        console.log("Added vehicle_id field to order_submissions table")
      } else {
        console.log("vehicle_id field already exists")
      }
    }

    return NextResponse.json({ 
      message: "Migration completed successfully - order_submissions table updated with whatsapp_sent, notification_sent, status, driver_id, and vehicle_id fields",
      success: true
    })

  } catch (error) {
    console.error("Migration error:", error)
    return NextResponse.json({ 
      error: "Migration failed", 
      details: error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : "Unknown error" 
    }, { status: 500 })
  }
}
