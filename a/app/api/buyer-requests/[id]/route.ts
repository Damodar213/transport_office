import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// GET - Fetch a specific buyer request by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    if (!getPool()) {
    }

    const id = (await params).id

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
      const response = NextResponse.json({ 
        error: "Buyer request not found" 
 
 
 
        }

        }

        }

    }

    const response = NextResponse.json({
      success: true,
      data: result.rows[0]})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error fetching buyer request:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch buyer request",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }

// PUT - Update a buyer request (for admin operations)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    if (!getPool()) {
    }

    const id = (await params).id
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
      const response = NextResponse.json({ 
        error: "No fields to update" 
 
 
 
        }

        }

        }

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
      const response = NextResponse.json({ 
        error: "Buyer request not found" 
 
 
 
        }

        }

        }

    }

    const updatedRequest = result.rows[0]

    // Create notification for admin when buyer submits order (status changes to 'pending')
    if (status === 'pending') {
      try {
        console.log("Creating notification for new buyer order submission...")
        
        // Get buyer details for the notification
        const buyerResult = await dbQuery(
          "SELECT b.company_name, u.name FROM buyers b LEFT JOIN users u ON b.user_id = u.user_id WHERE b.user_id = $1",
          [updatedRequest.buyer_id]
        )
        
        const buyerDetails = buyerResult.rows.length > 0 
          ? buyerResult.rows[0]
          : { company_name: "Unknown Company", name: "Unknown Buyer" }

        const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/api/admin/transport-request-notifications`, {
          method: 'POST',
          headers: {



          }

          }

          }

            'Content-Type': 'application/json',
          },
          body: JSON.stringify({



          }

          }

          }

            type: "info",
            title: "New Buyer Order Submitted",
            message: `New transport order ${updatedRequest.order_number} submitted by ${buyerDetails.company_name} (${buyerDetails.name}). Load: ${updatedRequest.load_type}, Route: ${updatedRequest.from_place} → ${updatedRequest.to_place}${updatedRequest.estimated_tons ? `, ${updatedRequest.estimated_tons} tons` : ''}${updatedRequest.number_of_goods ? `, ${updatedRequest.number_of_goods} goods` : ''}${updatedRequest.delivery_place ? `, Delivery: ${updatedRequest.delivery_place}` : ''}`,
            category: "order",
            priority: "high",
            orderId: updatedRequest.id,
            buyerId: updatedRequest.buyer_id,
            status: status



            }

            }

            }

          })
        })

        if (notificationResponse.ok) {
          console.log("✅ Notification created successfully for buyer order submission")
        } else {
          console.error("❌ Failed to create notification:", await notificationResponse.text())
        }

      } catch (notificationError) {
        console.error("Error creating notification for buyer order submission:", notificationError)
        // Don't fail the main operation if notification creation fails
      }

    }

    const response = NextResponse.json({
      success: true,
      message: "Buyer request updated successfully",
      data: updatedRequest})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error updating buyer request:", error)
    const response = NextResponse.json({ 
      error: "Failed to update buyer request",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }

// DELETE - Delete a buyer request (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }

) {
  try {
    if (!getPool()) {
    }

    const id = (await params).id

    const result = await dbQuery(`
      DELETE FROM buyer_requests 
      WHERE id = $1 
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      const response = NextResponse.json({ 
        error: "Buyer request not found" 
 
 
 
        }

        }

        }

    }

    const response = NextResponse.json({
      success: true,
      message: "Buyer request deleted successfully"})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error deleting buyer request:", error)
    const response = NextResponse.json({ 
      error: "Failed to delete buyer request",
      details: error instanceof Error ? error.message : "Unknown error"



      }

      }

      }

  })
    return addCorsHeaders(response)
  }
