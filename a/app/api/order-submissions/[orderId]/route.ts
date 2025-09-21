import { NextResponse } from "next/server"
import { handleCors, addCorsHeaders } from "@/lib/cors"
import { dbQuery, getPool } from "@/lib/db"

// GET - Get all submissions for a specific order
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    if (!getPool()) {
    }

    const { orderId: orderIdStr } = await params
    const orderId = parseInt(orderIdStr)
    if (isNaN(orderId)) {
    }

    const result = await dbQuery(`
      SELECT 
        os.*,
        s.company_name as supplier_company,
        s.contact_person as supplier_contact,
        s.mobile as supplier_mobile,
        s.whatsapp as supplier_whatsapp
      FROM order_submissions os
      LEFT JOIN suppliers s ON os.supplier_id = s.user_id
      WHERE os.order_id = $1
      ORDER BY os.submitted_at DESC
    `, [orderId])

    const response = NextResponse.json({
      success: true,
      submissions: result.rows})
    return addCorsHeaders(response)

  } catch (error) {
    console.error("Error fetching order submissions:", error)
    const response = NextResponse.json({ 
      error: "Failed to fetch order submissions",
      details: error instanceof Error ? error.message : "Unknown error"
  })
    return addCorsHeaders(response)
  }