import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// Helper function to format timestamp (exact same as buyer notifications)
function formatTimestamp(timestamp: string | Date): string {
  try {
    // Parse the timestamp and ensure it's treated as IST
    let created: Date
    
    if (typeof timestamp === 'string') {
      // If it's a string, parse it and assume it's in IST
      created = new Date(timestamp)
    } else {
      created = timestamp
    }
    
    // Check if timestamp is valid
    if (isNaN(created.getTime())) {
      console.error("Invalid timestamp:", timestamp)
      return "Invalid time"
    }
    
    // Format the date in IST (don't double-convert)
    const formattedDate = created.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })
    
    // Calculate relative time using current IST time
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    
    // If it's very recent (within 1 minute), show "Just now"
    if (Math.abs(diffMs) < 60000) {
      return "Just now"
    }
    
    // If it's within 24 hours (past or future), show relative time + actual time
    if (Math.abs(diffMs) < 24 * 60 * 60 * 1000) {
      const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60))
      const diffHours = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60))
      
      if (diffMins < 60) {
        const timeText = diffMs > 0 ? `${diffMins} minute${diffMins === 1 ? '' : 's'} ago` : `in ${diffMins} minute${diffMins === 1 ? '' : 's'}`
        return `${timeText} (${formattedDate})`
      } else {
        const timeText = diffMs > 0 ? `${diffHours} hour${diffHours === 1 ? '' : 's'} ago` : `in ${diffHours} hour${diffHours === 1 ? '' : 's'}`
        return `${timeText} (${formattedDate})`
      }
    }
    
    // For older notifications, show the full date and time
    return formattedDate
    
  } catch (error) {
    console.error("Error formatting timestamp:", error)
    // Fallback: show the raw timestamp in IST
    try {
      const fallbackDate = new Date(timestamp)
      return fallbackDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      })
    } catch {
      return "Time unavailable"
    }
  }
}

// GET - Fetch all supplier vehicle location notifications
export async function GET() {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    console.log("Fetching supplier vehicle location notifications...")

    // Check if table exists
    const tableExists = await dbQuery(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'supplier_vehicle_location_notifications'
      )
    `)

    if (!tableExists.rows[0].exists) {
      console.log("supplier_vehicle_location_notifications table does not exist")
      return NextResponse.json({ notifications: [] })
    }

    // Fetch notifications from the database
    const result = await dbQuery(`
      SELECT 
        id,
        vehicle_location_id,
        supplier_id,
        supplier_name,
        supplier_company,
        state,
        district,
        place,
        taluk,
        vehicle_number,
        body_type,
        driver_name,
        status,
        is_read,
        created_at,
        updated_at,
        recommended_location
      FROM supplier_vehicle_location_notifications
      ORDER BY created_at DESC
    `)

    console.log(`Found ${result.rows.length} supplier vehicle location notifications`)

    const notifications = result.rows.map(row => {
      try {
        return {
          id: row.id.toString(),
          type: "info",
          title: "New Vehicle Location Request",
          message: `New vehicle location request from ${row.supplier_name} for vehicle ${row.vehicle_number}`,
          timestamp: formatTimestamp(row.created_at),
          isRead: row.is_read,
          category: "supplier_order",
          priority: "medium",
          vehicleLocationId: row.vehicle_location_id,
          supplierId: row.supplier_id,
          supplierName: row.supplier_name,
          supplierCompany: row.supplier_company,
          location: `${row.place}, ${row.district}, ${row.state}`,
          vehicleNumber: row.vehicle_number,
          bodyType: row.body_type,
          driverName: row.driver_name,
          status: row.status,
          recommendedLocation: row.recommended_location
        }
      } catch (mapError) {
        console.error("Error mapping notification row:", mapError, row)
        return null
      }
    }).filter(Boolean) // Remove any null entries

    console.log(`Returning ${notifications.length} notifications`)
    return NextResponse.json({ notifications })

  } catch (error) {
    console.error("Error fetching supplier vehicle location notifications:", error)
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// POST - Create a new supplier vehicle location notification
export async function POST(request: Request) {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const {
      vehicle_location_id,
      supplier_id,
      supplier_name,
      supplier_company,
      state,
      district,
      place,
      taluk,
      vehicle_number,
      body_type,
      driver_name,
      status = 'pending',
      recommended_location = null
    } = body

    // Validate required fields
    if (!vehicle_location_id || !supplier_id || !supplier_name || !state || !district || !place || !vehicle_number || !body_type) {
      return NextResponse.json({ 
        error: "Missing required fields" 
      }, { status: 400 })
    }

    // Check if notification already exists for this vehicle location
    const existingNotification = await dbQuery(`
      SELECT id FROM supplier_vehicle_location_notifications 
      WHERE vehicle_location_id = $1
    `, [vehicle_location_id])

    if (existingNotification.rows.length > 0) {
      return NextResponse.json({ 
        error: "Notification already exists for this vehicle location" 
      }, { status: 409 })
    }

    // Insert new notification
    const result = await dbQuery(`
      INSERT INTO supplier_vehicle_location_notifications (
        vehicle_location_id, supplier_id, supplier_name, supplier_company, state, district, place, taluk,
        vehicle_number, body_type, driver_name, status, is_read, created_at, updated_at, recommended_location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata', $14)
      RETURNING id, created_at
    `, [
      vehicle_location_id, supplier_id, supplier_name, supplier_company, state, district, place, taluk,
      vehicle_number.toUpperCase(), body_type, driver_name, status, false, recommended_location  // is_read = false (unread)
    ])

    const newNotification = {
      id: result.rows[0].id.toString(),
      type: "info",
      title: "New Vehicle Location Request",
      message: `New vehicle location request from ${supplier_name} for vehicle ${vehicle_number}`,
      timestamp: formatTimestamp(result.rows[0].created_at),
      isRead: false,
      category: "supplier_order",
      priority: "medium",
      vehicleLocationId: vehicle_location_id,
      supplierId: supplier_id,
      supplierName: supplier_name,
      supplierCompany: supplier_company,
      location: `${place}, ${district}, ${state}`,
      vehicleNumber: vehicle_number,
      bodyType: body_type,
      driverName: driver_name,
      status: status
    }

    console.log("Created new supplier vehicle location notification:", newNotification.id)

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification
    })

  } catch (error) {
    console.error("Error creating supplier vehicle location notification:", error)
    return NextResponse.json({ 
      error: "Failed to create notification",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

