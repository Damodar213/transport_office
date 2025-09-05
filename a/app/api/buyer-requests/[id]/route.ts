import { NextResponse } from "next/server"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch a specific buyer request by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!getPool()) {
      console.log("Database not available, cannot fetch buyer request")
      return NextResponse.json({ 
        error: "Database not available - cannot fetch buyer request without database" 
      }, { status: 503 })
    }

    const id = params.id

    const result = await dbQuery(`
      SELECT 
        br.*,
        b.company_name as buyer_company,
        u.name as buyer_name,
        u.email as buyer_email,
        u.mobile as buyer_mobile,
        s.company_name as supplier_company,
        d.driver_name,
        t.vehicle_number,
        t.body_type
      FROM buyer_requests br
      LEFT JOIN buyers b ON br.buyer_id = b.user_id
      LEFT JOIN users u ON br.buyer_id = u.user_id
      LEFT JOIN suppliers s ON br.supplier_id = s.user_id
      LEFT JOIN drivers d ON br.driver_id = d.id
      LEFT JOIN trucks t ON br.vehicle_id = t.id
      WHERE br.id = $1
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Buyer request not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error("Error fetching buyer request:", error)
    return NextResponse.json({ 
      error: "Failed to fetch buyer request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// PUT - Update a buyer request (for admin operations)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!getPool()) {
      console.log("Database not available, cannot update buyer request")
      return NextResponse.json({ 
        error: "Database not available - cannot update buyer request without database" 
      }, { status: 503 })
    }

    const id = params.id
    const body = await request.json()
    const {
      status,
      supplier_id,
      driver_id,
      vehicle_id,
      rate,
      distance_km,
      admin_notes,
      assigned_by,
      pickup_date,
      delivery_date,
      estimated_delivery_date
    } = body

    // Build update query dynamically based on provided fields
    const updateFields: string[] = []
    const updateValues: any[] = []
    let paramCount = 0

    if (status !== undefined) {
      paramCount++
      updateFields.push(`status = $${paramCount}`)
      updateValues.push(status)
    }

    if (supplier_id !== undefined) {
      paramCount++
      updateFields.push(`supplier_id = $${paramCount}`)
      updateValues.push(supplier_id)
    }

    if (driver_id !== undefined) {
      paramCount++
      updateFields.push(`driver_id = $${paramCount}`)
      updateValues.push(driver_id)
    }

    if (vehicle_id !== undefined) {
      paramCount++
      updateFields.push(`vehicle_id = $${paramCount}`)
      updateValues.push(vehicle_id)
    }

    if (rate !== undefined) {
      paramCount++
      updateFields.push(`rate = $${paramCount}`)
      updateValues.push(rate)
    }

    if (distance_km !== undefined) {
      paramCount++
      updateFields.push(`distance_km = $${paramCount}`)
      updateValues.push(distance_km)
    }

    if (admin_notes !== undefined) {
      paramCount++
      updateFields.push(`admin_notes = $${paramCount}`)
      updateValues.push(admin_notes)
    }

    if (assigned_by !== undefined) {
      paramCount++
      updateFields.push(`assigned_by = $${paramCount}`)
      updateValues.push(assigned_by)
    }

    if (pickup_date !== undefined) {
      paramCount++
      updateFields.push(`pickup_date = $${paramCount}`)
      updateValues.push(pickup_date)
    }

    if (delivery_date !== undefined) {
      paramCount++
      updateFields.push(`delivery_date = $${paramCount}`)
      updateValues.push(delivery_date)
    }

    if (estimated_delivery_date !== undefined) {
      paramCount++
      updateFields.push(`estimated_delivery_date = $${paramCount}`)
      updateValues.push(estimated_delivery_date)
    }

    // Add timestamp updates
    paramCount++
    updateFields.push(`updated_at = $${paramCount}`)
    updateValues.push(new Date().toISOString())

    // Add status-specific timestamp updates
    if (status === 'assigned') {
      paramCount++
      updateFields.push(`assigned_at = $${paramCount}`)
      updateValues.push(new Date().toISOString())
    }

    if (status === 'confirmed') {
      paramCount++
      updateFields.push(`confirmed_at = $${paramCount}`)
      updateValues.push(new Date().toISOString())
    }



    if (updateFields.length === 0) {
      return NextResponse.json({ 
        error: "No fields to update" 
      }, { status: 400 })
    }

    // Add the ID parameter
    paramCount++
    updateValues.push(id)

    const query = `
      UPDATE buyer_requests 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await dbQuery(query, updateValues)

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Buyer request not found" 
      }, { status: 404 })
    }

    const updatedRequest = result.rows[0]

    // Create notification only when status is changed to "submitted"
    if (status === 'submitted') {
      try {
        console.log("Creating notification for submitted request...")
        
        // Get buyer details for the notification
        const buyerResult = await dbQuery(`
          SELECT u.name as buyer_name
          FROM users u 
          WHERE u.user_id = $1
        `, [updatedRequest.buyer_id])
        
        let buyerName = buyerResult.rows.length > 0 && buyerResult.rows[0].buyer_name 
          ? buyerResult.rows[0].buyer_name 
          : updatedRequest.buyer_id
        
        // Ensure buyer name is never null or undefined
        if (!buyerName || buyerName === 'null' || buyerName === 'undefined') {
          buyerName = updatedRequest.buyer_id
        }
        
        console.log(`Buyer name resolved: ${buyerName}`)
        
        // Create location strings
        const fromLocation = `${updatedRequest.from_place}, ${updatedRequest.from_district}, ${updatedRequest.from_state}`
        const toLocation = `${updatedRequest.to_place}, ${updatedRequest.to_district}, ${updatedRequest.to_state}`
        console.log(`From: ${fromLocation}, To: ${toLocation}`)
        
        // Check if transport_request_notifications table exists, create if not
        const tableExists = await dbQuery(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'transport_request_notifications'
          )
        `)
        
        console.log(`Table exists: ${tableExists.rows[0].exists}`)
        
        if (!tableExists.rows[0].exists) {
          console.log("Creating transport_request_notifications table...")
          await dbQuery(`
            CREATE TABLE transport_request_notifications (
              id SERIAL PRIMARY KEY,
              order_number VARCHAR(50) NOT NULL,
              load_type VARCHAR(100) NOT NULL,
              buyer_name VARCHAR(100) NOT NULL,
              buyer_id VARCHAR(50) NOT NULL,
              from_location TEXT NOT NULL,
              to_location TEXT NOT NULL,
              estimated_tons DECIMAL(10,2),
              number_of_goods INTEGER,
              delivery_place VARCHAR(255) NOT NULL,
              required_date DATE,
              special_instructions TEXT,
              status VARCHAR(50) DEFAULT 'pending',
              is_read BOOLEAN DEFAULT FALSE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata',
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() AT TIME ZONE 'Asia/Kolkata'
            )
          `)
          console.log("Created transport_request_notifications table")
        }
        
        // Check if notification already exists for this order
        const existingNotification = await dbQuery(`
          SELECT id FROM transport_request_notifications 
          WHERE order_number = $1
        `, [updatedRequest.order_number])
        
        console.log(`Existing notifications for ${updatedRequest.order_number}: ${existingNotification.rows.length}`)
        
        if (existingNotification.rows.length === 0) {
          console.log("Inserting new notification for submitted request...")
          // Insert new notification directly into the database with explicit timestamp in IST
          const insertResult = await dbQuery(`
            INSERT INTO transport_request_notifications (
              order_number, load_type, buyer_name, buyer_id, from_location, to_location,
              estimated_tons, number_of_goods, delivery_place, required_date, special_instructions,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
            RETURNING id, created_at
          `, [
            updatedRequest.order_number, updatedRequest.load_type, buyerName, updatedRequest.buyer_id, fromLocation, toLocation,
            updatedRequest.estimated_tons, updatedRequest.number_of_goods, updatedRequest.delivery_place, updatedRequest.required_date, updatedRequest.special_instructions
          ])
          
          console.log(`Notification created successfully with ID: ${insertResult.rows[0].id} at ${insertResult.rows[0].created_at}`)
        } else {
          console.log(`Notification already exists for order ${updatedRequest.order_number}`)
        }
      } catch (notificationError) {
        console.error("Failed to create notification:", notificationError)
        console.error("Error details:", notificationError instanceof Error ? notificationError.message : "Unknown error")
        // Don't fail the main request if notification creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Buyer request updated successfully",
      data: updatedRequest
    })

  } catch (error) {
    console.error("Error updating buyer request:", error)
    return NextResponse.json({ 
      error: "Failed to update buyer request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// DELETE - Delete a buyer request (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!getPool()) {
      console.log("Database not available, cannot delete buyer request")
      return NextResponse.json({ 
        error: "Database not available - cannot delete buyer request without database" 
      }, { status: 503 })
    }

    const id = params.id

    const result = await dbQuery(`
      DELETE FROM buyer_requests 
      WHERE id = $1 
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ 
        error: "Buyer request not found" 
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Buyer request deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting buyer request:", error)
    return NextResponse.json({ 
      error: "Failed to delete buyer request",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

