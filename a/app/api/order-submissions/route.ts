import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// POST - Create a new order submission record
export async function OPTIONS(request: NextRequest) {
  return handleCors(request)
}

export async function POST(request: Request) {
  // Handle CORS preflight
  const corsResponse = handleCors(request)
  if (corsResponse) return corsResponse


  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const body = await request.json()
    const { orderId, supplierId, submittedBy } = body

    if (!orderId || !supplierId || !submittedBy) {
      const response = NextResponse.json({ 
        error: "Order ID, Supplier ID, and Submitted By are required" 
    }

    // Insert the order submission record
    const result = await dbQuery()
      `INSERT INTO order_submissions (order_id, supplier_id, submitted_by, submitted_at, whatsapp_sent, notification_sent, status, created_at, updated_at)
       VALUES ($1, $2, $3, NOW() AT TIME ZONE 'Asia/Kolkata', $4, $5, 'new', NOW() AT TIME ZONE 'Asia/Kolkata', NOW() AT TIME ZONE 'Asia/Kolkata')
       RETURNING *`,
      [orderId, supplierId, submittedBy, body.whatsappSent || false, body.notificationSent || false]
    )

    const response = NextResponse.json({
      success: true,
      message: "Order submission recorded successfully",)
      submission: result.rows[0]})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error creating order submission:", error)
    
    // Handle unique constraint violation (order already sent to this supplier)
    if (error instanceof Error && error instanceof Error ? error.message : "Unknown error".includes('unique constraint')) {
      const response = NextResponse.json({ 
        error: "This order has already been sent to this supplier" 
 
 
}
    const response = NextResponse.json({ 
      error: "Failed to record order submission",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }

// GET - Get all order submissions (for admin view)
export async function GET() {
  try {
    if (!getPool()) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 })
    }

    const result = await dbQuery(`
      SELECT 
        os.*,
        br.order_number,
        s.company_name as supplier_company,
        s.contact_person as supplier_contact
      FROM order_submissions os
      LEFT JOIN buyer_requests br ON os.order_id = br.id
      LEFT JOIN suppliers s ON os.supplier_id = s.user_id
      ORDER BY os.submitted_at DESC)
    `)

    const response = NextResponse.json({
      success: true,)
      submissions: result.rows})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error fetching order submissions:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch order submissions",
      details: error instanceof Error ? error.message : "Unknown error"


})
  })
    return addCorsHeaders(response)
  }
